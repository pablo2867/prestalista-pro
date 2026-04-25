// app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// 🔑 Crear cliente solo si existen las claves
const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase no configurado' }, { status: 500 })
    }

    const query = request.nextUrl.searchParams.get('q')?.trim()

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, results: { prestamos: [], prestatarios: [], leads: [], pagos: [] }, total: 0 })
    }

    console.log('🔍 Buscando en API:', query)
    const pattern = `%${query}%`

    // ==========================================
    // 🔍 BÚSQUEDA 1: PRESTATARIOS (Estrategia simplificada)
    // ==========================================
    let prestatariosEncontrados: any[] = []

    // 1. Buscar por Nombre
    const {  data: porNombre } = await supabase
      .from('prestatarios')
      .select('id, nombre, apellido, telefono, email, estado')
      .ilike('nombre', pattern)
      .limit(10)
    
    if (porNombre) prestatariosEncontrados = [...prestatariosEncontrados, ...porNombre]

    // 2. Buscar por Apellido (y unir resultados evitando duplicados)
    const {  data: porApellido } = await supabase
      .from('prestatarios')
      .select('id, nombre, apellido, telefono, email, estado')
      .ilike('apellido', pattern)
      .limit(10)

    if (porApellido) {
      porApellido.forEach(item => {
        if (!prestatariosEncontrados.find(p => p.id === item.id)) {
          prestatariosEncontrados.push(item)
        }
      })
    }

    console.log('✅ Prestatarios encontrados:', prestatariosEncontrados.length)

    // ==========================================
    // 🔍 BÚSQUEDA 2: LEADS (Simple)
    // ==========================================
    const {  leads } = await supabase
      .from('leads')
      .select('id, nombre, apellido, telefono, origen, estado')
      .or(`nombre.ilike.${pattern},apellido.ilike.${pattern}`) // Leads suele funcionar con .or()
      .limit(10)

    // ==========================================
    // 🔍 BÚSQUEDA 3: PRÉSTAMOS (Vía IDs de prestatarios)
    // ==========================================
    let prestamos = []
    if (prestatariosEncontrados.length > 0) {
      const ids = prestatariosEncontrados.map(p => p.id)
      const {  data } = await supabase
        .from('prestamos')
        .select(`
          id, monto_principal, saldo_pendiente, estado,
          prestatario:prestatarios(nombre, apellido)
        `)
        .in('prestatario_id', ids)
        .limit(10)
      
      if (data) prestamos = data
    }

    // ==========================================
    // 🔍 BÚSQUEDA 4: PAGOS (Vía IDs de préstamos)
    // ==========================================
    let pagos = []
    if (prestatariosEncontrados.length > 0) {
      // Necesitamos los IDs de préstamos de estos clientes
      const {  loanData } = await supabase
        .from('prestamos')
        .select('id')
        .in('prestatario_id', prestatariosEncontrados.map(p => p.id))
      
      const loanIds = loanData?.map((l: any) => l.id) || []
      
      if (loanIds.length > 0) {
        const {  data } = await supabase
          .from('pagos')
          .select(`
            id, monto, fecha_pago,
            prestamo:prestamos(id, prestatario:prestatarios(nombre, apellido))
          `)
          .in('prestamo_id', loanIds)
          .limit(10)
        
        if (data) pagos = data
      }
    }

    return NextResponse.json({
      success: true,
      results: {
        prestamos,
        prestatarios: prestatariosEncontrados,
        leads: leads || [],
        pagos
      },
      total: prestamos.length + prestatariosEncontrados.length + (leads?.length || 0) + pagos.length
    })

  } catch (error: any) {
    console.error('❌ Error API Search:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
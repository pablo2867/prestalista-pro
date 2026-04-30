// app/api/search/route.ts - VERSIÓN CON DEBUG LOGGING
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // 🔍 DEBUG: Verificar variables de entorno
    const hasAnon = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const hasService = !!process.env.SUPABASE_SERVICE_ROLE_KEY
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    
    console.log('🔍 [Search API] Config:', { 
      hasAnon, 
      hasService: hasService ? '✅ YES' : '❌ NO',
      url: url ? '✅ SET' : '❌ MISSING'
    })

    // 👇 Usar SERVICE_ROLE_KEY si existe, sino fallback a ANON
    const supabaseKey = hasService 
      ? process.env.SUPABASE_SERVICE_ROLE_KEY! 
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey
    )

    const query = request.nextUrl.searchParams.get('q')?.trim()
    
    if (!query || query.length < 2) {
      return NextResponse.json({ 
        success: true, 
        results: { prestamos: [], prestatarios: [], leads: [], pagos: [], distribuidores: [] },
        total: 0 
      })
    }

    console.log(`🔍 [Search API] Buscando: "${query}"`)
    const results: any = {}
    const pattern = `%${query}%`

    // 🔍 1. PRESTATARIOS
    const {  prestatarios, error: err1 } = await supabase
      .from('prestatarios')
      .select('id, nombre, apellido, telefono, email, estado')
      .ilike('nombre', pattern)
      .limit(5)
    
    console.log(`✅ Prestatarios: ${prestatarios?.length || 0} encontrados`, err1 ? `Error: ${err1.message}` : '')
    results.prestatarios = prestatarios || []

    // 🔍 2. DISTRIBUIDORES ← EL QUE NOS INTERESA
    const {  distribuidores, error: err2 } = await supabase
      .from('distribuidores')
      .select('id, nombre, email, telefono, comision_porcentaje, estado')
      .ilike('nombre', pattern)
      .limit(5)
    
    console.log(`✅ Distribuidores: ${distribuidores?.length || 0} encontrados`, err2 ? `Error: ${err2.message}` : '')
    console.log(`📦 Datos distribuidores:`, distribuidores) // ← Esto mostrará los datos si los hay
    results.distribuidores = distribuidores || []

    // 🔍 3. LEADS
    const {  leads, error: err3 } = await supabase
      .from('leads')
      .select('id, nombre, apellido, telefono, origen, estado')
      .ilike('nombre', pattern)
      .limit(5)
    console.log(`✅ Leads: ${leads?.length || 0} encontrados`)
    results.leads = leads || []

    // 🔍 4. PRÉSTAMOS
    const {  prestamos, error: err4 } = await supabase
      .from('prestamos')
      .select('id, monto_principal, estado')
      .ilike('estado', pattern)
      .limit(5)
    console.log(`✅ Préstamos: ${prestamos?.length || 0} encontrados`)
    results.prestamos = prestamos || []

    // 🔍 5. PAGOS
    const {  pagos, error: err5 } = await supabase
      .from('pagos')
      .select('id, monto, fecha_pago')
      .limit(5)
    console.log(`✅ Pagos: ${pagos?.length || 0} encontrados`)
    results.pagos = pagos || []

    const total = Object.values(results).reduce((sum: number, arr: any) => 
      sum + (Array.isArray(arr) ? arr.length : 0), 0)

    console.log(`🎯 Total resultados: ${total}`)
    return NextResponse.json({ success: true, results, total })

  } catch (error: any) {
    console.error('❌ Search API Critical Error:', error)
    return NextResponse.json({ 
      success: true,
      results: { prestamos: [], prestatarios: [], leads: [], pagos: [], distribuidores: [] },
      total: 0
    })
  }
}
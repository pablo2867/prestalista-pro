// app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')?.toLowerCase().trim()

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, results: { prestamos: [], prestatarios: [], leads: [], pagos: [] } })
    }

    // 🔍 Buscar en Préstamos (por ID o monto)
    const {  prestamos } = await supabase
      .from('prestamos')
      .select(`
        id,
        monto_principal,
        monto_total,
        saldo_pendiente,
        estado,
        created_at,
        prestatario:prestatarios (
          nombre,
          apellido
        )
      `)
      .or(`monto_principal.ilike.%${query}%,id.ilike.%${query}%`)
      .limit(5)

    // 🔍 Buscar en Prestatarios (por nombre, teléfono, email)
    const {  prestatarios } = await supabase
      .from('prestatarios')
      .select('*')
      .or(`nombre.ilike.%${query}%,apellido.ilike.%${query}%,telefono.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(5)

    // 🔍 Buscar en Leads (por nombre, teléfono)
    const {  leads } = await supabase
      .from('leads')
      .select('*')
      .or(`nombre.ilike.%${query}%,apellido.ilike.%${query}%,telefono.ilike.%${query}%`)
      .limit(5)

    // 🔍 Buscar en Pagos (por monto)
    const {  pagos } = await supabase
      .from('pagos')
      .select(`
        id,
        monto,
        fecha_pago,
        tipo,
        prestamo:prestamos (
          prestatario:prestatarios (
            nombre,
            apellido
          )
        )
      `)
      .ilike('monto', `%${query}%`)
      .limit(5)

    return NextResponse.json({
      success: true,
      results: {
        prestamos: prestamos || [],
        prestatarios: prestatarios || [],
        leads: leads || [],
        pagos: pagos || []
      },
      total: (prestamos?.length || 0) + (prestatarios?.length || 0) + (leads?.length || 0) + (pagos?.length || 0)
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
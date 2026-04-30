// app/api/search/route.ts - VERSIÓN DEBUG CON SERVICE ROLE KEY
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // 👇 Usar SERVICE_ROLE_KEY para omitir RLS (solo desarrollo)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!  // ← Clave con acceso total
    )

    const query = request.nextUrl.searchParams.get('q')?.trim()
    
    if (!query || query.length < 2) {
      return NextResponse.json({ 
        success: true, 
        results: { prestamos: [], prestatarios: [], leads: [], pagos: [], distribuidores: [] },
        total: 0 
      })
    }

    const results: any = {}
    const pattern = `%${query}%`

    // 🔍 Consultas simples sin joins complejos
    const {  prestatarios } = await supabase
      .from('prestatarios')
      .select('id, nombre, apellido, telefono, email, estado')
      .ilike('nombre', pattern)
      .limit(5)
    results.prestatarios = prestatarios || []

    const {  distribuidores } = await supabase
      .from('distribuidores')
      .select('id, nombre, email, telefono, comision_porcentaje, estado')
      .ilike('nombre', pattern)
      .limit(5)
    results.distribuidores = distribuidores || []

    const {  leads } = await supabase
      .from('leads')
      .select('id, nombre, apellido, telefono, origen, estado')
      .ilike('nombre', pattern)
      .limit(5)
    results.leads = leads || []

    const {  prestamos } = await supabase
      .from('prestamos')
      .select('id, monto_principal, estado')
      .ilike('estado', pattern)
      .limit(5)
    results.prestamos = prestamos || []

    const {  pagos } = await supabase
      .from('pagos')
      .select('id, monto, fecha_pago')
      .limit(5)
    results.pagos = pagos || []

    const total = Object.values(results).reduce((sum: number, arr: any) => 
      sum + (Array.isArray(arr) ? arr.length : 0), 0)

    return NextResponse.json({ success: true, results, total })

  } catch (error: any) {
    console.error('❌ Search API Error:', error)
    return NextResponse.json({ 
      success: true,
      results: { prestamos: [], prestatarios: [], leads: [], pagos: [], distribuidores: [] },
      total: 0
    })
  }
}
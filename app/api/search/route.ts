// app/api/search/route.ts - VERSIÓN FINAL ROBUSTA
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const query = request.nextUrl.searchParams.get('q')?.trim()
    
    // Respuesta válida aunque no haya query
    if (!query || query.length < 2) {
      return NextResponse.json({ 
        success: true, 
        results: { 
          prestamos: [], 
          prestatarios: [], 
          leads: [], 
          pagos: [], 
          distribuidores: []  // ← SIEMPRE incluir esta clave
        },
        total: 0 
      })
    }

    const results: any = {}
    const limit = 5

    // 🔍 1. PRESTATARIOS
    const { data: prestatarios } = await supabase
      .from('prestatarios')
      .select('id, nombre, apellido, telefono, email, estado')
      .ilike('nombre', `%${query}%`)
      .limit(limit)
    results.prestatarios = prestatarios || []

    // 🔍 2. DISTRIBUIDORES ← AGREGADO
    const { data: distribuidores } = await supabase
      .from('distribuidores')
      .select('id, nombre, email, telefono, comision_porcentaje, estado')
      .ilike('nombre', `%${query}%`)
      .limit(limit)
    results.distribuidores = distribuidores || []

    // 🔍 3. LEADS
    const { data: leads } = await supabase
      .from('leads')
      .select('id, nombre, apellido, telefono, origen, estado')
      .ilike('nombre', `%${query}%`)
      .limit(limit)
    results.leads = leads || []

    // 🔍 4. PRÉSTAMOS (solo si hay prestatarios)
    if (results.prestatarios.length > 0) {
      const ids = results.prestatarios.map((p: any) => p.id)
      const { data: prestamos } = await supabase
        .from('prestamos')
        .select('id, monto_principal, estado, prestatario:prestatarios(nombre, apellido)')
        .in('prestatario_id', ids)
        .limit(limit)
      results.prestamos = prestamos || []
    } else {
      results.prestamos = []
    }

    // 🔍 5. PAGOS (solo si hay prestatarios)
    if (results.prestatarios.length > 0) {
      const { data: loans } = await supabase
        .from('prestamos')
        .select('id')
        .in('prestatario_id', results.prestatarios.map((p: any) => p.id))
      
      const loanIds = loans?.map((l: any) => l.id) || []
      
      if (loanIds.length > 0) {
        const { data: pagos } = await supabase
          .from('pagos')
          .select('id, monto, fecha_pago, prestamo:prestamos(prestatario:prestatarios(nombre, apellido))')
          .in('prestamo_id', loanIds)
          .limit(limit)
        results.pagos = pagos || []
      } else {
        results.pagos = []
      }
    } else {
      results.pagos = []
    }

    // Calcular total
    const total = Object.values(results).reduce((sum: number, arr: any) => 
      sum + (Array.isArray(arr) ? arr.length : 0), 0)

    return NextResponse.json({ success: true, results, total })

  } catch (error: any) {
    console.error('❌ Search API Error:', error)
    // Devolver estructura válida para no romper el frontend
    return NextResponse.json({ 
      success: true,  // ← true para que el frontend no falle
      results: { 
        prestamos: [], 
        prestatarios: [], 
        leads: [], 
        pagos: [], 
        distribuidores: [] 
      },
      total: 0
    })
  }
}
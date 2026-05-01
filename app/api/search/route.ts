// app/api/search/route.ts - DIAGNÓSTICO CORREGIDO Y FUNCIONAL
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'Faltan variables de entorno' }, { status: 500 })
  }

  // ✅ Cliente con SERVICE_ROLE_KEY
  const supabase = createClient(url, serviceKey)
  const query = request.nextUrl.searchParams.get('q')?.trim()

  try {
    // 🔍 1. PRUEBA DE CONEXIÓN REAL (Trae 1 dato para confirmar)
    const {  testConnection, error: connError } = await supabase
      .from('distribuidores')
      .select('id, nombre')
      .limit(1)

    if (connError) throw connError

    // 🔍 2. BÚSQUEDA REAL
    const {  results, error: searchError } = await supabase
      .from('distribuidores')
      .select('id, nombre, email')
      .ilike('nombre', `%${query}%`)
      .limit(5)

    return NextResponse.json({
      success: true,
      debug: {
        connection: '✅ OK',
        primer_registro_encontrado: testConnection,
        error_busqueda: searchError?.message
      },
      results: { distribuidores: results || [] },
      total: results?.length || 0
    })

  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      success: false 
    }, { status: 500 })
  }
}
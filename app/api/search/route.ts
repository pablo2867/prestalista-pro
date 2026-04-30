// app/api/search/route.ts - DIAGNÓSTICO PRECISO
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // 🔴 VALIDACIÓN INICIAL
  if (!url || !serviceKey) {
    return NextResponse.json({ 
      error: 'Faltan variables de entorno',
      debug: {
        tieneUrl: !!url,
        tieneServiceKey: !!serviceKey,
        tieneAnonKey: !!anonKey,
        serviceKeyLength: serviceKey?.length || 0
      }
    }, { status: 500 })
  }

  // ✅ Crear cliente SOLO con SERVICE_ROLE_KEY (sin fallback)
  const supabase = createClient(url, serviceKey)

  const query = request.nextUrl.searchParams.get('q')?.trim()
  
  if (!query || query.length < 2) {
    return NextResponse.json({ success: true, results: {}, total: 0 })
  }

  try {
    // 🧪 PRUEBA 1: ¿Puede leer la tabla SIN filtros?
    const {  distTest, error: errTest } = await supabase
      .from('distribuidores')
      .select('id, nombre')
      .limit(3)

    if (errTest) {
      return NextResponse.json({ 
        error: 'No puede leer distribuidores',
        code: errTest.code,
        message: errTest.message,
        hint: errTest.hint
      }, { status: 500 })
    }

    // 🧪 PRUEBA 2: Búsqueda con ilike
    const {  distribuidores, error: errSearch } = await supabase
      .from('distribuidores')
      .select('id, nombre, email')
      .ilike('nombre', `%${query}%`)
      .limit(5)

    // 🧪 PRUEBA 3: Búsqueda alternativa con filter
    const {  distFilter } = await supabase
      .from('distribuidores')
      .select('id, nombre')
      .filter('nombre', 'ilike', `%${query}%`)
      .limit(5)

    return NextResponse.json({
      success: true,
      query,
      debug: {
        testSinFiltro: distTest?.length || 0,
        searchIlike: distribuidores?.length || 0,
        searchFilter: distFilter?.length || 0,
        ejemplos: distTest?.slice(0, 2) || []
      },
      results: {
        distribuidores: distribuidores || []
      },
      total: distribuidores?.length || 0
    })

  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
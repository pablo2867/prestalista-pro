// app/api/search/route.ts - DIAGNÓSTICO EXTREMO
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // 🔴 VALIDACIÓN CRÍTICA
  if (!url || !serviceKey || serviceKey.length < 100) {
    return NextResponse.json({ 
      error: 'SERVICE_ROLE_KEY inválida o faltante',
      debug: {
        urlLength: url?.length || 0,
        keyLength: serviceKey?.length || 0,
        keyStart: serviceKey?.substring(0, 20) + '...'
      }
    }, { status: 500 })
  }

  // ✅ Crear cliente SOLO con SERVICE_ROLE_KEY
  const supabase = createClient(url, serviceKey)

  const query = request.nextUrl.searchParams.get('q')?.trim()

  try {
    // 🧪 PRUEBA 0: ¿Podemos conectar?
    const {  health, error: errHealth } = await supabase
      .from('distribuidores')
      .select('count', { count: 'exact', head: true })
    
    // 🧪 PRUEBA 1: Leer TODOS los distribuidores (sin filtros)
    const {  allDist, error: errAll } = await supabase
      .from('distribuidores')
      .select('id, nombre, email')
      .limit(5)

    // 🧪 PRUEBA 2: Buscar con ilike
    const {  likeDist, error: errLike } = await supabase
      .from('distribuidores')
      .select('id, nombre, email')
      .ilike('nombre', `%${query || 'a'}%`)
      .limit(5)

    // 🧪 PRUEBA 3: Buscar con filter (alternativa)
    const {  filterDist, error: errFilter } = await supabase
      .from('distribuidores')
      .select('id, nombre, email')
      .filter('nombre', 'ilike', `%${query || 'a'}%`)
      .limit(5)

    // 🧪 PRUEBA 4: Verificar políticas RLS
    const {  policies } = await supabase
      .rpc('pg_policies')
      .select('tablename, policyname, cmd')
      .eq('tablename', 'distribuidores')

    return NextResponse.json({
      success: true,
      query,
      debug: {
        connection: health !== undefined ? '✅ OK' : '❌ FAIL',
        allDist: { count: allDist?.length, error: errAll?.message },
        likeSearch: { count: likeDist?.length, error: errLike?.message },
        filterSearch: { count: filterDist?.length, error: errFilter?.message },
        ejemplos: allDist?.slice(0, 2) || [],
        policies: policies?.length || 0
      },
      results: { distribuidores: likeDist || [] },
      total: likeDist?.length || 0
    })

  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      code: error.code,
      hint: error.hint,
      details: error.details
    }, { status: 500 })
  }
}
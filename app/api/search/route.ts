// app/api/search/route.ts - VERSIÓN MÍNIMA FUNCIONAL
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const query = request.nextUrl.searchParams.get('q')?.trim()

  // Si no hay query, devolver vacío (sin error)
  if (!query || query.length < 2) {
    return NextResponse.json({ success: true, results: { distribuidores: [] }, total: 0 })
  }

  try {
    // 🔍 BÚSQUEDA SIMPLE Y DIRECTA
    const { data, error } = await supabase
      .from('distribuidores')
      .select('id, nombre, email, telefono, comision_porcentaje, estado')
      .filter('nombre', 'ilike', `%${query}%`)
      .limit(10)

    if (error) {
      console.error('❌ Search error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      results: { distribuidores: data || [] },
      total: data?.length || 0
    })

  } catch (err: any) {
    console.error('❌ Search exception:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
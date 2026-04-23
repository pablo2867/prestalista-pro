// app/api/prestatarios/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno')
}

const supabase = createClient(supabaseUrl!, supabaseKey!)

// ✅ GET: Obtener lista de prestatarios (con búsqueda y filtros)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const estado = searchParams.get('estado') || ''

    // Construir query con filtros
    let query = supabase
      .from('prestatarios')
      .select('*')
      .order('created_at', { ascending: false })

    // Filtro por búsqueda (nombre, apellido, teléfono, identificación)
    if (search) {
      query = query.or(`nombre.ilike.%${search}%,apellido.ilike.%${search}%,telefono.ilike.%${search}%,identificacion.ilike.%${search}%`)
    }

    // Filtro por estado
    if (estado && ['activo', 'inactivo', 'moroso'].includes(estado)) {
      query = query.eq('estado', estado)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error GET prestatarios:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Calcular métricas
    const total = data?.length || 0
    const activos = data?.filter((p: any) => p.estado === 'activo').length || 0
    const morosos = data?.filter((p: any) => p.estado === 'moroso').length || 0

    return NextResponse.json({
      success: true,
      prestatarios: data || [],
      metrics: { total, activos, morosos }
    }, { status: 200 })

  } catch (err: any) {
    console.error('Error crítico GET prestatarios:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

// ✅ POST: Registrar nuevo prestatario
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nombre, apellido, telefono, email, direccion, identificacion, estado, limite_credito, notas } = body

    // Validaciones básicas
    if (!nombre || !apellido) {
      return NextResponse.json({ success: false, error: 'Nombre y apellido son obligatorios' }, { status: 400 })
    }

    // Validar estado
    const estadosValidos = ['activo', 'inactivo', 'moroso']
    if (estado && !estadosValidos.includes(estado)) {
      return NextResponse.json({ success: false, error: 'Estado inválido' }, { status: 400 })
    }

    // Insertar en Supabase
    const { data: inserted, error } = await supabase
      .from('prestatarios')
      .insert({
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        telefono: telefono?.trim() || null,
        email: email?.trim()?.toLowerCase() || null,
        direccion: direccion?.trim() || null,
        identificacion: identificacion?.trim() || null,
        estado: estado || 'activo',
        limite_credito: limite_credito ? parseFloat(limite_credito) : null,
        notas: notas?.trim() || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error POST prestatario:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: inserted }, { status: 201 })

  } catch (err: any) {
    console.error('Error crítico POST prestatario:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
// Archivo: app/api/distributors/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Validar variables de entorno al inicio
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno de Supabase')
}

const supabase = createClient(supabaseUrl!, supabaseKey!)

type DistribuidorInput = {
  nombre: string
  email: string
  telefono?: string
  comision?: string | number
  capitalInicial?: string | number
}

type ApiResponse = {
  success: boolean
  data?: any
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    // Validar credenciales
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Configuración de Supabase incompleta' },
        { status: 500 }
      )
    }

    const body: DistribuidorInput = await request.json()

    if (!body.nombre || !body.email) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Nombre y email son obligatorios' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Formato de email inválido' },
        { status: 400 }
      )
    }

    // Verificar email duplicado
    const {  existing, error: checkError } = await supabase
      .from('distributors')
      .select('id')
      .eq('email', body.email)
      .maybeSingle()

    if (checkError) {
      console.error('Error verificando email:', checkError)
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Error en el servidor' },
        { status: 500 }
      )
    }

    if (existing) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Este email ya está registrado' },
        { status: 409 }
      )
    }

    const organizationId = process.env.DEFAULT_ORGANIZATION_ID || null

    const distribuidorData = {
      nombre: body.nombre.trim(),
      email: body.email.toLowerCase().trim(),
      telefono: body.telefono?.trim() || null,
      comision_porcentaje: parseFloat(String(body.comision || 10)) || 10.00,
      capital_asignado: parseFloat(String(body.capitalInicial || 0)) || 0,
      capital_disponible: parseFloat(String(body.capitalInicial || 0)) || 0,
      organization_id: organizationId,
      user_id: null,
      estado: 'activo',
      performance_score: null,
      star_rating: null,
      portfolio_recovery_rate: null,
      delinquency_rate: null,
      total_borrowers_count: 0,
      active_loans_count: 0,
      notes: null
    }

    const { data, error } = await supabase
      .from('distributors')
      .insert(distribuidorData)
      .select()
      .single()

    if (error) {
      console.error('❌ Error insertando distribuidor:', error)
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No se pudo guardar: ' + error.message },
        { status: 500 }
      )
    }

    // ✅ CORREGIDO: Nota la clave "data:" antes del objeto
    return NextResponse.json<ApiResponse>({
      success: true,
      data: { 
        id: data.id, 
        nombre: data.nombre, 
        email: data.email, 
        estado: data.estado 
      }
    })

  } catch (err: any) {
    console.error('❌ Error crítico en POST /api/distributors:', err)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error interno: ' + err?.message || 'Desconocido' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Configuración de Supabase incompleta' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')

    let query = supabase
      .from('distributors')
      .select('id, nombre, email, telefono, comision_porcentaje, capital_asignado, capital_disponible, estado, created_at')
      .order('created_at', { ascending: false })

    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ Error cargando distribuidores:', error)
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No se pudieron cargar los distribuidores' },
        { status: 500 }
      )
    }

    // ✅ CORREGIDO: Nota la clave "data:" antes del array
    return NextResponse.json<ApiResponse>({
      success: true,
      data: data || []
    })

  } catch (err: any) {
    console.error('❌ Error crítico en GET /api/distributors:', err)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error interno: ' + err?.message || 'Desconocido' },
      { status: 500 }
    )
  }
}
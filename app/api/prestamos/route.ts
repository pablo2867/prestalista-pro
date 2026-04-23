// app/api/prestamos/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno para Préstamos')
}

const supabase = createClient(supabaseUrl!, supabaseKey!)

// ✅ GET: Obtener préstamos con datos del cliente y distribuidor
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado') || ''

    // Construir query con JOINS
    let query = supabase
      .from('prestamos')
      .select(`
        *,
        prestatario:prestatarios (
          id,
          nombre,
          apellido
        ),
        distribuidor:distributors (
          id,
          nombre
        )
      `)
      .order('created_at', { ascending: false })

    // Filtrar por estado si viene parámetro
    if (estado && ['activo', 'pagado', 'vencido', 'cancelado'].includes(estado)) {
      query = query.eq('estado', estado)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error GET prestamos:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Calcular métricas
    const total = data?.length || 0
    const activos = data?.filter((p: any) => p.estado === 'activo').length || 0
    const totalPrestado = data?.reduce((sum: number, p: any) => sum + parseFloat(p.monto_principal || 0), 0) || 0
    const totalPorCobrar = data?.reduce((sum: number, p: any) => sum + parseFloat(p.saldo_pendiente || 0), 0) || 0

    return NextResponse.json({
      success: true,
      prestamos: data || [],
      metrics: { 
        total, 
        activos, 
        vencidos: 0, // Se puede calcular con lógica de fechas
        totalPrestado: Math.round(totalPrestado),
        totalPorCobrar: Math.round(totalPorCobrar)
      }
    }, { status: 200 })

  } catch (err: any) {
    console.error('Error crítico GET prestamos:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

// ✅ POST: Registrar nuevo préstamo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      prestatario_id, 
      distribuidor_id, 
      monto_principal, 
      tasa_interes_mensual, 
      plazo_meses, 
      cuota_inicial,
      notas,
      garantia
    } = body

    if (!prestatario_id || !monto_principal || !tasa_interes_mensual || !plazo_meses) {
      return NextResponse.json({ 
        success: false, 
        error: 'Prestatario, monto, tasa y plazo son obligatorios' 
      }, { status: 400 })
    }

    const monto = parseFloat(monto_principal)
    const tasa = parseFloat(tasa_interes_mensual)
    const plazo = parseInt(plazo_meses)
    const inicial = parseFloat(cuota_inicial) || 0

    // Cálculos financieros
    const interesTotal = monto * (tasa / 100) * plazo
    const montoTotal = monto + interesTotal
    const saldoDespuesInicial = montoTotal - inicial
    const cuotaMensual = saldoDespuesInicial / plazo

    const fechaInicio = new Date()
    const fechaVencimiento = new Date(fechaInicio)
    fechaVencimiento.setMonth(fechaVencimiento.getMonth() + plazo)

    const {  inserted, error } = await supabase
      .from('prestamos')
      .insert({
        prestatario_id,
        distribuidor_id: distribuidor_id || null,
        monto_principal: monto,
        tasa_interes_mensual: tasa,
        plazo_meses: plazo,
        monto_total: montoTotal,
        cuota_mensual: cuotaMensual,
        cuota_inicial: inicial,
        estado: 'activo',
        fecha_inicio: fechaInicio.toISOString().split('T')[0],
        fecha_vencimiento: fechaVencimiento.toISOString().split('T')[0],
        saldo_pendiente: montoTotal - inicial,
        total_pagado: inicial,
        pagos_realizados: inicial > 0 ? 1 : 0,
        notas: notas?.trim() || null,
        garantia: garantia?.trim() || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error POST prestamo:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true,  inserted }, { status: 201 })

  } catch (err: any) {
    console.error('Error crítico POST prestamo:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
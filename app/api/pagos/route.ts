import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { prestamo_id, monto, tipo = 'regular', notas } = await request.json()

    if (!prestamo_id || !monto) {
      return NextResponse.json({ success: false, error: 'Préstamo y monto son obligatorios' }, { status: 400 })
    }

    // Obtener datos del préstamo
    const { data: prestamo } = await supabase.from('prestamos').select('*').eq('id', prestamo_id).single()
    if (!prestamo) {
      return NextResponse.json({ success: false, error: 'Préstamo no encontrado' }, { status: 404 })
    }

    // Registrar el pago
    const { data: pago, error: pagoError } = await supabase.from('pagos').insert({
      prestamo_id,
      monto: parseFloat(monto),
      fecha_pago: new Date().toISOString().split('T')[0],
      tipo,
      notas
    }).select().single()

    if (pagoError) throw pagoError

    // Actualizar préstamo
    const nuevoTotalPagado = parseFloat(prestamo.total_pagado || 0) + parseFloat(monto)
    const nuevoSaldoPendiente = parseFloat(prestamo.saldo_pendiente || 0) - parseFloat(monto)
    const nuevosPagosRealizados = (prestamo.pagos_realizados || 0) + 1

    const { error: updateError } = await supabase.from('prestamos').update({
      total_pagado: nuevoTotalPagado,
      saldo_pendiente: Math.max(0, nuevoSaldoPendiente),
      pagos_realizados: nuevosPagosRealizados,
      ultimo_pago: new Date().toISOString().split('T')[0],
      estado: nuevoSaldoPendiente <= 0 ? 'pagado' : prestamo.estado
    }).eq('id', prestamo_id)

    if (updateError) throw updateError

    return NextResponse.json({ success: true, pago, message: 'Pago registrado exitosamente' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const prestamo_id = searchParams.get('prestamo_id')

    let query = supabase.from('pagos').select('*').order('fecha_pago', { ascending: false })
    if (prestamo_id) query = query.eq('prestamo_id', prestamo_id)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ success: true, pagos: data || [] })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
// app/api/movimientos/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 🔑 Usa la clave de servicio para tener acceso total a la BD
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  try {
    // 1. Buscar pagos y traer datos del cliente asociado
    const { data, error } = await supabase
      .from('pagos')
      .select(`
        id,
        monto,
        fecha_pago,
        tipo,
        notas,
        prestamos (
          id,
          prestatarios (
            id,
            nombre,
            apellido
          )
        )
      `)
      .order('fecha_pago', { ascending: false })

    if (error) throw error

    // 2. Formatear los datos para que la página los entienda fácil
    // Supabase devuelve 'prestamos' (plural), pero la página espera 'prestamo' (singular)
    const movimientos = data.map((pago: any) => ({
      id: pago.id,
      monto: pago.monto,
      fecha_pago: pago.fecha_pago,
      tipo: pago.tipo,
      notas: pago.notas,
      prestamo: pago.prestamos ? {
        id: pago.prestamos.id,
        prestatario: pago.prestamos.prestatarios
      } : null
    }))

    return NextResponse.json({ success: true, data: movimientos })
  } catch (error: any) {
    console.error('❌ Error en API Movimientos:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
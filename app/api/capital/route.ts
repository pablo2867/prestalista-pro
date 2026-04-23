import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno')
}

const supabase = createClient(supabaseUrl!, supabaseKey!)

// ✅ GET: Obtener movimientos con nombre del distribuidor (JOIN)
export async function GET(request: NextRequest) {
  try {
    // 🔹 CAMBIO PRINCIPAL: Agregar JOIN con distributors para obtener el nombre
    const { data, error } = await supabase
      .from('capital_movements')
      .select(`
        *,
        distributor:distributors (
          id,
          nombre
        )
      `)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error GET:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Calcular totales correctamente (lógica que ya funcionaba)
    let totalIngresos = 0
    let totalEgresos = 0
    let balanceActual = 0

    if (data && data.length > 0) {
      data.forEach((m: any) => {
        const monto = parseFloat(m.amount) || 0
        if (m.movement_type === 'ingreso') {
          totalIngresos += monto
          balanceActual += monto
        } else if (m.movement_type === 'egreso') {
          totalEgresos += monto
          balanceActual -= monto
        }
      })

      const ultimoMovimiento = data[data.length - 1]
      balanceActual = ultimoMovimiento.balance_after || balanceActual
    }

    // Devolver movimientos en orden descendente (más reciente primero)
    const movimientosInvertidos = [...(data || [])].reverse()

    return NextResponse.json({
      success: true,
      movements: movimientosInvertidos,
      stats: {
        totalIngresos: Math.round(totalIngresos * 100) / 100,
        totalEgresos: Math.round(totalEgresos * 100) / 100,
        balanceActual: Math.round(balanceActual * 100) / 100
      }
    }, { status: 200 })

  } catch (err: any) {
    console.error('Error crítico GET:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

// ✅ POST: Crear nuevo movimiento (sin cambios, ya funcionaba perfecto)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { movement_type, amount, notes, distributor_id } = body

    if (!movement_type || !amount) {
      return NextResponse.json({ success: false, error: 'Tipo y monto son obligatorios' }, { status: 400 })
    }

    const amountNum = parseFloat(amount)
    
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json({ success: false, error: 'Monto inválido' }, { status: 400 })
    }

    // Validar capital insuficiente para egresos
    if (movement_type === 'egreso') {
      const { data: ultimoMovimiento } = await supabase
        .from('capital_movements')
        .select('balance_after')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const saldoActual = ultimoMovimiento?.balance_after || 0
      
      if (amountNum > saldoActual) {
        return NextResponse.json({ 
          success: false, 
          error: `Capital insuficiente. Saldo actual: $${saldoActual.toLocaleString()}, Intentas retirar: $${amountNum.toLocaleString()}` 
        }, { status: 400 })
      }
    }

    // Obtener el último balance
    const { data: lastMovement } = await supabase
      .from('capital_movements')
      .select('balance_after')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const currentBalance = lastMovement?.balance_after || 0

    // Calcular nuevo balance
    let newBalance = currentBalance
    if (movement_type === 'ingreso') {
      newBalance = currentBalance + amountNum
    } else if (movement_type === 'egreso') {
      newBalance = currentBalance - amountNum
    }

    // Insertar movimiento
    const { data: inserted, error } = await supabase
      .from('capital_movements')
      .insert({
        movement_type,
        amount: amountNum,
        balance_after: newBalance,
        notes: notes || null,
        distributor_id: distributor_id || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error POST:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: inserted }, { status: 201 })

  } catch (err: any) {
    console.error('Error crítico POST:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  try {
    // Capital
    const { data: capitalData } = await supabase.from('capital_movements').select('balance_after, movement_type, amount').order('created_at', {ascending:false}).limit(1)
    const { data: allCapital } = await supabase.from('capital_movements').select('movement_type, amount')
    const saldoActual = capitalData?.[0]?.balance_after || 0
    const totalIngresos = allCapital?.filter((m:any)=>m.movement_type==='ingreso').reduce((s,m)=>s+parseFloat(m.amount),0)||0
    const totalEgresos = allCapital?.filter((m:any)=>m.movement_type==='egreso').reduce((s,m)=>s+parseFloat(m.amount),0)||0

    // Distribuidores
    const { data: distributors } = await supabase.from('distributors').select('id')
    
    // Prestatarios
    const { data: prestatarios } = await supabase.from('prestatarios').select('estado')
    const totalClientes = prestatarios?.length || 0
    const clientesActivos = prestatarios?.filter((p:any)=>p.estado==='activo').length || 0
    const clientesMorosos = prestatarios?.filter((p:any)=>p.estado==='moroso').length || 0

    // Préstamos
    const { data: prestamos } = await supabase.from('prestamos').select('estado, monto_principal, saldo_pendiente')
    const totalPrestamos = prestamos?.length || 0
    const prestamosActivos = prestamos?.filter((p:any)=>p.estado==='activo').length || 0
    const totalPrestado = prestamos?.reduce((s,p)=>s+parseFloat(p.monto_principal||0),0)||0
    const totalPorCobrar = prestamos?.reduce((s,p)=>s+parseFloat(p.saldo_pendiente||0),0)||0

    // Leads
    const { data: leads } = await supabase.from('leads').select('estado, monto_interes')
    const totalLeads = leads?.length || 0
    const leadsNuevos = leads?.filter((l:any)=>l.estado==='nuevo').length || 0
    const leadsConvertidos = leads?.filter((l:any)=>l.estado==='convertido').length || 0
    const montoPotencial = leads?.reduce((s,l)=>s+parseFloat(l.monto_interes||0),0)||0

    return NextResponse.json({
      success: true,
      metrics: {
        capital: { saldoActual, totalIngresos, totalEgresos },
        distributors: { total: distributors?.length || 0 },
        clientes: { total: totalClientes, activos: clientesActivos, morosos: clientesMorosos },
        prestamos: { total: totalPrestamos, activos: prestamosActivos, totalPrestado, totalPorCobrar },
        leads: { total: totalLeads, nuevos: leadsNuevos, convertidos: leadsConvertidos, montoPotencial }
      }
    })
  } catch(err:any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
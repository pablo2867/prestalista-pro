'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

const supabase = createClient()

type Loan = {
  id: string
  borrower_id: string
  amount: number
  total_amount: number
  amount_paid: number
  amount_remaining: number
  interest_rate: number
  status: string
  start_date: string
  due_date: string
  created_at: string
  notes?: string
}

type Payment = {
  id: string
  loan_id: string
  amount: number
  payment_date: string
  notes?: string
}

export default function PrestamosPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  
  const [prestamos, setPrestamos] = useState<Loan[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
  
  // Formulario de préstamo
  const [monto, setMonto] = useState('')
  const [tasaInteres, setTasaInteres] = useState('10')
  const [semanas, setSemanas] = useState('4')
  const [notas, setNotas] = useState('')
  
  // Formulario de pago
  const [montoPago, setMontoPago] = useState('')
  const [notasPago, setNotasPago] = useState('')

  useEffect(() => {
    let mounted = true

    const loadData = async () => {
      const sessionResp = await supabase.auth.getSession()
      const session = sessionResp.data?.session
      
      if (!mounted) return
      if (!session?.user) {
        router.replace('/login')
        return
      }
      
      setUserId(session.user.id)
      await cargarPrestamos(session.user.id)
    }

    const cargarPrestamos = async (uid: string) => {
      try {
        const { data, error } = await supabase
          .from('loans')
          .select('*')
          .eq('user_id', uid)
          .order('created_at', { ascending: false })
          .limit(50)
        
        if (error) throw error
        setPrestamos(data || [])
      } catch (error) {
        console.error('Error cargando préstamos:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
    return () => { mounted = false }
  }, [router])

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const calcularTotal = () => {
    const montoNum = parseFloat(monto) || 0
    const tasaNum = parseFloat(tasaInteres) || 0
    const total = montoNum + (montoNum * (tasaNum / 100))
    return total
  }

  const handleCrearPrestamo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    
    try {
      const montoNum = parseFloat(monto)
      const tasaNum = parseFloat(tasaInteres)
      const semanasNum = parseInt(semanas)
      const totalAmount = montoNum + (montoNum * (tasaNum / 100))
      
      const startDate = new Date()
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + (semanasNum * 7))

      // 1. Crear préstamo
      const { error: loanError } = await supabase
        .from('loans')
        .insert({
          user_id: userId,
          borrower_id: userId, // Temporal - luego se conecta con tabla borrowers
          amount: montoNum,
          interest_rate: tasaNum,
          term_weeks: semanasNum,
          start_date: startDate.toISOString(),
          due_date: dueDate.toISOString(),
          total_amount: totalAmount,
          amount_paid: 0,
          amount_remaining: totalAmount,
          total_interest: montoNum * (tasaNum / 100),
          status: 'activo',
          notes: notas || null
        })

      if (loanError) throw loanError

      // 2. Registrar salida de capital (el préstamo reduce capital disponible)
      const { error: capitalError } = await supabase
        .from('capital_movements')
        .insert({
          movement_type: 'disbursement',
          amount: montoNum,
          notes: `Préstamo registrado - ${notas || 'Sin notas'}`,
          balance_after: 0, // Se calculará automáticamente
          user_id: userId
        })

      if (capitalError) throw capitalError

      // 3. Actualizar capital del tenant
      const tenantResp = await supabase
        .from('tenants')
        .select('capital_disponible')
        .eq('user_id', userId)
        .single()
      
      if (tenantResp.data) {
        const nuevoCapital = tenantResp.data.capital_disponible - montoNum
        await supabase
          .from('tenants')
          .update({ capital_disponible: nuevoCapital })
          .eq('user_id', userId)
      }

      alert('✅ Préstamo registrado exitosamente')
      setShowForm(false)
      setMonto('')
      setTasaInteres('10')
      setSemanas('4')
      setNotas('')
      await cargarPrestamos(userId)
    } catch (error) {
      console.error('Error creando préstamo:', error)
      alert('❌ Error al crear el préstamo: ' + (error as any)?.message)
    }
  }

  const handleRegistrarPago = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !selectedLoan) return
    
    try {
      const montoPagoNum = parseFloat(montoPago)
      
      // 1. Registrar pago
      const { error: paymentError } = await supabase
        .from('loan_payments')
        .insert({
          loan_id: selectedLoan.id,
          user_id: userId,
          amount: montoPagoNum,
          notes: notasPago || null,
          payment_date: new Date().toISOString()
        })

      if (paymentError) throw paymentError

      // 2. Actualizar préstamo
      const nuevoAmountPaid = selectedLoan.amount_paid + montoPagoNum
      const nuevoAmountRemaining = selectedLoan.amount_remaining - montoPagoNum
      const nuevoStatus = nuevoAmountRemaining <= 0 ? 'pagado' : 'activo'

      const { error: updateError } = await supabase
        .from('loans')
        .update({
          amount_paid: nuevoAmountPaid,
          amount_remaining: nuevoAmountRemaining,
          status: nuevoStatus
        })
        .eq('id', selectedLoan.id)

      if (updateError) throw updateError

      // 3. Registrar entrada de capital (el pago aumenta capital disponible)
      const tenantResp = await supabase
        .from('tenants')
        .select('capital_disponible')
        .eq('user_id', userId)
        .single()
      
      if (tenantResp.data) {
        const nuevoCapital = tenantResp.data.capital_disponible + montoPagoNum
        
        // Registrar movimiento de capital
        await supabase
          .from('capital_movements')
          .insert({
            movement_type: 'recovery',
            amount: montoPagoNum,
            notes: `Pago préstamo - ${notasPago || 'Sin notas'}`,
            balance_after: nuevoCapital,
            user_id: userId
          })

        // Actualizar tenant
        await supabase
          .from('tenants')
          .update({ capital_disponible: nuevoCapital })
          .eq('user_id', userId)
      }

      alert('✅ Pago registrado exitosamente')
      setShowPaymentModal(false)
      setMontoPago('')
      setNotasPago('')
      setSelectedLoan(null)
      await cargarPrestamos(userId)
    } catch (error) {
      console.error('Error registrando pago:', error)
      alert('❌ Error al registrar el pago: ' + (error as any)?.message)
    }
  }

  const cargarPrestamos = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (error) throw error
      setPrestamos(data || [])
    } catch (error) {
      console.error('Error cargando préstamos:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0f]">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">Préstamos</h1>
              <p className="text-gray-400 mt-1">Gestiona tus préstamos y cobros</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition flex items-center gap-2"
            >
              ➕ Nuevo Préstamo
            </button>
          </div>

          {/* Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#1a1a25] rounded-2xl p-6 border border-[#2a2a35]">
              <p className="text-gray-400 text-sm">Préstamos Activos</p>
              <p className="text-2xl font-bold text-white mt-1">
                {prestamos.filter(p => p.status === 'activo').length}
              </p>
            </div>
            <div className="bg-[#1a1a25] rounded-2xl p-6 border border-[#2a2a35]">
              <p className="text-gray-400 text-sm">Total Prestado</p>
              <p className="text-2xl font-bold text-blue-400 mt-1">
                {formatMoney(prestamos.reduce((sum, p) => sum + p.amount, 0))}
              </p>
            </div>
            <div className="bg-[#1a1a25] rounded-2xl p-6 border border-[#2a2a35]">
              <p className="text-gray-400 text-sm">Total Recuperado</p>
              <p className="text-2xl font-bold text-green-400 mt-1">
                {formatMoney(prestamos.reduce((sum, p) => sum + p.amount_paid, 0))}
              </p>
            </div>
            <div className="bg-[#1a1a25] rounded-2xl p-6 border border-[#2a2a35]">
              <p className="text-gray-400 text-sm">Por Cobrar</p>
              <p className="text-2xl font-bold text-orange-400 mt-1">
                {formatMoney(prestamos.reduce((sum, p) => sum + p.amount_remaining, 0))}
              </p>
            </div>
          </div>

          {/* Formulario Nuevo Préstamo */}
          {showForm && (
            <div className="bg-[#1a1a25] rounded-2xl p-6 border border-[#2a2a35] mb-8">
              <h2 className="text-xl font-bold text-white mb-6">Nuevo Préstamo</h2>
              <form onSubmit={handleCrearPrestamo} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Monto (MXN)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={monto}
                      onChange={(e) => setMonto(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-[#0a0a0f] border border-[#2a2a35] rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Tasa de Interés (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={tasaInteres}
                      onChange={(e) => setTasaInteres(e.target.value)}
                      placeholder="10"
                      className="w-full bg-[#0a0a0f] border border-[#2a2a35] rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Semanas</label>
                    <input
                      type="number"
                      min="1"
                      value={semanas}
                      onChange={(e) => setSemanas(e.target.value)}
                      placeholder="4"
                      className="w-full bg-[#0a0a0f] border border-[#2a2a35] rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Notas (opcional)</label>
                  <input
                    type="text"
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    placeholder="Descripción del préstamo..."
                    className="w-full bg-[#0a0a0f] border border-[#2a2a35] rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="bg-[#0a0a0f] rounded-xl p-4 border border-[#2a2a35]">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total a Pagar:</span>
                    <span className="text-2xl font-bold text-green-400">
                      {formatMoney(calcularTotal())}
                    </span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition"
                  >
                    💾 Registrar Préstamo
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-xl transition"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Lista de Préstamos */}
          <div className="bg-[#1a1a25] rounded-2xl p-6 border border-[#2a2a35]">
            <h2 className="text-xl font-bold text-white mb-6">📋 Préstamos Registrados</h2>
            
            {prestamos.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">📭 Sin préstamos registrados</p>
                <p className="text-gray-500 text-sm mt-2">Comienza creando un nuevo préstamo</p>
              </div>
            ) : (
              <div className="space-y-4">
                {prestamos.map((prestamo) => (
                  <div
                    key={prestamo.id}
                    className="bg-[#0a0a0f] rounded-xl p-4 border border-[#2a2a35] hover:border-blue-500/30 transition"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            prestamo.status === 'activo' ? 'bg-green-900 text-green-300' :
                            prestamo.status === 'pagado' ? 'bg-blue-900 text-blue-300' :
                            'bg-red-900 text-red-300'
                          }`}>
                            {prestamo.status === 'activo' ? '🟢 Activo' :
                             prestamo.status === 'pagado' ? '🔵 Pagado' : '🔴 Vencido'}
                          </span>
                          <span className="text-gray-500 text-sm">
                            {formatDate(prestamo.created_at)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400">Prestado</p>
                            <p className="text-white font-semibold">{formatMoney(prestamo.amount)}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Interés ({prestamo.interest_rate}%)</p>
                            <p className="text-orange-400 font-semibold">
                              {formatMoney(prestamo.total_amount - prestamo.amount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400">Pagado</p>
                            <p className="text-green-400 font-semibold">{formatMoney(prestamo.amount_paid)}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Restante</p>
                            <p className="text-red-400 font-semibold">{formatMoney(prestamo.amount_remaining)}</p>
                          </div>
                        </div>
                        <div className="mt-3 text-xs text-gray-500">
                          Vence: {formatDate(prestamo.due_date)}
                          {prestamo.notes && <p className="mt-1">📝 {prestamo.notes}</p>}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {prestamo.status === 'activo' && (
                          <button
                            onClick={() => {
                              setSelectedLoan(prestamo)
                              setShowPaymentModal(true)
                            }}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition"
                          >
                            💰 Registrar Pago
                          </button>
                        )}
                        <button
                          onClick={() => alert('Funcionalidad de ver detalles - Próximamente')}
                          className="px-4 py-2 bg-[#2a2a35] hover:bg-[#3a3a45] text-white rounded-lg text-sm transition"
                        >
                          📄 Ver Detalles
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal de Pago */}
      {showPaymentModal && selectedLoan && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#1a1a25] rounded-2xl p-6 border border-[#2a2a35] max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-white mb-4">Registrar Pago</h2>
            <div className="bg-[#0a0a0f] rounded-xl p-4 mb-4">
              <p className="text-gray-400 text-sm">Préstamo de</p>
              <p className="text-2xl font-bold text-white">{formatMoney(selectedLoan.amount)}</p>
              <p className="text-gray-400 text-sm mt-2">Restante por pagar</p>
              <p className="text-xl font-bold text-red-400">{formatMoney(selectedLoan.amount_remaining)}</p>
            </div>
            <form onSubmit={handleRegistrarPago} className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Monto del Pago (MXN)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={selectedLoan.amount_remaining}
                  value={montoPago}
                  onChange={(e) => setMontoPago(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#0a0a0f] border border-[#2a2a35] rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Notas (opcional)</label>
                <input
                  type="text"
                  value={notasPago}
                  onChange={(e) => setNotasPago(e.target.value)}
                  placeholder="Referencia del pago..."
                  className="w-full bg-[#0a0a0f] border border-[#2a2a35] rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition"
                >
                  ✅ Confirmar Pago
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false)
                    setMontoPago('')
                    setNotasPago('')
                    setSelectedLoan(null)
                  }}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-xl transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
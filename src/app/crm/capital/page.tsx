'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

const supabase = createClient()

type Movement = {
  id: string
  movement_type: 'asignation' | 'adjustment' | 'disbursement' | 'recovery'
  amount: number
  notes: string | null
  balance_after: number
  created_at: string
}

export default function CapitalPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  
  const [monto, setMonto] = useState('')
  const [distribuidorId, setDistribuidorId] = useState('')
  const [tipo, setTipo] = useState<'asignation' | 'adjustment' | 'disbursement' | 'recovery'>('asignation')
  const [descripcion, setDescripcion] = useState('')
  const [guardando, setGuardando] = useState(false)
  
  const [capitalInicial, setCapitalInicial] = useState(0)
  const [capitalDisponible, setCapitalDisponible] = useState(0)
  const [movimientos, setMovimientos] = useState<Movement[]>([])
  const [distribuidores, setDistribuidores] = useState<any[]>([])

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
      await cargarDatos(session.user.id)
    }

    const cargarDatos = async (uid: string) => {
      try {
        // TENANTS - Obtener capital actual del tenant
        const tenantResp = await supabase
          .from('tenants')
          .select('capital_inicial, capital_disponible')
          .filter('user_id', 'eq', uid)
          .maybeSingle()
        
        if (tenantResp.data) {
          setCapitalInicial(tenantResp.data.capital_inicial || 0)
          setCapitalDisponible(tenantResp.data.capital_disponible || 0)
        }

        // DISTRIBUTORS
        const distResp = await supabase
          .from('distributors')
          .select('id, nombre, capital_asignado, capital_disponible, estado')
          .filter('user_id', 'eq', uid)
          .filter('estado', 'eq', 'activo')
        
        if (distResp.data) {
          setDistribuidores(distResp.data)
        }

        // MOVIMIENTOS - Ordenados por fecha (más reciente primero)
        const movResp = await supabase
          .from('capital_movements')
          .select('*')
          .filter('distributor_id', 'is', null)
          .filter('user_id', 'eq', uid)
          .order('created_at', { ascending: false })
          .limit(50)
        
        if (movResp.data) {
          setMovimientos(movResp.data)
        }

        setLoading(false)
      } catch (error) {
        console.error('Error cargando datos:', error)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    
    setGuardando(true)
    try {
      const montoNum = parseFloat(monto)
      
      // ✅ CORRECCIÓN CLAVE: Calcular balance_after correctamente
      // El balance_after es el capital disponible DESPUÉS de este movimiento
      let nuevoBalance: number
      
      if (tipo === 'asignation' || tipo === 'disbursement' || tipo === 'adjustment') {
        // Suma al capital disponible
        nuevoBalance = capitalDisponible + montoNum
      } else if (tipo === 'recovery') {
        // Resta del capital disponible
        nuevoBalance = capitalDisponible - montoNum
      } else {
        nuevoBalance = capitalDisponible + montoNum
      }

      // ✅ Insertar movimiento con balance_after correcto Y user_id
      const { error: insertError } = await supabase
        .from('capital_movements')
        .insert({
          movement_type: tipo,
          amount: montoNum,
          notes: descripcion || null,
          balance_after: nuevoBalance,
          distributor_id: distribuidorId || null,
          user_id: userId  // ← ✅ ESTO ES LO QUE FALTABA
        })

      if (insertError) throw insertError

      // ✅ ACTUALIZAR tenant con el nuevo capital disponible
      const { error: updateError } = await supabase
        .from('tenants')
        .update({ 
          capital_disponible: nuevoBalance,
          // Si es el primer movimiento (asignation), también actualizar capital_inicial
          capital_inicial: tipo === 'asignation' && capitalInicial === 0 
            ? montoNum 
            : capitalInicial
        })
        .eq('user_id', userId)

      if (updateError) throw updateError

      // Reset formulario
      setMonto('')
      setDescripcion('')
      
      // Actualizar estado local inmediatamente
      setCapitalDisponible(nuevoBalance)
      if (tipo === 'asignation' && capitalInicial === 0) {
        setCapitalInicial(montoNum)
      }
      
      // Recargar movimientos para mostrar el nuevo
      const movResp = await supabase
        .from('capital_movements')
        .select('*')
        .filter('distributor_id', 'is', null)
        .filter('user_id', 'eq', userId)
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (movResp.data) {
        setMovimientos(movResp.data)
      }
      
      alert('✅ Movimiento registrado exitosamente')
    } catch (error) {
      console.error('Error registrando movimiento:', error)
      alert('❌ Error al registrar el movimiento: ' + (error as any)?.message)
    } finally {
      setGuardando(false)
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Gestión de Capital</h1>
            <p className="text-gray-400 mt-1">Administra el capital de tu distribuidora</p>
          </div>

          {/* Cards de Capital */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-[#1a1a25] rounded-2xl p-6 border border-[#2a2a35]">
              <p className="text-gray-400 text-sm mb-1">Capital Inicial</p>
              <p className="text-3xl font-bold text-white">{formatMoney(capitalInicial)}</p>
            </div>
            <div className="bg-[#1a1a25] rounded-2xl p-6 border border-[#2a2a35]">
              <p className="text-gray-400 text-sm mb-1">Capital Disponible</p>
              <p className="text-3xl font-bold text-green-400">{formatMoney(capitalDisponible)}</p>
            </div>
          </div>

          {/* Formulario */}
          <div className="bg-[#1a1a25] rounded-2xl p-6 border border-[#2a2a35] mb-8">
            <h2 className="text-xl font-bold text-white mb-6">Registrar Movimiento</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Tipo de Movimiento</label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as any)}
                    className="w-full bg-[#0a0a0f] border border-[#2a2a35] rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="asignation">📥 Capital Inicial</option>
                    <option value="disbursement">➕ Adicional</option>
                    <option value="recovery">➖ Retiro</option>
                    <option value="adjustment">⚙️ Ajuste</option>
                  </select>
                </div>
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
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Notas (opcional)</label>
                <input
                  type="text"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej: Capital para operación de mayo"
                  className="w-full bg-[#0a0a0f] border border-[#2a2a35] rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={guardando}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/30"
              >
                {guardando ? '⏳ Guardando...' : '💾 Registrar Movimiento'}
              </button>
            </form>
          </div>

          {/* Historial */}
          <div className="bg-[#1a1a25] rounded-2xl p-6 border border-[#2a2a35]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">📜 Historial de Movimientos</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => alert('Funcionalidad de exportar CSV - Próximamente')}
                  className="px-4 py-2 bg-[#2a2a35] hover:bg-[#3a3a45] text-white rounded-lg text-sm transition"
                >
                  📥 CSV
                </button>
                <button 
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-[#2a2a35] hover:bg-[#3a3a45] text-white rounded-lg text-sm transition"
                >
                  🖨️ Imprimir
                </button>
              </div>
            </div>

            {movimientos.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">📭 Sin movimientos registrados</p>
                <p className="text-gray-500 text-sm mt-2">Comienza registrando el capital inicial</p>
              </div>
            ) : (
              <div className="space-y-3">
                {movimientos.map((mov) => (
                  <div 
                    key={mov.id} 
                    className="bg-[#0a0a0f] rounded-xl p-4 border border-[#2a2a35] hover:border-blue-500/30 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">
                            {mov.movement_type === 'asignation' ? '📥' : 
                             mov.movement_type === 'disbursement' ? '➕' : 
                             mov.movement_type === 'recovery' ? '➖' : '⚙️'}
                          </span>
                          <p className="text-white font-semibold">
                            {mov.movement_type === 'asignation' ? 'Capital Inicial' : 
                             mov.movement_type === 'disbursement' ? 'Adicional' : 
                             mov.movement_type === 'recovery' ? 'Retiro' : 'Ajuste'}
                          </p>
                        </div>
                        <p className="text-gray-400 text-sm truncate">
                          {mov.notes || 'Sin notas'}
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          {new Date(mov.created_at).toLocaleString('es-MX', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${
                          mov.movement_type === 'recovery' ? 'text-red-400' : 'text-green-400'
                        }`}>
                          {mov.movement_type === 'recovery' ? '-' : '+'}{formatMoney(mov.amount)}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                          Balance: {formatMoney(mov.balance_after)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
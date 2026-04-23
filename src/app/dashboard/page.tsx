'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

const supabase = createClient()

export default function DashboardPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Estados del CRM
  const [capitalInicial, setCapitalInicial] = useState(107700)
  const [totalPrestado, setTotalPrestado] = useState(0)
  const [capitalDisponible, setCapitalDisponible] = useState(107700)
  const [prestamosActivos, setPrestamosActivos] = useState(0)
  const [prestamosVencidos, setPrestamosVencidos] = useState(0)
  const [pagosHoy, setPagosHoy] = useState(0)
  
  // Nuevos estados para funciones adicionales
  const [totalLeads, setTotalLeads] = useState(0)
  const [leadsEstaSemana, setLeadsEstaSemana] = useState(0)
  const [clientesAprobados, setClientesAprobados] = useState(0)
  const [totalPrestamos, setTotalPrestamos] = useState(0)
  const [ingresosMes, setIngresosMes] = useState(0)
  const [ingresosTotales, setIngresosTotales] = useState(0)
  const [morosidad, setMorosidad] = useState(0)
  const [pendientesMorosidad, setPendientesMorosidad] = useState(0)
  const [tasaConversion, setTasaConversion] = useState(0)
  
  // Gráficos
  const [ingresosPorMes, setIngresosPorMes] = useState<any[]>([])
  const [estadoCartera, setEstadoCartera] = useState({ completado: 0, pendiente: 0, fallido: 0 })
  
  // Próximos vencimientos
  const [proximosVencimientos, setProximosVencimientos] = useState<any[]>([])
  
  // Actividad reciente
  const [actividadReciente, setActividadReciente] = useState<any[]>([])
  
  // Vista de gráfico (mensual/anual)
  const [vistaGrafico, setVistaGrafico] = useState<'mensual' | 'anual'>('mensual')

  useEffect(() => {
    let mounted = true

    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!mounted) return
      if (!session?.user) {
        router.replace('/login')
        return
      }
      
      setUserId(session.user.id)
      await cargarDatosCRM(session.user.id)
    }

    const cargarDatosCRM = async (uid: string) => {
      try {
        // ========== CAPITAL ==========
        const { data: tenantData } = await supabase
          .from('tenants')
          .select('capital_inicial, capital_disponible')
          .eq('user_id', uid)
          .single()
        
        if (tenantData) {
          const inicial = tenantData.capital_inicial || tenantData.capital_disponible || 107700
          setCapitalInicial(inicial)
        }

        // ========== PRÉSTAMOS ==========
        const { data: prestamosData } = await supabase
          .from('loans')
          .select('amount_remaining, status, due_date, amount')
          .eq('organization_id', uid)
        
        const activos = prestamosData?.filter(p => p.status === 'activo') || []
        const vencidos = prestamosData?.filter(p => p.status === 'vencido') || []
        const completados = prestamosData?.filter(p => p.status === 'completado') || []
        const fallidos = prestamosData?.filter(p => p.status === 'fallido') || []
        
        const totalPrestadoCalculado = activos.reduce((sum, p) => {
          const val = typeof p.amount_remaining === 'string' 
            ? parseFloat(p.amount_remaining) 
            : (p.amount_remaining || 0)
          return sum + val
        }, 0)

        setTotalPrestado(totalPrestadoCalculado)
        setPrestamosActivos(activos.length)
        setPrestamosVencidos(vencidos.length)
        setTotalPrestamos(prestamosData?.length || 0)
        
        const disponible = (tenantData?.capital_inicial || 107700) - totalPrestadoCalculado
        setCapitalDisponible(disponible)

        // Estado de cartera
        setEstadoCartera({
          completado: completados.length,
          pendiente: activos.length + vencidos.length,
          fallido: fallidos.length
        })

        // Próximos vencimientos (próximos 7 días)
        const hoy = new Date()
        const sieteDias = new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000)
        
        const vencimientos = prestamosData
          ?.filter(p => {
            if (p.status !== 'activo') return false
            const dueDate = new Date(p.due_date)
            return dueDate >= hoy && dueDate <= sieteDias
          })
          .slice(0, 5) || []
        
        setProximosVencimientos(vencimientos)

        // ========== PAGOS ==========
        const hoyStr = hoy.toISOString().split('T')[0]
        const { data: pagosData } = await supabase
          .from('payments')
          .select('amount, status, payment_date')
          .eq('organization_id', uid)
          .eq('status', 'completed')
          .gte('payment_date', hoyStr)
        
        const totalPagos = pagosData?.reduce((sum, p) => {
          const val = typeof p.amount === 'string' ? parseFloat(p.amount) : (p.amount || 0)
          return sum + val
        }, 0) || 0
        
        setPagosHoy(totalPagos)

        // Ingresos del mes
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString()
        const { data: pagosMesData } = await supabase
          .from('payments')
          .select('amount, status')
          .eq('organization_id', uid)
          .eq('status', 'completed')
          .gte('payment_date', inicioMes)
        
        const ingresosDelMes = pagosMesData?.reduce((sum, p) => {
          const val = typeof p.amount === 'string' ? parseFloat(p.amount) : (p.amount || 0)
          return sum + val
        }, 0) || 0
        
        setIngresosMes(ingresosDelMes)

        // Ingresos totales
        const { data: todosPagosData } = await supabase
          .from('payments')
          .select('amount, status')
          .eq('organization_id', uid)
          .eq('status', 'completed')
        
        const ingresosTotalesCalculado = todosPagosData?.reduce((sum, p) => {
          const val = typeof p.amount === 'string' ? parseFloat(p.amount) : (p.amount || 0)
          return sum + val
        }, 0) || 0
        
        setIngresosTotales(ingresosTotalesCalculado)

        // ========== LEADS ==========
        const { data: leadsData } = await supabase
          .from('leads')
          .select('*, created_at, status')
          .eq('organization_id', uid)
        
        setTotalLeads(leadsData?.length || 0)
        
        const inicioSemana = new Date(hoy)
        inicioSemana.setDate(hoy.getDate() - 7)
        
        const leadsSemana = leadsData?.filter(l => {
          const leadDate = new Date(l.created_at)
          return leadDate >= inicioSemana
        }) || []
        
        setLeadsEstaSemana(leadsSemana.length)

        // Clientes aprobados
        const { data: clientesData } = await supabase
          .from('clients')
          .select('status')
          .eq('organization_id', uid)
        
        const aprobados = clientesData?.filter(c => c.status === 'approved') || []
        setClientesAprobados(aprobados.length)

        // Tasa de conversión
        if (totalLeads > 0) {
          const conversion = ((aprobados.length / totalLeads) * 100).toFixed(1)
          setTasaConversion(parseFloat(conversion))
        }

        // ========== MOROSIDAD ==========
        const totalPrestamosActivos = activos.length + vencidos.length
        if (totalPrestamosActivos > 0) {
          const morosidadCalculada = ((vencidos.length / totalPrestamosActivos) * 100).toFixed(1)
          setMorosidad(parseFloat(morosidadCalculada))
          setPendientesMorosidad(vencidos.length)
        }

        // ========== INGRESOS POR MES (Gráfico) ==========
        const meses = []
        for (let i = 5; i >= 0; i--) {
          const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
          const mesNombre = fecha.toLocaleString('es-MX', { month: 'short', year: '2-digit' })
          
          const inicioMes = fecha.toISOString()
          const finMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).toISOString()
          
          const { data: pagosDelMes } = await supabase
            .from('payments')
            .select('amount')
            .eq('organization_id', uid)
            .eq('status', 'completed')
            .gte('payment_date', inicioMes)
            .lte('payment_date', finMes)
          
          const total = pagosDelMes?.reduce((sum, p) => {
            const val = typeof p.amount === 'string' ? parseFloat(p.amount) : (p.amount || 0)
            return sum + val
          }, 0) || 0
          
          meses.push({ mes: mesNombre, total })
        }
        setIngresosPorMes(meses)

        // ========== ACTIVIDAD RECIENTE ==========
        const actividad = []
        
        // Leads recientes
        const leadsRecientes = leadsData?.slice(0, 3) || []
        leadsRecientes.forEach(lead => {
          actividad.push({
            tipo: 'lead',
            titulo: 'Nuevo lead',
            descripcion: `${lead.name || 'Lead'} se registró como lead nuevo`,
            fecha: new Date(lead.created_at).toLocaleString('es-MX', { 
              day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
            }),
            icono: 'user',
            estado: 'info'
          })
        })
        
        // Pagos recientes
        const { data: pagosRecientesData } = await supabase
          .from('payments')
          .select('*, loans(reference)')
          .eq('organization_id', uid)
          .eq('status', 'completed')
          .order('payment_date', { ascending: false })
          .limit(3)
        
        pagosRecientesData?.forEach(pago => {
          actividad.push({
            tipo: 'pago',
            titulo: 'Pago recibido',
            descripcion: `${pago.loans?.reference || 'REF'}: $${parseFloat(pago.amount || 0).toLocaleString('es-MX', { minimumFractionDigits: 0 })}`,
            fecha: new Date(pago.payment_date).toLocaleString('es-MX', { 
              day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
            }),
            icono: 'money',
            estado: 'success'
          })
        })
        
        // Pagos vencidos
        vencidos.slice(0, 2).forEach(prestamo => {
          actividad.push({
            tipo: 'vencido',
            titulo: 'Pago vencido',
            descripcion: `${prestamo.reference || 'REF'}: $${parseFloat(prestamo.amount || 0).toLocaleString('es-MX', { minimumFractionDigits: 0 })} pendiente`,
            fecha: new Date(prestamo.due_date).toLocaleString('es-MX', { 
              day: '2-digit', month: '2-digit' 
            }),
            icono: 'alert',
            estado: 'danger'
          })
        })
        
        setActividadReciente(actividad.slice(0, 6))

      } catch (error) {
        console.error('❌ Error cargando datos:', error)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadData()

    return () => { mounted = false }
  }, [router])

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const handleExportCSV = () => {
    alert('📥 Exportando datos a CSV...')
    // Implementar exportación CSV aquí
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  if (!userId) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Sidebar />
      
      <main className="lg:ml-64 p-6 md:p-8">
        
        {/* Header con Acciones */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-gray-400">Resumen general de tu negocio</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              CSV
            </button>
            
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir
            </button>
            
            <button
              onClick={() => router.push('/crm/leads')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ver Leads
            </button>
            
            <button
              onClick={() => router.push('/crm/prestamos')}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Ver Préstamos
            </button>
          </div>
        </div>

        {/* Stats Cards - Fila 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {/* Total Leads */}
          <div className="bg-[#1a1a25] rounded-2xl p-5 border border-[#2a2a35]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-gray-400 text-xs">Total Leads</p>
                <p className="text-3xl font-bold text-white">{totalLeads}</p>
              </div>
              <div className="w-10 h-10 bg-blue-900/30 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-green-400">↗</span>
              <span className="text-gray-400">{leadsEstaSemana} esta semana</span>
            </div>
          </div>

          {/* Clientes */}
          <div className="bg-[#1a1a25] rounded-2xl p-5 border border-[#2a2a35]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-gray-400 text-xs">Clientes</p>
                <p className="text-3xl font-bold text-white">{clientesAprobados}</p>
              </div>
              <div className="w-10 h-10 bg-green-900/30 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-400">Aprobados</p>
          </div>

          {/* Préstamos */}
          <div className="bg-[#1a1a25] rounded-2xl p-5 border border-[#2a2a35]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-gray-400 text-xs">Préstamos</p>
                <p className="text-3xl font-bold text-white">{totalPrestamos}</p>
              </div>
              <div className="w-10 h-10 bg-purple-900/30 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-400">De {totalPrestamos} totales</p>
          </div>

          {/* Ingresos este Mes */}
          <div className="bg-[#1a1a25] rounded-2xl p-5 border border-[#2a2a35]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-gray-400 text-xs">Ingresos este Mes</p>
                <p className="text-2xl font-bold text-white">{formatMoney(ingresosMes)}</p>
              </div>
              <div className="w-10 h-10 bg-green-900/30 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-400">Total: {formatMoney(ingresosTotales)}</p>
          </div>

          {/* Morosidad */}
          <div className="bg-[#1a1a25] rounded-2xl p-5 border border-[#2a2a35]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-gray-400 text-xs">Morosidad</p>
                <p className={`text-2xl font-bold ${morosidad >= 20 ? 'text-red-400' : 'text-green-400'}`}>
                  {morosidad}%
                </p>
              </div>
              <div className="w-10 h-10 bg-red-900/30 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-400">{pendientesMorosidad} pendientes</p>
          </div>
        </div>

        {/* Gráficos - Fila 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Ingresos por Mes */}
          <div className="bg-[#1a1a25] rounded-2xl p-6 border border-[#2a2a35]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Ingresos por Mes
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setVistaGrafico('mensual')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    vistaGrafico === 'mensual' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-[#0a0a0f] text-gray-400 hover:text-white'
                  }`}
                >
                  Mensual
                </button>
                <button
                  onClick={() => setVistaGrafico('anual')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    vistaGrafico === 'anual' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-[#0a0a0f] text-gray-400 hover:text-white'
                  }`}
                >
                  Anual
                </button>
              </div>
            </div>
            
            {/* Gráfico de barras simple */}
            <div className="flex items-end justify-between h-40 gap-2">
              {ingresosPorMes.map((mes, idx) => {
                const maxIngreso = Math.max(...ingresosPorMes.map(m => m.total))
                const altura = maxIngreso > 0 ? (mes.total / maxIngreso) * 100 : 0
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-500"
                      style={{ height: `${Math.max(altura, 5)}%` }}
                    ></div>
                    <span className="text-xs text-gray-400">{mes.mes}</span>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center">Últimos 6 meses</p>
          </div>

          {/* Estado de Cartera */}
          <div className="bg-[#1a1a25] rounded-2xl p-6 border border-[#2a2a35]">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
              Estado de Cartera
            </h3>
            
            {/* Gráfico circular simple */}
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#1a1a25" strokeWidth="12" />
                  <circle 
                    cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="12"
                    strokeDasharray={`${(estadoCartera.completado / Math.max(totalPrestamos, 1)) * 251.2} 251.2`}
                  />
                  <circle 
                    cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="12"
                    strokeDasharray={`${(estadoCartera.pendiente / Math.max(totalPrestamos, 1)) * 251.2} 251.2`}
                    strokeDashoffset={`-${(estadoCartera.completado / Math.max(totalPrestamos, 1)) * 251.2}`}
                  />
                  <circle 
                    cx="50" cy="50" r="40" fill="none" stroke="#ef4444" strokeWidth="12"
                    strokeDasharray={`${(estadoCartera.fallido / Math.max(totalPrestamos, 1)) * 251.2} 251.2`}
                    strokeDashoffset={`-${((estadoCartera.completado + estadoCartera.pendiente) / Math.max(totalPrestamos, 1)) * 251.2}`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white">{totalPrestamos}</p>
                    <p className="text-xs text-gray-400">Total</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Leyenda */}
            <div className="flex justify-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-gray-400">Completado</span>
                <span className="text-white font-medium">{estadoCartera.completado}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-gray-400">Pendiente</span>
                <span className="text-white font-medium">{estadoCartera.pendiente}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-gray-400">Fallido</span>
                <span className="text-white font-medium">{estadoCartera.fallido}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Próximos Vencimientos */}
        <div className="bg-[#1a1a25] rounded-2xl p-6 border border-[#2a2a35] mb-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Próximos Vencimientos
          </h3>
          
          {proximosVencimientos.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No hay vencimientos próximos</p>
          ) : (
            <div className="space-y-3">
              {proximosVencimientos.map((prestamo) => {
                const diasRestantes = Math.ceil((new Date(prestamo.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                return (
                  <div key={prestamo.id} className="bg-[#0a0a0f] rounded-xl p-4 border border-[#2a2a35] flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold">{prestamo.reference || 'REF'}</p>
                      <p className="text-gray-400 text-sm">{new Date(prestamo.due_date).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' })}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">{formatMoney(parseFloat(prestamo.amount || 0))}</p>
                      <p className={`text-xs ${diasRestantes <= 3 ? 'text-red-400' : 'text-yellow-400'}`}>
                        {diasRestantes} días
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Actividad Reciente */}
        <div className="bg-[#1a1a25] rounded-2xl p-6 border border-[#2a2a35] mb-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Actividad Reciente
            </h3>
            <button className="text-blue-400 hover:text-blue-300 text-sm">Ver todas</button>
          </div>
          
          <div className="space-y-4">
            {actividadReciente.map((actividad, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#0a0a0f] transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  actividad.estado === 'success' ? 'bg-green-900/30' :
                  actividad.estado === 'danger' ? 'bg-red-900/30' : 'bg-blue-900/30'
                }`}>
                  {actividad.icono === 'money' ? (
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : actividad.icono === 'alert' ? (
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium">{actividad.titulo}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      actividad.estado === 'success' ? 'bg-green-900/30 text-green-400' :
                      actividad.estado === 'danger' ? 'bg-red-900/30 text-red-400' : 'bg-blue-900/30 text-blue-400'
                    }`}>
                      {actividad.estado}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">{actividad.descripcion}</p>
                  <p className="text-gray-500 text-xs">{actividad.fecha}</p>
                </div>
                <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                  {actividad.tipo === 'vencido' ? 'Gestionar' : `Ver ${actividad.tipo}s`}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Acciones Rápidas
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => router.push('/crm/leads')}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center transition-colors"
            >
              <svg className="w-6 h-6 text-white mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-white text-sm">Ver Leads</span>
            </button>
            
            <button
              onClick={() => router.push('/crm/prestamos')}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center transition-colors"
            >
              <svg className="w-6 h-6 text-white mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-white text-sm">Ver Préstamos</span>
            </button>
            
            <button
              onClick={() => router.push('/crm/pagos')}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center transition-colors"
            >
              <svg className="w-6 h-6 text-white mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-white text-sm">Ver Pagos</span>
            </button>
            
            <button
              onClick={() => router.push('/crm/morosidad')}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center transition-colors"
            >
              <svg className="w-6 h-6 text-white mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-white text-sm">Ver Morosidad</span>
            </button>
          </div>
        </div>

        {/* Footer Stats */}
        <div className="text-center text-xs text-gray-500">
          <p>
            Tasa de conversión: <span className="text-white font-medium">{tasaConversion}%</span> • 
            Ingresos totales: <span className="text-white font-medium">{formatMoney(ingresosTotales)}</span> • 
            Última actualización: <span className="text-white font-medium">{new Date().toLocaleTimeString('es-MX')}</span>
          </p>
        </div>

      </main>
    </div>
  )
}
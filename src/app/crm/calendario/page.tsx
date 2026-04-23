'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/utils/supabase/client'
import { 
  Eye, EyeOff, Download, Printer, AlertTriangle, CheckCircle, 
  XCircle, Phone, MessageCircle, Mail, Shield, ShieldOff,
  TrendingUp, Users, DollarSign, Calendar, Search, Filter,
  Percent, Calculator, AlertCircle as AlertCircleIcon
} from 'lucide-react'

interface ClienteMorosidad {
  id: string
  nombre: string
  email: string
  telefono: string
  montoAdeudado: number
  recargoPendiente: number
  recargoAcumulado: number
  diasAtraso: number
  estado: 'corriente' | 'riesgo' | 'moroso' | 'bloqueado'
  ultimoPago?: string
  creditosAnteriores: number
  fechaRegistro: string
  tasaRecargo?: number
}

interface ResumenMorosidad {
  totalClientes: number
  alCorriente: number
  enRiesgo: number
  morosos: number
  bloqueados: number
  totalAdeudado: number
  totalRecargos: number
  porcentajeMorosidad: number
  recuperacionPotencial: number
}

export default function MorosidadPage() {
  const router = useRouter()
  const { user, profile, profileLoading } = useAuth()
  const supabase = createClient()
  
  const [clientes, setClientes] = useState<ClienteMorosidad[]>([])
  const [resumen, setResumen] = useState<ResumenMorosidad>({
    totalClientes: 0,
    alCorriente: 0,
    enRiesgo: 0,
    morosos: 0,
    bloqueados: 0,
    totalAdeudado: 0,
    totalRecargos: 0,
    porcentajeMorosidad: 0,
    recuperacionPotencial: 0
  })
  const [loading, setLoading] = useState(true)
  const [datosVisibles, setDatosVisibles] = useState<Record<string, boolean>>({})
  const [mostrarTodo, setMostrarTodo] = useState(false)
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'corriente' | 'riesgo' | 'moroso' | 'bloqueado'>('todos')
  const [searchTerm, setSearchTerm] = useState('')
  const [configRecargos, setConfigRecargos] = useState({
    tasaMensual: 5.0,
    tasaDiaria: 0.17,
    diasGracia: 3,
    recargoMinimo: 50,
    recargoMaximo: 5000
  })

  // Calcular recargo por días de atraso
  const calcularRecargo = (monto: number, diasAtraso: number) => {
    if (diasAtraso <= configRecargos.diasGracia) return 0
    
    const diasCalculables = diasAtraso - configRecargos.diasGracia
    const recargoDiario = monto * (configRecargos.tasaDiaria / 100)
    const recargoTotal = recargoDiario * diasCalculables
    
    // Aplicar mínimos y máximos
    return Math.min(Math.max(recargoTotal, configRecargos.recargoMinimo), configRecargos.recargoMaximo)
  }

  // Cargar datos de morosidad
  useEffect(() => {
    async function cargarMorosidad() {
      if (!user) return

      try {
        const clientesData: ClienteMorosidad[] = []

        // 1. Cargar configuración de recargos
        try {
          const {  config } = await supabase
            .from('configuracion_morosidad')
            .select('*')
            .single()
          
          if (config) {
            setConfigRecargos({
              tasaMensual: config.tasa_morosidad_mensual || 5.0,
              tasaDiaria: config.tasa_morosidad_diaria || 0.17,
              diasGracia: config.dias_gracia || 3,
              recargoMinimo: config.recargo_minimo || 50,
              recargoMaximo: config.recargo_maximo || 5000
            })
          }
        } catch (e) {
          console.log('⚠️ Usando configuración por defecto para recargos')
        }

        // 2. Cargar leads, préstamos y pagos
        try {
          const {  leads } = await supabase
            .from('leads')
            .select('id, nombre, email, telefono, estado, creado_en')

          const {  prestamos } = await supabase
            .from('prestamos')
            .select('id, lead_id, monto, estado, fecha_inicio, plazo_meses, recargo_acumulado, dias_mora, tasa_morosidad_mensual')

          const {  pagos } = await supabase
            .from('pagos')
            .select('id, prestamo_id, monto, fecha_pago, estado, recargo_morosidad, porcentaje_recargo')

          // 3. Procesar datos
          if (leads && leads.length > 0) {
            leads.forEach(lead => {
              const prestamosLead = prestamos?.filter(p => p.lead_id === lead.id) || []
              const totalPrestado = prestamosLead.reduce((sum, p) => sum + (p.monto || 0), 0)
              
              const pagosLead = pagos?.filter(p => 
                prestamosLead.some(pl => pl.id === p.prestamo_id)
              ) || []
              
              const totalPagado = pagosLead
                .filter(p => p.estado === 'completado')
                .reduce((sum, p) => sum + (p.monto || 0), 0)
              
              const totalRecargosCobrados = pagosLead
                .reduce((sum, p) => sum + (p.recargo_morosidad || 0), 0)
              
              const montoAdeudado = totalPrestado - totalPagado
              
              // Calcular días de atraso
              let diasAtraso = 0
              const ultimoPago = pagosLead.length > 0 
                ? pagosLead.sort((a, b) => new Date(b.fecha_pago).getTime() - new Date(a.fecha_pago).getTime())[0]
                : null
              
              if (ultimoPago && ultimoPago.fecha_pago) {
                const fechaUltimoPago = new Date(ultimoPago.fecha_pago)
                const hoy = new Date()
                diasAtraso = Math.floor((hoy.getTime() - fechaUltimoPago.getTime()) / (1000 * 60 * 60 * 24))
              }

              // Calcular recargo pendiente
              const recargoPendiente = calcularRecargo(montoAdeudado, diasAtraso)
              const recargoAcumulado = prestamosLead.reduce((sum, p) => sum + (p.recargo_acumulado || 0), 0) + recargoPendiente
              const tasaRecargo = prestamosLead[0]?.tasa_morosidad_mensual || configRecargos.tasaMensual

              // Determinar estado
              let estado: ClienteMorosidad['estado'] = 'corriente'
              if (montoAdeudado > 0 || recargoPendiente > 0) {
                if (diasAtraso > 30) estado = 'bloqueado'
                else if (diasAtraso > 15) estado = 'moroso'
                else if (diasAtraso > configRecargos.diasGracia) estado = 'riesgo'
              }

              clientesData.push({
                id: lead.id,
                nombre: lead.nombre,
                email: lead.email,
                telefono: lead.telefono,
                montoAdeudado,
                recargoPendiente,
                recargoAcumulado,
                diasAtraso,
                estado,
                ultimoPago: ultimoPago?.fecha_pago,
                creditosAnteriores: prestamosLead.length,
                fechaRegistro: lead.creado_en,
                tasaRecargo
              })
            })
          }
        } catch (e) {
          console.log('⚠️ Usando datos de ejemplo para morosidad')
        }

        // 4. Datos de ejemplo si no hay datos reales
        if (clientesData.length === 0) {
          const hoy = new Date()
          clientesData.push(
            {
              id: '1',
              nombre: 'Pedro Sánchez',
              email: 'pedro@email.com',
              telefono: '9931234567',
              montoAdeudado: 3000,
              recargoPendiente: 255, // 3000 * 0.17% * 45 días
              recargoAcumulado: 255,
              diasAtraso: 45,
              estado: 'bloqueado',
              ultimoPago: new Date(hoy.setDate(hoy.getDate() - 45)).toISOString(),
              creditosAnteriores: 3,
              fechaRegistro: new Date().toISOString(),
              tasaRecargo: 5.0
            },
            {
              id: '2',
              nombre: 'María López',
              email: 'maria@email.com',
              telefono: '9937654321',
              montoAdeudado: 8500,
              recargoPendiente: 867, // 8500 * 0.17% * 60 días
              recargoAcumulado: 867,
              diasAtraso: 60,
              estado: 'bloqueado',
              ultimoPago: new Date(hoy.setDate(hoy.getDate() - 60)).toISOString(),
              creditosAnteriores: 5,
              fechaRegistro: new Date().toISOString(),
              tasaRecargo: 5.0
            },
            {
              id: '3',
              nombre: 'Carlos Ruiz',
              email: 'carlos@email.com',
              telefono: '9931112222',
              montoAdeudado: 5000,
              recargoPendiente: 145, // 5000 * 0.17% * 17 días (después de 3 días de gracia)
              recargoAcumulado: 145,
              diasAtraso: 20,
              estado: 'moroso',
              ultimoPago: new Date(hoy.setDate(hoy.getDate() - 20)).toISOString(),
              creditosAnteriores: 2,
              fechaRegistro: new Date().toISOString(),
              tasaRecargo: 5.0
            },
            {
              id: '4',
              nombre: 'Ana González',
              email: 'ana@email.com',
              telefono: '9933334444',
              montoAdeudado: 2000,
              recargoPendiente: 24, // 2000 * 0.17% * 7 días (después de 3 días de gracia)
              recargoAcumulado: 24,
              diasAtraso: 10,
              estado: 'riesgo',
              ultimoPago: new Date(hoy.setDate(hoy.getDate() - 10)).toISOString(),
              creditosAnteriores: 1,
              fechaRegistro: new Date().toISOString(),
              tasaRecargo: 5.0
            },
            {
              id: '5',
              nombre: 'Juan Pérez',
              email: 'juan@email.com',
              telefono: '9935556666',
              montoAdeudado: 0,
              recargoPendiente: 0,
              recargoAcumulado: 0,
              diasAtraso: 0,
              estado: 'corriente',
              ultimoPago: new Date().toISOString(),
              creditosAnteriores: 2,
              fechaRegistro: new Date().toISOString(),
              tasaRecargo: 5.0
            },
            {
              id: '6',
              nombre: 'Laura Martínez',
              email: 'laura@email.com',
              telefono: '9937778888',
              montoAdeudado: 1500,
              recargoPendiente: 15, // 1500 * 0.17% * 2 días (después de 3 días de gracia)
              recargoAcumulado: 15,
              diasAtraso: 5,
              estado: 'riesgo',
              ultimoPago: new Date(hoy.setDate(hoy.getDate() - 5)).toISOString(),
              creditosAnteriores: 1,
              fechaRegistro: new Date().toISOString(),
              tasaRecargo: 5.0
            }
          )
        }

        setClientes(clientesData)

        // 5. Calcular resumen con recargos
        const totalClientes = clientesData.length
        const alCorriente = clientesData.filter(c => c.estado === 'corriente').length
        const enRiesgo = clientesData.filter(c => c.estado === 'riesgo').length
        const morosos = clientesData.filter(c => c.estado === 'moroso').length
        const bloqueados = clientesData.filter(c => c.estado === 'bloqueado').length
        const totalAdeudado = clientesData.reduce((sum, c) => sum + c.montoAdeudado, 0)
        const totalRecargos = clientesData.reduce((sum, c) => sum + c.recargoPendiente, 0)
        const porcentajeMorosidad = totalClientes > 0 
          ? ((morosos + bloqueados) / totalClientes) * 100 
          : 0
        const recuperacionPotencial = totalAdeudado + totalRecargos

        setResumen({
          totalClientes,
          alCorriente,
          enRiesgo,
          morosos,
          bloqueados,
          totalAdeudado,
          totalRecargos,
          porcentajeMorosidad,
          recuperacionPotencial
        })

      } catch (err) {
        console.error('❌ Error cargando morosidad:', err)
      } finally {
        setLoading(false)
      }
    }

    cargarMorosidad()
  }, [user, supabase])

  // Filtrar clientes
  const clientesFiltrados = useMemo(() => {
    return clientes.filter(c => {
      const matchFiltro = filtroEstado === 'todos' || c.estado === filtroEstado
      const matchBusqueda = !searchTerm || 
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
      return matchFiltro && matchBusqueda
    })
  }, [clientes, filtroEstado, searchTerm])

  // Verificar si datos son visibles
  const esVisible = (id: string) => mostrarTodo || datosVisibles[id]

  // Toggle visibilidad por fila
  const toggleVisibilidad = (id: string) => {
    setDatosVisibles(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Formatear moneda
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount)
  }

  // Formatear nombre (ocultar parcial)
  const formatNombre = (nombre: string, visible: boolean) => {
    if (visible) return nombre
    const partes = nombre.split(' ')
    if (partes.length === 1) return `${partes[0].charAt(0)}${'***'}`
    return `${partes[0].charAt(0)}*** ${partes[partes.length - 1].charAt(0)}***`
  }

  // Formatear teléfono (ocultar parcial)
  const formatTelefono = (telefono: string, visible: boolean) => {
    if (visible) return telefono
    return `***-***-${telefono.slice(-4)}`
  }

  // Badge de estado
  const EstadoBadge = ({ estado }: { estado: string }) => {
    const config: Record<string, { bg: string; text: string; icon: any; label: string }> = {
      corriente: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, label: '🟢 Al Corriente' },
      riesgo: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: AlertTriangle, label: '🟡 En Riesgo' },
      moroso: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, label: '🔴 Moroso' },
      bloqueado: { bg: 'bg-gray-100', text: 'text-gray-700', icon: ShieldOff, label: '⚫ Bloqueado' }
    }
    const c = config[estado] || { bg: 'bg-gray-100', text: 'text-gray-700', icon: Shield, label: estado }
    const Icon = c.icon
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
        <Icon className="w-3 h-3" />
        {c.label}
      </span>
    )
  }

  // Acciones rápidas
  const abrirWhatsApp = (cliente: ClienteMorosidad) => {
    const phone = cliente.telefono.replace(/[\s\-\(\)]/g, '')
    const message = encodeURIComponent(`Hola ${cliente.nombre}, te contactamos respecto a tu pago pendiente de ${formatMoney(cliente.montoAdeudado)} más recargos de ${formatMoney(cliente.recargoPendiente)}`)
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank')
  }

  const llamarCliente = (cliente: ClienteMorosidad) => {
    window.open(`tel:${cliente.telefono}`, '_self')
  }

  const enviarEmail = (cliente: ClienteMorosidad) => {
    window.open(`mailto:${cliente.email}?subject=Recordatorio de Pago Pendiente - ${formatMoney(cliente.montoAdeudado + cliente.recargoPendiente)}`, '_blank')
  }

  // Exportar a CSV
  const exportarCSV = (conDatosSensibles: boolean) => {
    const headers = ['Nombre,Email,Teléfono,Monto Adeudado,Recargo,Total,Días Atraso,Estado\n']
    const rows = clientesFiltrados.map(c => {
      const nombre = conDatosSensibles ? c.nombre : formatNombre(c.nombre, false)
      const email = conDatosSensibles ? c.email : '***@***.***'
      const telefono = conDatosSensibles ? c.telefono : formatTelefono(c.telefono, false)
      const total = c.montoAdeudado + c.recargoPendiente
      return `${nombre},${email},${telefono},${c.montoAdeudado},${c.recargoPendiente},${total},${c.diasAtraso},${c.estado}`
    })
    
    const csv = headers.join('') + rows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte-morosidad-${new Date().toISOString().slice(0,10)}-${conDatosSensibles ? 'completo' : 'seguro'}.csv`
    a.click()
  }

  // Imprimir reporte
  const imprimirReporte = () => {
    const incluirDatos = confirm('¿Incluir datos sensibles (teléfonos, emails completos) en la impresión?')
    if (incluirDatos) setMostrarTodo(true)
    setTimeout(() => window.print(), 500)
  }

  if (loading || profileLoading) {
    return (
      <div className="p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto print:p-0">
      {/* Header - No imprimir */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 print:hidden">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">📊 Reporte de Morosidad</h1>
          <p className="text-gray-600 mt-1">Clientes con pagos pendientes, recargos y riesgo crediticio</p>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setMostrarTodo(!mostrarTodo)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              mostrarTodo 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            {mostrarTodo ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {mostrarTodo ? 'Ocultar Todo' : 'Mostrar Todo'}
          </button>
          
          <button
            onClick={imprimirReporte}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
          
          <button
            onClick={() => exportarCSV(false)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            <Download className="w-4 h-4" />
            CSV Seguro
          </button>
          
          <button
            onClick={() => exportarCSV(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            <Download className="w-4 h-4" />
            CSV Completo
          </button>
        </div>
      </div>

      {/* Resumen Ejecutivo */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 mb-6 text-white print:bg-white print:text-black print:border print:border-gray-300">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Resumen Ejecutivo - {new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="bg-white/20 rounded-lg px-3 py-1 text-sm">
            💰 Tasa: {configRecargos.tasaMensual}% mensual ({configRecargos.tasaDiaria}% diaria)
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="bg-white/20 rounded-lg p-2 print:bg-gray-100">
            <p className="text-xs opacity-80">Clientes</p>
            <p className="text-base font-bold">{resumen.totalClientes}</p>
          </div>
          <div className="bg-white/20 rounded-lg p-2 print:bg-green-100">
            <p className="text-xs opacity-80">Corriente</p>
            <p className="text-base font-bold text-green-300 print:text-green-700">{resumen.alCorriente}</p>
          </div>
          <div className="bg-white/20 rounded-lg p-2 print:bg-yellow-100">
            <p className="text-xs opacity-80">Riesgo</p>
            <p className="text-base font-bold text-yellow-300 print:text-yellow-700">{resumen.enRiesgo}</p>
          </div>
          <div className="bg-white/20 rounded-lg p-2 print:bg-red-100">
            <p className="text-xs opacity-80">Morosos</p>
            <p className="text-base font-bold text-red-300 print:text-red-700">{resumen.morosos}</p>
          </div>
          <div className="bg-white/20 rounded-lg p-2 print:bg-gray-100">
            <p className="text-xs opacity-80">Bloqueados</p>
            <p className="text-base font-bold text-gray-300 print:text-gray-700">{resumen.bloqueados}</p>
          </div>
          <div className="bg-white/20 rounded-lg p-2 print:bg-blue-100">
            <p className="text-xs opacity-80">Adeudado</p>
            <p className="text-base font-bold">{formatMoney(resumen.totalAdeudado)}</p>
          </div>
          <div className="bg-white/20 rounded-lg p-2 print:bg-orange-100">
            <p className="text-xs opacity-80">Recargos</p>
            <p className="text-base font-bold text-orange-300 print:text-orange-700">{formatMoney(resumen.totalRecargos)}</p>
          </div>
          <div className="bg-white/20 rounded-lg p-2 print:bg-purple-100">
            <p className="text-xs opacity-80">Total</p>
            <p className="text-base font-bold">{formatMoney(resumen.recuperacionPotencial)}</p>
          </div>
        </div>
      </div>

      {/* Configuración de Recargos - No imprimir */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 print:hidden">
        <div className="flex items-start gap-3">
          <Calculator className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-orange-800">💰 Configuración de Recargos por Morosidad</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-2 text-sm">
              <div>
                <span className="text-orange-600">Tasa Mensual:</span>
                <span className="ml-2 font-medium">{configRecargos.tasaMensual}%</span>
              </div>
              <div>
                <span className="text-orange-600">Tasa Diaria:</span>
                <span className="ml-2 font-medium">{configRecargos.tasaDiaria}%</span>
              </div>
              <div>
                <span className="text-orange-600">Días de Gracia:</span>
                <span className="ml-2 font-medium">{configRecargos.diasGracia} días</span>
              </div>
              <div>
                <span className="text-orange-600">Recargo Mín:</span>
                <span className="ml-2 font-medium">${configRecargos.recargoMinimo}</span>
              </div>
              <div>
                <span className="text-orange-600">Recargo Máx:</span>
                <span className="ml-2 font-medium">${configRecargos.recargoMaximo}</span>
              </div>
            </div>
            <p className="text-xs text-orange-600 mt-2">
              ℹ️ Los recargos se calculan automáticamente después de {configRecargos.diasGracia} días de atraso. 
              Fórmula: (Monto × {configRecargos.tasaDiaria}%) × Días de atraso
            </p>
          </div>
        </div>
      </div>

      {/* Filtros - No imprimir */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6 flex flex-wrap gap-4 items-center print:hidden">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as typeof filtroEstado)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="todos">📋 Todos los estados</option>
            <option value="corriente">🟢 Al Corriente</option>
            <option value="riesgo">🟡 En Riesgo</option>
            <option value="moroso">🔴 Moroso</option>
            <option value="bloqueado">⚫ Bloqueado</option>
          </select>
        </div>
      </div>

      {/* Tabla de Clientes */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden print:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 print:bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Capital</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Recargos</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Total</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Días</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Contacto</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase print:hidden">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {clientesFiltrados.map((cliente) => {
                const visible = esVisible(cliente.id)
                const total = cliente.montoAdeudado + cliente.recargoPendiente
                return (
                  <tr key={cliente.id} className="hover:bg-gray-50 print:hover:bg-transparent">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                          cliente.estado === 'corriente' ? 'bg-green-500' :
                          cliente.estado === 'riesgo' ? 'bg-yellow-500' :
                          cliente.estado === 'moroso' ? 'bg-red-500' :
                          'bg-gray-500'
                        }`}>
                          {cliente.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{formatNombre(cliente.nombre, visible)}</p>
                          {visible && (
                            <p className="text-xs text-gray-500">{cliente.email}</p>
                          )}
                          <p className="text-xs text-gray-400">{cliente.creditosAnteriores} créditos anteriores</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className={`font-bold ${cliente.montoAdeudado > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatMoney(cliente.montoAdeudado)}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <Percent className="w-3 h-3 text-orange-500" />
                        <p className={`font-bold ${cliente.recargoPendiente > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                          {cliente.recargoPendiente > 0 ? formatMoney(cliente.recargoPendiente) : '—'}
                        </p>
                      </div>
                      {visible && cliente.recargoAcumulado > 0 && (
                        <p className="text-xs text-gray-400">Acum: {formatMoney(cliente.recargoAcumulado)}</p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <p className={`font-bold text-lg ${total > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatMoney(total)}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${
                          cliente.diasAtraso > 30 ? 'text-red-600' :
                          cliente.diasAtraso > 15 ? 'text-orange-600' :
                          cliente.diasAtraso > 0 ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {cliente.diasAtraso} días
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <EstadoBadge estado={cliente.estado} />
                    </td>
                    <td className="px-4 py-4">
                      {visible ? (
                        <div className="text-sm text-gray-600">
                          <p>📞 {cliente.telefono}</p>
                          <p className="text-xs text-gray-400">{cliente.email}</p>
                        </div>
                      ) : (
                        <button
                          onClick={() => toggleVisibilidad(cliente.id)}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          Ver Datos
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-4 print:hidden">
                      {visible && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => abrirWhatsApp(cliente)}
                            className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition"
                            title="WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => llamarCliente(cliente)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                            title="Llamar"
                          >
                            <Phone className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => enviarEmail(cliente)}
                            className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition"
                            title="Email"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recomendaciones - No imprimir */}
      <div className="mt-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200 print:hidden">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          Acciones Recomendadas
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border-l-4 border-red-500">
            <p className="text-sm font-semibold text-gray-700">🔴 Prioridad Alta</p>
            <p className="text-2xl font-bold text-red-600">{resumen.morosos + resumen.bloqueados}</p>
            <p className="text-xs text-gray-500 mt-1">Contactar urgentemente</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 border-l-4 border-yellow-500">
            <p className="text-sm font-semibold text-gray-700">🟡 Prioridad Media</p>
            <p className="text-2xl font-bold text-yellow-600">{resumen.enRiesgo}</p>
            <p className="text-xs text-gray-500 mt-1">Seguimiento preventivo</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
            <p className="text-sm font-semibold text-gray-700">🟢 Clientes Sanos</p>
            <p className="text-2xl font-bold text-green-600">{resumen.alCorriente}</p>
            <p className="text-xs text-gray-500 mt-1">Aptos para nuevo crédito</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 border-l-4 border-purple-500">
            <p className="text-sm font-semibold text-gray-700">💰 Recuperación</p>
            <p className="text-2xl font-bold text-purple-600">{formatMoney(resumen.recuperacionPotencial)}</p>
            <p className="text-xs text-gray-500 mt-1">Incluye recargos</p>
          </div>
        </div>
      </div>

      {/* Footer para impresión */}
      <div className="hidden print:block mt-8 pt-8 border-t border-gray-300">
        <div className="flex justify-between items-center text-sm text-gray-500">
          <p>Reporte generado el {new Date().toLocaleDateString('es-MX')}</p>
          <p>PrestaLista Pro - Sistema de Gestión de Préstamos</p>
        </div>
        <div className="mt-4 text-xs text-gray-400">
          <p>Nota: Los recargos se calculan al {configRecargos.tasaDiaria}% diario después de {configRecargos.diasGracia} días de gracia.</p>
        </div>
      </div>
    </div>
  )
}
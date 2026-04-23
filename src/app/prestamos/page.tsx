'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/utils/supabase/client'
import { 
  Plus, Pencil, Eye, FileText, DollarSign, Search, Filter,
  CreditCard, AlertCircle, CheckCircle, Clock, TrendingUp
} from 'lucide-react'

interface Prestamo {
  id: string
  cliente_nombre: string
  cliente_email: string
  monto: number
  tasa_interes: number
  plazo_meses: number
  frecuencia_pago: 'semanal' | 'quincenal' | 'mensual'
  fecha_inicio: string
  estado: 'pendiente' | 'activo' | 'pagado' | 'moroso'
  proximo_pago?: string
  monto_restante?: number
  creado_en: string
}

interface Stats {
  totalPrestados: number
  activos: number
  pagados: number
  morosos: number
  recuperado: number
}

const ESTADOS = ['todos', 'pendiente', 'activo', 'pagado', 'moroso'] as const
type EstadoFilter = typeof ESTADOS[number]

export default function PrestamosPage() {
  const router = useRouter()
  const { user, profileLoading } = useAuth()
  const supabase = createClient()
  
  const [prestamos, setPrestamos] = useState<Prestamo[]>([])
  const [stats, setStats] = useState<Stats>({
    totalPrestados: 0,
    activos: 0,
    pagados: 0,
    morosos: 0,
    recuperado: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>('todos')

  // Cargar préstamos desde Supabase
  useEffect(() => {
    async function fetchPrestamos() {
      if (!user) return

      try {
        // Intentar obtener de tabla 'prestamos' si existe
        let data: Prestamo[] = []
        
        try {
          const {  prestamosData, error } = await supabase
            .from('prestamos')
            .select(`
              *,
              leads (nombre, email)
            `)
            .order('fecha_inicio', { ascending: false })
          
          if (!error && prestamosData) {
            data = prestamosData.map((p: any) => ({
              id: p.id,
              cliente_nombre: p.leads?.nombre || 'Cliente',
              cliente_email: p.leads?.email || '',
              monto: p.monto,
              tasa_interes: p.tasa_interes,
              plazo_meses: p.plazo_meses,
              frecuencia_pago: p.frecuencia_pago,
              fecha_inicio: p.fecha_inicio,
              estado: p.estado,
              proximo_pago: p.proximo_pago,
              monto_restante: p.monto_restante,
              creado_en: p.creado_en
            }))
          }
        } catch (e) {
          console.log('⚠️ Tabla prestamos no existe, usando datos simulados')
        }

        // Si no hay datos reales, usar datos de ejemplo para desarrollo
        if (data.length === 0) {
          data = [
            {
              id: '1',
              cliente_nombre: 'María González',
              cliente_email: 'maria@email.com',
              monto: 15000,
              tasa_interes: 12.5,
              plazo_meses: 6,
              frecuencia_pago: 'quincenal',
              fecha_inicio: '2026-03-15',
              estado: 'activo',
              proximo_pago: '2026-04-15',
              monto_restante: 10500,
              creado_en: '2026-03-15T10:00:00Z'
            },
            {
              id: '2',
              cliente_nombre: 'Carlos Ruiz',
              cliente_email: 'carlos@email.com',
              monto: 8000,
              tasa_interes: 10,
              plazo_meses: 4,
              frecuencia_pago: 'semanal',
              fecha_inicio: '2026-02-01',
              estado: 'pagado',
              proximo_pago: undefined,
              monto_restante: 0,
              creado_en: '2026-02-01T10:00:00Z'
            },
            {
              id: '3',
              cliente_nombre: 'Ana López',
              cliente_email: 'ana@email.com',
              monto: 25000,
              tasa_interes: 15,
              plazo_meses: 12,
              frecuencia_pago: 'mensual',
              fecha_inicio: '2026-01-10',
              estado: 'moroso',
              proximo_pago: '2026-03-10',
              monto_restante: 18000,
              creado_en: '2026-01-10T10:00:00Z'
            }
          ]
        }

        setPrestamos(data)

        // Calcular estadísticas
        const totalPrestados = data.reduce((sum, p) => sum + p.monto, 0)
        const activos = data.filter(p => p.estado === 'activo').length
        const pagados = data.filter(p => p.estado === 'pagado').length
        const morosos = data.filter(p => p.estado === 'moroso').length
        const recuperado = data
          .filter(p => p.estado === 'pagado')
          .reduce((sum, p) => sum + p.monto, 0)

        setStats({ totalPrestados, activos, pagados, morosos, recuperado })

      } catch (err) {
        console.error('❌ Error cargando préstamos:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPrestamos()
  }, [user, supabase])

  // Filtrar préstamos
  const prestamosFiltrados = useMemo(() => {
    return prestamos.filter(p => {
      const matchSearch = !searchTerm || 
        p.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.cliente_email.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchEstado = estadoFilter === 'todos' || p.estado === estadoFilter
      
      return matchSearch && matchEstado
    })
  }, [prestamos, searchTerm, estadoFilter])

  // Badge de estado con colores
  const EstadoBadge = ({ estado }: { estado: string }) => {
    const config: Record<string, { bg: string; text: string; icon: any; label: string }> = {
      pendiente: { 
        bg: 'bg-yellow-100', text: 'text-yellow-700', 
        icon: Clock, label: '⏳ Pendiente' 
      },
      activo: { 
        bg: 'bg-green-100', text: 'text-green-700', 
        icon: CheckCircle, label: '🟢 Activo' 
      },
      pagado: { 
        bg: 'bg-blue-100', text: 'text-blue-700', 
        icon: CheckCircle, label: '✅ Pagado' 
      },
      moroso: { 
        bg: 'bg-red-100', text: 'text-red-700', 
        icon: AlertCircle, label: '🔴 Moroso' 
      },
    }
    const c = config[estado] || { bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock, label: estado }
    const Icon = c.icon
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
        <Icon className="w-3 h-3" />
        {c.label}
      </span>
    )
  }

  // Formatear moneda
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (loading || profileLoading) {
    return (
      <div className="p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">💰 Préstamos</h1>
          <p className="text-gray-600 mt-1">Gestiona tus préstamos activos</p>
        </div>
        
        <button
          onClick={() => router.push('/prestamos/new')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          Nuevo Préstamo
        </button>
      </div>

      {/* Tarjetas de KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-blue-500">
          <p className="text-xs text-gray-600">Total Prestado</p>
          <p className="text-xl font-bold text-gray-800">{formatMoney(stats.totalPrestados)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-green-500">
          <p className="text-xs text-gray-600">Activos</p>
          <p className="text-xl font-bold text-green-600">{stats.activos}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-blue-500">
          <p className="text-xs text-gray-600">Pagados</p>
          <p className="text-xl font-bold text-blue-600">{stats.pagados}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-red-500">
          <p className="text-xs text-gray-600">Morosos</p>
          <p className="text-xl font-bold text-red-600">{stats.morosos}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-purple-500">
          <p className="text-xs text-gray-600">Recuperado</p>
          <p className="text-xl font-bold text-purple-600">{formatMoney(stats.recuperado)}</p>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Búsqueda */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cliente o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Filtro Estado */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value as EstadoFilter)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              {ESTADOS.map(estado => (
                <option key={estado} value={estado}>
                  {estado === 'todos' ? '📋 Todos los estados' : estado.charAt(0).toUpperCase() + estado.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de Préstamos */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Cliente</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Monto</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Tasa/Plazo</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Próximo Pago</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Restante</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Estado</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {prestamosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">
                      {searchTerm || estadoFilter !== 'todos'
                        ? 'No se encontraron préstamos con esos filtros'
                        : 'No hay préstamos registrados. ¡Crea el primero!'}
                    </p>
                    {!searchTerm && estadoFilter === 'todos' && (
                      <button
                        onClick={() => router.push('/prestamos/new')}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        + Crear Préstamo
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                prestamosFiltrados.map((prestamo) => (
                  <tr key={prestamo.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{prestamo.cliente_nombre}</div>
                        <div className="text-sm text-gray-500">{prestamo.cliente_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-800">
                      {formatMoney(prestamo.monto)}
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      <div>{prestamo.tasa_interes}% anual</div>
                      <div className="text-xs text-gray-400">
                        {prestamo.plazo_meses} meses • {prestamo.frecuencia_pago}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {prestamo.proximo_pago 
                        ? new Date(prestamo.proximo_pago).toLocaleDateString('es-MX')
                        : '—'
                      }
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {prestamo.monto_restante !== undefined && prestamo.monto_restante > 0
                        ? formatMoney(prestamo.monto_restante)
                        : '✅ Pagado'
                      }
                    </td>
                    <td className="px-6 py-4">
                      <EstadoBadge estado={prestamo.estado} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => router.push(`/prestamos/${prestamo.id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => router.push(`/prestamos/${prestamo.id}/edit`)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {/* Generar contrato */}}
                          className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition"
                          title="Generar contrato"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        {prestamo.estado === 'activo' && (
                          <button
                            onClick={() => router.push(`/pagos/new?prestamo_id=${prestamo.id}`)}
                            className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition"
                            title="Registrar pago"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contador */}
      <div className="mt-4 text-sm text-gray-500">
        {prestamosFiltrados.length} préstamo{prestamosFiltrados.length !== 1 ? 's' : ''} 
        {searchTerm && ` para "${searchTerm}"`}
        {estadoFilter !== 'todos' && ` • Estado: ${estadoFilter}`}
      </div>
    </div>
  )
}
'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/utils/supabase/client'
import { ROLE_PERMISSIONS } from '@/types/roles'
import { Plus, Pencil, Trash2, MessageCircle, Search, Filter, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, User } from 'lucide-react'

interface Lead {
  id: string
  nombre: string
  email: string
  telefono: string
  empresa: string
  estado: string
  whatsapp?: string
  creado_en: string
}

type SortField = 'nombre' | 'email' | 'telefono' | 'empresa' | 'estado' | 'creado_en'
type SortDirection = 'asc' | 'desc'

const ESTADOS = ['todos', 'nuevo', 'contactado', 'calificado', 'aprobado', 'rechazado'] as const
type EstadoFilter = typeof ESTADOS[number]

const ITEMS_POR_PAGINA = [10, 25, 50]

export default function LeadsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, profile, profileLoading } = useAuth()
  const supabase = createClient()
  
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('')
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>('todos')
  const [fechaFilter, setFechaFilter] = useState<'todos' | 'hoy' | 'semana' | 'mes'>('todos')
  
  // Ordenamiento
  const [sortField, setSortField] = useState<SortField>('creado_en')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  
  // Paginación
  const [paginaActual, setPaginaActual] = useState(1)
  const [itemsPorPagina, setItemsPorPagina] = useState(10)

  const userRole = profile?.role || 'viewer'
  const permissions = ROLE_PERMISSIONS[userRole]

  // Fetch leads desde Supabase
  useEffect(() => {
    async function fetchLeads() {
      if (!user) return

      try {
        let query = supabase.from('leads').select('*')
        
        // Filtro por fecha
        if (fechaFilter !== 'todos') {
          const ahora = new Date()
          let fechaInicio: Date
          
          switch (fechaFilter) {
            case 'hoy':
              fechaInicio = new Date(ahora.setHours(0, 0, 0, 0))
              break
            case 'semana':
              fechaInicio = new Date(ahora.setDate(ahora.getDate() - 7))
              break
            case 'mes':
              fechaInicio = new Date(ahora.setMonth(ahora.getMonth() - 1))
              break
            default:
              fechaInicio = new Date(0)
          }
          
          query = query.gte('creado_en', fechaInicio.toISOString())
        }
        
        // Ordenamiento
        query = query.order(sortField, { ascending: sortDirection === 'asc' })
        
        const { data, error } = await query

        if (error) throw error
        setLeads(data || [])
      } catch (err: any) {
        console.error('❌ Error fetching leads:', err)
        setError('No se pudieron cargar los leads')
      }
      setLoading(false)
    }

    fetchLeads()
  }, [user, supabase, sortField, sortDirection, fechaFilter])

  // Sincronizar filtros con URL (para compartir enlaces)
  useEffect(() => {
    const params = new URLSearchParams(searchParams)
    if (searchTerm) params.set('q', searchTerm)
    else params.delete('q')
    if (estadoFilter !== 'todos') params.set('estado', estadoFilter)
    else params.delete('estado')
    router.replace(`/crm/leads?${params.toString()}`, { scroll: false })
  }, [searchTerm, estadoFilter, router, searchParams])

  // Leads filtrados y paginados (client-side para búsqueda)
  const leadsFiltrados = useMemo(() => {
    let resultado = [...leads]
    
    // Búsqueda en tiempo real
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      resultado = resultado.filter(lead =>
        lead.nombre.toLowerCase().includes(term) ||
        lead.email.toLowerCase().includes(term) ||
        lead.telefono.includes(term) ||
        lead.empresa.toLowerCase().includes(term)
      )
    }
    
    // Filtro por estado
    if (estadoFilter !== 'todos') {
      resultado = resultado.filter(lead => lead.estado === estadoFilter)
    }
    
    return resultado
  }, [leads, searchTerm, estadoFilter])

  // Paginación
  const totalPaginas = Math.ceil(leadsFiltrados.length / itemsPorPagina)
  const leadsPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * itemsPorPagina
    return leadsFiltrados.slice(inicio, inicio + itemsPorPagina)
  }, [leadsFiltrados, paginaActual, itemsPorPagina])

  // Resetear a página 1 cuando cambian los filtros
  useEffect(() => {
    setPaginaActual(1)
  }, [searchTerm, estadoFilter, fechaFilter, itemsPorPagina])

  // Funciones de ordenamiento
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-4 h-4 inline ml-1" />
      : <ChevronDown className="w-4 h-4 inline ml-1" />
  }

  // Función para abrir WhatsApp
  const openWhatsApp = (lead: Lead) => {
    if (!lead.whatsapp) return
    const phone = lead.whatsapp.replace(/[\s\-\(\)]/g, '')
    const message = encodeURIComponent(`Hola ${lead.nombre}, te contacto desde PrestaLista Pro respecto a tu solicitud de préstamo`)
    const url = `https://wa.me/${phone}?text=${message}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  // Eliminar lead
  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este lead?')) return
    try {
      const { error } = await supabase.from('leads').delete().eq('id', id)
      if (error) throw error
      setLeads(leads.filter(lead => lead.id !== id))
    } catch (err: any) {
      console.error('❌ Error deleting lead:', err)
      alert('No se pudo eliminar el lead')
    }
  }

  // Badge de estado con colores mejorados
  const EstadoBadge = ({ estado }: { estado: string }) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      nuevo: { bg: 'bg-blue-100', text: 'text-blue-700', label: '🆕 Nuevo' },
      contactado: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '📞 Contactado' },
      calificado: { bg: 'bg-purple-100', text: 'text-purple-700', label: '✅ Calificado' },
      aprobado: { bg: 'bg-green-100', text: 'text-green-700', label: '🎉 Aprobado' },
      rechazado: { bg: 'bg-red-100', text: 'text-red-700', label: '❌ Rechazado' },
    }
    const c = config[estado] || { bg: 'bg-gray-100', text: 'text-gray-700', label: estado }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    )
  }

  // Avatar con inicial del nombre
  const Avatar = ({ nombre }: { nombre: string }) => {
    const inicial = nombre.charAt(0).toUpperCase()
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold">
        {inicial}
      </div>
    )
  }

  // Loading skeleton
  if (loading || profileLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-32 bg-gray-200 rounded mt-2 animate-pulse"></div>
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-6 py-4 border-b border-gray-100 flex gap-4">
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">📊 Leads</h1>
          <p className="text-gray-600 mt-1">Gestiona tus leads de préstamos</p>
        </div>
        
        {permissions.canCreate && (
          <button
            onClick={() => router.push('/crm/leads/new')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nuevo Lead
          </button>
        )}
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          
          {/* Búsqueda */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, email, teléfono o empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
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

          {/* Filtro Fecha */}
          <select
            value={fechaFilter}
            onChange={(e) => setFechaFilter(e.target.value as typeof fechaFilter)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="todos">📅 Todas las fechas</option>
            <option value="hoy">🌞 Hoy</option>
            <option value="semana">📆 Esta semana</option>
            <option value="mes">🗓️ Este mes</option>
          </select>
        </div>

        {/* Resultados */}
        <div className="text-sm text-gray-500">
          {leadsFiltrados.length} resultado{leadsFiltrados.length !== 1 ? 's' : ''} 
          {searchTerm && ` para "${searchTerm}"`}
          {estadoFilter !== 'todos' && ` • Estado: ${estadoFilter}`}
        </div>
      </div>

      {/* Tabla de Leads */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Lead</th>
                <th 
                  className="px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition"
                  onClick={() => handleSort('email')}
                >
                  Email {getSortIcon('email')}
                </th>
                <th 
                  className="px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition"
                  onClick={() => handleSort('telefono')}
                >
                  Teléfono {getSortIcon('telefono')}
                </th>
                <th 
                  className="px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition"
                  onClick={() => handleSort('empresa')}
                >
                  Empresa {getSortIcon('empresa')}
                </th>
                <th 
                  className="px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition"
                  onClick={() => handleSort('estado')}
                >
                  Estado {getSortIcon('estado')}
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leadsPaginados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">
                      {searchTerm || estadoFilter !== 'todos' 
                        ? 'No se encontraron leads con esos filtros' 
                        : 'No hay leads registrados. ¡Crea el primero!'}
                    </p>
                    {!searchTerm && estadoFilter === 'todos' && permissions.canCreate && (
                      <button
                        onClick={() => router.push('/crm/leads/new')}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        + Agregar Lead
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                leadsPaginados.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar nombre={lead.nombre} />
                        <div>
                          <div className="font-medium text-gray-900">{lead.nombre}</div>
                          <div className="text-xs text-gray-400">
                            {new Date(lead.creado_en).toLocaleDateString('es-MX')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{lead.email}</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{lead.telefono}</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{lead.empresa}</td>
                    <td className="px-6 py-4">
                      <EstadoBadge estado={lead.estado} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition">
                        {permissions.canEdit && (
                          <button
                            onClick={() => router.push(`/crm/leads/${lead.id}/edit`)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        {lead.whatsapp && (
                          <button
                            onClick={() => openWhatsApp(lead)}
                            className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition"
                            title="WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        )}
                        {permissions.canDelete && (
                          <button
                            onClick={() => handleDelete(lead.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              Página {paginaActual} de {totalPaginas}
            </div>
            
            <div className="flex items-center gap-4">
              {/* Items por página */}
              <select
                value={itemsPorPagina}
                onChange={(e) => setItemsPorPagina(Number(e.target.value))}
                className="px-2 py-1 border border-gray-200 rounded text-sm bg-white"
              >
                {ITEMS_POR_PAGINA.map(n => (
                  <option key={n} value={n}>{n} por página</option>
                ))}
              </select>
              
              {/* Botones de navegación */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                  disabled={paginaActual === 1}
                  className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  title="Anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                {[...Array(totalPaginas)].map((_, i) => {
                  const num = i + 1
                  // Mostrar solo páginas cercanas para no saturar
                  if (num === 1 || num === totalPaginas || Math.abs(num - paginaActual) <= 1) {
                    return (
                      <button
                        key={num}
                        onClick={() => setPaginaActual(num)}
                        className={`w-8 h-8 rounded text-sm font-medium transition ${
                          paginaActual === num 
                            ? 'bg-blue-600 text-white' 
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {num}
                      </button>
                    )
                  }
                  if (num === 2 && paginaActual > 3) return <span key="dots1" className="px-2">...</span>
                  if (num === totalPaginas - 1 && paginaActual < totalPaginas - 2) return <span key="dots2" className="px-2">...</span>
                  return null
                })}
                
                <button
                  onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                  disabled={paginaActual === totalPaginas}
                  className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  title="Siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
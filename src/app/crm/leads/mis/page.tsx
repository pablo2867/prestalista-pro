'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useTenant } from '@/context/TenantContext'
import Sidebar from '@/components/Sidebar'
import { 
  Users, Plus, Search, Phone, Mail, Star,
  ArrowUpRight, AlertTriangle
} from 'lucide-react'

// Datos de prueba por si Supabase falla
const DEMO_LEADS = [
  {
    id: 'demo-1',
    nombre: 'Juan Pérez',
    email: 'juan@email.com',
    telefono: '5512345678',
    estado: 'nuevo',
    riesgo: 'medio' as const,
    score: 50,
    rating: 3,
    created_at: new Date().toISOString()
  },
  {
    id: 'demo-2',
    nombre: 'María López',
    email: 'maria@email.com',
    telefono: '5587654321',
    estado: 'contactado',
    riesgo: 'bajo' as const,
    score: 75,
    rating: 4,
    created_at: new Date().toISOString()
  },
  {
    id: 'demo-3',
    nombre: 'Carlos Ruiz',
    email: 'carlos@email.com',
    telefono: '5511223344',
    estado: 'aprobado',
    riesgo: 'alto' as const,
    score: 30,
    rating: 2,
    created_at: new Date().toISOString()
  }
]

export default function MisLeadsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { tenant } = useTenant()
  
  const [leads, setLeads] = useState<any[]>([])
  const [filtro, setFiltro] = useState<'todos' | 'bajo' | 'medio' | 'alto'>('todos')
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Timeout de seguridad: 3 segundos máximo
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ Timeout - mostrando datos de demostración')
        setLeads(DEMO_LEADS)
        setLoading(false)
      }
    }, 3000)

    // Intentar cargar datos reales si hay user y tenant
    if (user && tenant) {
      // Aquí irían las queries a Supabase (opcional)
      // Por ahora usamos datos de demo para que cargue siempre
    }

    return () => clearTimeout(timeoutId)
  }, [user, tenant, loading])

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    })
  }

  const getRiesgoColor = (riesgo: string) => {
    switch (riesgo) {
      case 'bajo': return 'bg-green-900/30 text-green-400 border-green-700/50'
      case 'medio': return 'bg-amber-900/30 text-amber-400 border-amber-700/50'
      case 'alto': return 'bg-red-900/30 text-red-400 border-red-700/50'
      default: return 'bg-gray-900/30 text-gray-400 border-gray-700/50'
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'nuevo': return { bg: 'bg-blue-900/30', text: 'text-blue-400', label: 'NUEVO' }
      case 'contactado': return { bg: 'bg-purple-900/30', text: 'text-purple-400', label: 'CONTACTADO' }
      case 'aprobado': return { bg: 'bg-green-900/30', text: 'text-green-400', label: 'APROBADO' }
      case 'rechazado': return { bg: 'bg-red-900/30', text: 'text-red-400', label: 'RECHAZADO' }
      default: return { bg: 'bg-gray-900/30', text: 'text-gray-400', label: estado.toUpperCase() }
    }
  }

  const getRatingStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <Star key={i} className={`w-3 h-3 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-600'}`} />
    ))
  }

  // Filtrar leads
  const leadsFiltrados = leads.filter((lead: any) => {
    if (busqueda && !lead.nombre?.toLowerCase().includes(busqueda.toLowerCase())) return false
    if (filtro !== 'todos' && lead.riesgo !== filtro) return false
    return true
  })

  // Loading state simplificado
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando leads...</p>
          <p className="text-gray-600 text-xs mt-2">Si tarda más de 3s, mostrará datos de demostración</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Sidebar />
      
      <main className="lg:ml-64 p-6 md:p-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Mis Leads</h1>
              <p className="text-gray-400 text-sm">Gestiona tus leads asignados</p>
            </div>
          </div>
          <button 
            onClick={() => router.push('/crm/leads/nuevo')}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition flex items-center gap-2 font-medium"
          >
            <Plus className="w-4 h-4" />
            Nuevo Lead
          </button>
        </div>

        {/* Buscador y Filtros */}
        <div className="bg-[#1a1a25] rounded-2xl p-4 md:p-6 border border-[#2a2a35] mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre..."
                className="w-full pl-12 pr-4 py-3 bg-[#0a0a0f] border border-[#2a2a35] rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'todos', label: 'Todos' },
                { key: 'bajo', label: 'Bajo' },
                { key: 'medio', label: 'Medio' },
                { key: 'alto', label: 'Alto' }
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFiltro(f.key as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    filtro === f.key
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'bg-[#0a0a0f] text-gray-400 hover:text-white border border-[#2a2a35]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1a1a25] rounded-xl p-4 border border-[#2a2a35]">
            <p className="text-gray-400 text-xs">Total Leads</p>
            <p className="text-2xl font-bold text-white">{leads.length}</p>
          </div>
          <div className="bg-[#1a1a25] rounded-xl p-4 border border-[#2a2a35]">
            <p className="text-gray-400 text-xs">Nuevos</p>
            <p className="text-2xl font-bold text-blue-400">
              {leads.filter((l: any) => l.estado === 'nuevo').length}
            </p>
          </div>
          <div className="bg-[#1a1a25] rounded-xl p-4 border border-[#2a2a35]">
            <p className="text-gray-400 text-xs">Aprobados</p>
            <p className="text-2xl font-bold text-green-400">
              {leads.filter((l: any) => l.estado === 'aprobado').length}
            </p>
          </div>
          <div className="bg-[#1a1a25] rounded-xl p-4 border border-[#2a2a35]">
            <p className="text-gray-400 text-xs">Alto Riesgo</p>
            <p className="text-2xl font-bold text-red-400">
              {leads.filter((l: any) => l.riesgo === 'alto').length}
            </p>
          </div>
        </div>

        {/* Lista de Leads */}
        <div className="bg-[#1a1a25] rounded-2xl p-6 border border-[#2a2a35]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">Leads Asignados</h2>
            <span className="text-sm text-gray-400 bg-[#0a0a0f] px-3 py-1 rounded-full">
              {leadsFiltrados.length} resultados
            </span>
          </div>

          {leadsFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">No hay leads que coincidan</p>
              <p className="text-gray-500 text-sm">Intenta con otros filtros o crea un nuevo lead</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leadsFiltrados.map((lead: any) => {
                const estadoBadge = getEstadoBadge(lead.estado)
                return (
                  <div 
                    key={lead.id} 
                    className="bg-[#0a0a0f] rounded-xl p-5 border border-[#2a2a35] hover:border-blue-600/50 transition"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {lead.nombre?.[0]?.toUpperCase() || 'L'}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{lead.nombre}</p>
                          <p className="text-xs text-gray-500">{formatFecha(lead.created_at)}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full border ${estadoBadge.bg} ${estadoBadge.text}`}>
                        {estadoBadge.label}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Phone className="w-4 h-4" />
                        <span>{lead.telefono || 'Sin teléfono'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{lead.email || 'Sin email'}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-[#1a1a25] rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Riesgo</p>
                        <span className={`text-xs px-2 py-1 rounded-full border ${getRiesgoColor(lead.riesgo)}`}>
                          {lead.riesgo?.toUpperCase()}
                        </span>
                      </div>
                      <div className="bg-[#1a1a25] rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Score</p>
                        <p className="text-lg font-bold text-white">{lead.score}<span className="text-xs text-gray-500">/100</span></p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[#2a2a35]">
                      <div className="flex items-center gap-1">
                        {getRatingStars(lead.rating)}
                      </div>
                      <button className="text-xs px-3 py-1 bg-green-900/30 text-green-400 rounded-lg hover:bg-green-900/50 transition flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        Contactar
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Nota de demostración */}
        {leads.length > 0 && leads[0].id?.startsWith('demo') && (
          <div className="mt-6 bg-amber-900/20 border border-amber-700/50 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-300 text-sm font-medium">Datos de demostración</p>
              <p className="text-amber-400/80 text-xs mt-1">
                Estás viendo datos de prueba porque la conexión con Supabase está pendiente de configurar. 
                Cuando conectes tu base de datos, verás tus leads reales.
              </p>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/utils/supabase/client'
import { Lead } from '@/types/crm'
import EmailButton from '@/components/EmailButton'
import { UserRoleBadge } from '@/components/UserRoleBadge'
import { ROLE_PERMISSIONS } from '@/types/roles'
import { 
  Plus, 
  Search, 
  Users, 
  Phone, 
  Mail,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  MessageCircle,
  LogOut
} from 'lucide-react'

export default function CRMPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const { profile } = useAuth()
  const router = useRouter()
  
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEstado, setFilterEstado] = useState<string>('todos')
  const supabase = createClient()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchLeads()
    }
  }, [user])

  async function fetchLeads() {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('creado_en', { ascending: false })
      
      if (error) {
        console.error('❌ Error de Supabase:', error)
        return
      }
      
      if (data) {
        setLeads(data)
      }
    } catch (err) {
      console.error('💥 Error inesperado:', err)
    }
    setLoading(false)
  }

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.empresa.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterEstado === 'todos' || lead.estado === filterEstado
    
    return matchesSearch && matchesFilter
  })

  const stats = {
    total: leads.length,
    nuevos: leads.filter(l => l.estado === 'nuevo').length,
    contactados: leads.filter(l => l.estado === 'contactado').length,
    calificados: leads.filter(l => l.estado === 'calificado').length,
  }

  const userRole = profile?.role || 'viewer'
  const permissions = ROLE_PERMISSIONS[userRole]

  const getEstadoConfig = (estado: string) => {
    const configs = {
      nuevo: { color: 'bg-green-100 text-green-800 border-green-200', icon: Clock, label: 'Nuevo' },
      contactado: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Phone, label: 'Contactado' },
      calificado: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: CheckCircle2, label: 'Calificado' },
      perdido: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle, label: 'Perdido' },
    }
    return configs[estado as keyof typeof configs] || configs.nuevo
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
          <p className="text-gray-600">Gestiona tus leads y aumenta tus conversiones</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user.email}</p>
              <UserRoleBadge />
              <button
                onClick={() => signOut()}
                className="text-xs text-red-600 hover:underline flex items-center gap-1"
              >
                <LogOut className="w-3 h-3" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Total Leads</p>
              <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Nuevos</p>
              <p className="text-3xl font-bold text-gray-800">{stats.nuevos}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Contactados</p>
              <p className="text-3xl font-bold text-gray-800">{stats.contactados}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Phone className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Calificados</p>
              <p className="text-3xl font-bold text-gray-800">{stats.calificados}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-xl font-semibold text-gray-800">Leads Registrados</h2>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
                />
              </div>

              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Todos los estados</option>
                <option value="nuevo">Nuevo</option>
                <option value="contactado">Contactado</option>
                <option value="calificado">Calificado</option>
                <option value="perdido">Perdido</option>
              </select>

              {permissions.canCreate && (
                <a
                  href="/crm/leads/new"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  <span>Nuevo Lead</span>
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              Cargando leads...
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No hay leads registrados</p>
              <p className="text-gray-400 text-sm mt-2">Comienza agregando tu primer lead</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Lead</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contacto</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Empresa</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLeads.map((lead) => {
                  const estadoConfig = getEstadoConfig(lead.estado)
                  const EstadoIcon = estadoConfig.icon
                  
                  return (
                    <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                            {lead.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{lead.nombre}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="w-4 h-4 mr-2 text-gray-400" />
                            {lead.email}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                            {lead.telefono}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-900">
                          <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                          {lead.empresa}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${estadoConfig.color}`}>
                          <EstadoIcon className="w-3 h-3" />
                          {estadoConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(lead.creado_en).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {lead.whatsapp && (
                            <a
                              href={`https://wa.me/${lead.whatsapp.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(lead.nombre)}%2C%20te%20contacto%20de%20${encodeURIComponent(lead.empresa)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Enviar WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}
                          <EmailButton lead={lead} />
                          
                          {permissions.canEdit && (
                            <a
                              href={`/crm/leads/${lead.id}/edit`}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </a>
                          )}
                          
                          {permissions.canDelete && (
                            <button type="button" className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
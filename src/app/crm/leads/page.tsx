'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/utils/supabase/client'
import { ROLE_PERMISSIONS } from '@/types/roles'
import { Plus, Pencil, Trash2, MessageCircle } from 'lucide-react'

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

export default function LeadsPage() {
  const router = useRouter()
  const { user, profile, profileLoading } = useAuth()
  const supabase = createClient()
  
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const userRole = profile?.role || 'viewer'
  const permissions = ROLE_PERMISSIONS[userRole]

  // Fetch leads
  useEffect(() => {
    async function fetchLeads() {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .order('creado_en', { ascending: false })

        if (error) throw error

        setLeads(data || [])
      } catch (err: any) {
        console.error('❌ Error fetching leads:', err)
        setError('No se pudieron cargar los leads')
      }

      setLoading(false)
    }

    fetchLeads()
  }, [user, supabase])

  // Función para abrir WhatsApp
  const openWhatsApp = (lead: Lead) => {
    if (!lead.whatsapp) return
    
    const phone = lead.whatsapp.replace(/[\s\-\(\)]/g, '')
    const message = encodeURIComponent(`Hola ${lead.nombre}, te contacto desde PrestaLista Pro respecto a tu solicitud de préstamo`)
    const url = `https://wa.me/${phone}?text=${message}`
    
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este lead?')) return

    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id)

      if (error) throw error

      setLeads(leads.filter(lead => lead.id !== id))
    } catch (err: any) {
      console.error('❌ Error deleting lead:', err)
      alert('No se pudo eliminar el lead')
    }
  }

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Leads</h1>
          <p className="text-gray-600 mt-2">Gestiona tus leads de préstamos</p>
        </div>
        
        {permissions.canCreate && (
          <button
            onClick={() => router.push('/crm/leads/new')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo Lead
          </button>
        )}
      </div>

      {/* Tabla de Leads */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Nombre</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Teléfono</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Empresa</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Estado</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No hay leads registrados. ¡Crea el primero!
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{lead.nombre}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{lead.email}</td>
                    <td className="px-6 py-4 text-gray-600">{lead.telefono}</td>
                    <td className="px-6 py-4 text-gray-600">{lead.empresa}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        lead.estado === 'nuevo' ? 'bg-blue-100 text-blue-700' :
                        lead.estado === 'contactado' ? 'bg-yellow-100 text-yellow-700' :
                        lead.estado === 'calificado' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {lead.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {permissions.canEdit && (
                          <button
                            onClick={() => router.push(`/crm/leads/${lead.id}/edit`)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        
                        {/* 👇 Botón de WhatsApp en la lista */}
                        {lead.whatsapp && (
                          <button
                            onClick={() => openWhatsApp(lead)}
                            className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                            title="Enviar WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        )}
                        
                        {permissions.canDelete && (
                          <button
                            onClick={() => handleDelete(lead.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
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
      </div>

      {/* Contador */}
      <div className="mt-4 text-sm text-gray-500">
        {leads.length} lead{leads.length !== 1 ? 's' : ''} encontrado{leads.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}
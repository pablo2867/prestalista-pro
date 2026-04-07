'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/utils/supabase/client'
import { ROLE_PERMISSIONS } from '@/types/roles'
import { ArrowLeft, Save, XCircle } from 'lucide-react'
import WhatsAppButton from '@/app/components/whatsapp/WhatsAppButton'  // 👈 NUEVO IMPORT

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

export default function EditLeadPage() {
  const router = useRouter()
  const params = useParams()
  const { user, profile, profileLoading } = useAuth()
  const supabase = createClient()
  
  console.log('🔍 [EditLeadPage] Render - profile:', profile, 'profileLoading:', profileLoading)
  
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const userRole = profile?.role || 'viewer'
  const permissions = ROLE_PERMISSIONS[userRole]
  
  console.log('🔍 [Permisos] userRole:', userRole, 'permissions:', permissions, 'canEdit:', permissions?.canEdit)

  // 🔧 TEMPORAL: Verificación de permisos con redirect DESACTIVADO
  useEffect(() => {
    console.log('🔍 [useEffect permisos] DEBUG MODE')
    console.log('  profile:', profile)
    console.log('  profile?.role:', profile?.role)
    console.log('  permissions.canEdit:', permissions.canEdit)
    
    if (profile?.role) {
      if (!permissions.canEdit) {
        console.log('❌ Sin permisos (canEdit=false)')
        console.log('⚠️ Redirect a /unauthorized DESACTIVADO para debugging')
      } else {
        console.log('✅ Permisos OK, puede editar')
      }
    }
  }, [profile, permissions.canEdit, router])

  useEffect(() => {
    async function fetchLead() {
      console.log('🔍 [fetchLead] params.id:', params.id)
      if (!user || !params.id) return

      try {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .eq('id', params.id)
          .single()

        if (error) throw error

        console.log('✅ Lead cargado:', data)
        setLead(data)
      } catch (err: any) {
        console.error('❌ Error fetching lead:', err)
        setError('No se pudo cargar el lead')
      }

      setLoading(false)
    }

    fetchLead()
  }, [user, params.id, supabase])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!lead) return
    setLead({
      ...lead,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lead) return

    setSaving(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('leads')
        .update({
          nombre: lead.nombre,
          email: lead.email,
          telefono: lead.telefono,
          empresa: lead.empresa,
          estado: lead.estado,
          whatsapp: lead.whatsapp,
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.id)

      if (error) throw error

      router.push('/crm?updated=true')
    } catch (err: any) {
      console.error('❌ Error updating lead:', err)
      setError('No se pudo guardar los cambios')
    }

    setSaving(false)
  }

  const handleCancel = () => {
    router.push('/crm')
  }

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error && !lead) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => router.push('/crm')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (!lead) return null

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <button
          onClick={handleCancel}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Dashboard
        </button>
        
        <h1 className="text-3xl font-bold text-gray-800">Editar Lead</h1>
        <p className="text-gray-600 mt-2">Modifica la información del lead</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre Completo *
            </label>
            <input
              type="text"
              name="nombre"
              value={lead.nombre}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={lead.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono *
            </label>
            <input
              type="text"
              name="telefono"
              value={lead.telefono}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              WhatsApp
            </label>
            <input
              type="text"
              name="whatsapp"
              value={lead.whatsapp || ''}
              onChange={handleChange}
              placeholder="+52 1 555 555 5555"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {/* 👇 NUEVO: Botón de WhatsApp para contactar al lead */}
            {lead.whatsapp && (
              <div className="mt-3">
                <WhatsAppButton
                  phoneNumber={lead.whatsapp}
                  leadName={lead.nombre}
                  message={`Hola ${lead.nombre}, te contacto desde PrestaLista Pro respecto a tu solicitud de préstamo`}
                  variant="primary"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Click para abrir WhatsApp con mensaje prellenado
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Empresa *
            </label>
            <input
              type="text"
              name="empresa"
              value={lead.empresa}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado *
            </label>
            <select
              name="estado"
              value={lead.estado}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="nuevo">Nuevo</option>
              <option value="contactado">Contactado</option>
              <option value="calificado">Calificado</option>
              <option value="perdido">Perdido</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-8 pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
          
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}


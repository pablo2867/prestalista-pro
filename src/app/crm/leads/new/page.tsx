'use client'

import { useState, type FormEvent, type ChangeEvent } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MessageCircle } from 'lucide-react'

export default function NewLeadPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    whatsapp: '',
    empresa: '',
    estado: 'nuevo'
  })

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase
      .from('leads')
      .insert([{
        ...formData,
        creado_en: new Date().toISOString()
      }])

    if (!error) {
      router.push('/crm')
    } else {
      alert('Error al crear lead: ' + error.message)
    }
    setLoading(false)
  }

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => router.push('/crm')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver al CRM
          </button>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Nuevo Lead
          </h1>
          <p className="text-gray-600">Agrega un nuevo lead al sistema</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-8">
          <div className="space-y-6">
            {/* Nombre */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Nombre Completo *
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                placeholder="Ej: Juan Pérez"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Correo Electrónico *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="juan@empresa.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Teléfono *
              </label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                required
                placeholder="5551234567"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                <MessageCircle className="w-4 h-4 inline mr-1" />
                WhatsApp (opcional)
              </label>
              <input
                type="tel"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleChange}
                placeholder="+52 9934023786"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-gray-500 text-xs mt-1">
                Número con código de país (ej: +52 para México)
              </p>
            </div>

            {/* Empresa */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Empresa *
              </label>
              <input
                type="text"
                name="empresa"
                value={formData.empresa}
                onChange={handleChange}
                required
                placeholder="Nombre de la empresa"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Estado */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Estado *
              </label>
              <select
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="nuevo">Nuevo</option>
                <option value="contactado">Contactado</option>
                <option value="calificado">Calificado</option>
                <option value="perdido">Perdido</option>
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 mt-8">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-lg disabled:bg-gray-400"
            >
              {loading ? 'Guardando...' : 'Guardar Lead'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/crm')}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-8 py-3 rounded-lg font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
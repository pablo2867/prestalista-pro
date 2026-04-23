'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { Settings, Building, Palette, Bell, Shield, Save, Upload, Trash2 } from 'lucide-react'

export default function ConfiguracionPage() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombreEmpresa: 'PrestaLista Pro',
    rfc: 'PRE850101ABC',
    direccion: 'Av. Principal 123, CDMX',
    telefono: '5512345678',
    email: 'contacto@prestalista.com',
    logo: '',
    colores: {
      primario: '#3b82f6',
      secundario: '#8b5cf6'
    }
  })

  const handleSave = async () => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    alert('✅ Configuración guardada exitosamente')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Sidebar />
      <main className="lg:ml-64 p-6 md:p-8">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
          <div>
            <h1 className="text-2xl font-bold text-white">Configuración</h1>
            <p className="text-gray-400 text-sm">Personaliza tu CRM y marca</p>
          </div>
        </div>

        {/* Información de la Empresa */}
        <div className="bg-[#1a1a25] rounded-2xl p-6 border border-[#2a2a35] mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-900/30 rounded-xl flex items-center justify-center">
              <Building className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Información de la Empresa</h2>
              <p className="text-sm text-gray-400">Datos fiscales y de contacto</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Nombre de la Empresa *</label>
              <input
                type="text"
                value={formData.nombreEmpresa}
                onChange={(e) => setFormData({...formData, nombreEmpresa: e.target.value})}
                className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#2a2a35] rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">RFC *</label>
              <input
                type="text"
                value={formData.rfc}
                onChange={(e) => setFormData({...formData, rfc: e.target.value})}
                className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#2a2a35] rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-2">Dirección *</label>
              <input
                type="text"
                value={formData.direccion}
                onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#2a2a35] rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Teléfono *</label>
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#2a2a35] rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#2a2a35] rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Marca y Colores */}
        <div className="bg-[#1a1a25] rounded-2xl p-6 border border-[#2a2a35] mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-900/30 rounded-xl flex items-center justify-center">
              <Palette className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Marca y Colores</h2>
              <p className="text-sm text-gray-400">Personaliza los colores de tu CRM</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Color Primario</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.colores.primario}
                  onChange={(e) => setFormData({...formData, colores: {...formData.colores, primario: e.target.value}})}
                  className="w-12 h-12 rounded-lg cursor-pointer border border-[#2a2a35]"
                />
                <input
                  type="text"
                  value={formData.colores.primario}
                  onChange={(e) => setFormData({...formData, colores: {...formData.colores, primario: e.target.value}})}
                  className="flex-1 px-4 py-3 bg-[#0a0a0f] border border-[#2a2a35] rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Color Secundario</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.colores.secundario}
                  onChange={(e) => setFormData({...formData, colores: {...formData.colores, secundario: e.target.value}})}
                  className="w-12 h-12 rounded-lg cursor-pointer border border-[#2a2a35]"
                />
                <input
                  type="text"
                  value={formData.colores.secundario}
                  onChange={(e) => setFormData({...formData, colores: {...formData.colores, secundario: e.target.value}})}
                  className="flex-1 px-4 py-3 bg-[#0a0a0f] border border-[#2a2a35] rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Logo */}
        <div className="bg-[#1a1a25] rounded-2xl p-6 border border-[#2a2a35] mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-900/30 rounded-xl flex items-center justify-center">
              <Upload className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Logo de la Empresa</h2>
              <p className="text-sm text-gray-400">Sube el logo que aparecerá en documentos</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {formData.logo ? (
              <div className="relative">
                <img src={formData.logo} alt="Logo" className="w-32 h-32 object-contain bg-[#0a0a0f] rounded-xl border border-[#2a2a35]" />
                <button
                  onClick={() => setFormData({...formData, logo: ''})}
                  className="absolute -top-2 -right-2 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="w-32 h-32 bg-[#0a0a0f] border-2 border-dashed border-[#2a2a35] rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-600/50 transition">
                <Upload className="w-8 h-8 text-gray-500 mb-2" />
                <p className="text-xs text-gray-400 text-center">Click para subir logo</p>
              </div>
            )}
            <div className="text-sm text-gray-400">
              <p className="mb-1">Formatos: PNG, JPG, SVG</p>
              <p>Máximo: 2MB</p>
              <p>Recomendado: 200x200px</p>
            </div>
          </div>
        </div>

        {/* Notificaciones */}
        <div className="bg-[#1a1a25] rounded-2xl p-6 border border-[#2a2a35] mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-amber-900/30 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Notificaciones</h2>
              <p className="text-sm text-gray-400">Configura las alertas del sistema</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Notificar nuevos leads', desc: 'Recibe alertas cuando haya nuevos leads' },
              { label: 'Notificar pagos recibidos', desc: 'Alertas cuando se registre un pago' },
              { label: 'Notificar préstamos vencidos', desc: 'Alertas de préstamos por vencer' },
              { label: 'Email semanal de resumen', desc: 'Reporte semanal de actividad' }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-[#0a0a0f] rounded-xl border border-[#2a2a35]">
                <div>
                  <p className="text-white font-medium">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked={index < 2} className="sr-only peer" />
                  <div className="w-11 h-6 bg-[#2a2a35] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Botón Guardar */}
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {loading ? 'Guardando...' : 'Guardar Configuración'}
        </button>

      </main>
    </div>
  )
}
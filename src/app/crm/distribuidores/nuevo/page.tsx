'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { ArrowLeft, Mail, Phone, DollarSign, Percent, Save, X } from 'lucide-react'

export default function NuevoDistribuidorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    comision: '',
    capitalInicial: ''
  })

  // ✅ Función que faltaba: maneja los cambios en los inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    console.log('📦 Datos a enviar:', formData) // 👈 Para depurar
    await new Promise(resolve => setTimeout(resolve, 1000))
    alert('✅ Distribuidor creado exitosamente')
    router.push('/crm/distribuidores')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Sidebar />
      <main className="lg:ml-64 p-6 md:p-8">
        {/* ... (el header con título y botón de regresar se queda igual) ... */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="p-2 hover:bg-[#1a1a25] rounded-lg transition">
            <ArrowLeft className="w-6 h-6 text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Nuevo Distribuidor</h1>
            <p className="text-gray-400 text-sm">Registra un nuevo agente al equipo</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-2xl bg-[#1a1a25] rounded-2xl p-6 border border-[#2a2a35]">
          <div className="space-y-4">
            {/* NOMBRE */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Nombre Completo *</label>
              <input 
                type="text" 
                name="nombre"  // ✅ Agregado
                value={formData.nombre}  // ✅ Agregado
                onChange={handleChange}  // ✅ Agregado
                required 
                className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#2a2a35] rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="Carlos Mendoza López" 
              />
            </div>

            {/* EMAIL */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Email *</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input 
                  type="email" 
                  name="email"  // ✅ Agregado
                  value={formData.email}  // ✅ Agregado
                  onChange={handleChange}  // ✅ Agregado
                  required 
                  className="w-full pl-12 pr-4 py-3 bg-[#0a0a0f] border border-[#2a2a35] rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="carlos@email.com" 
                />
              </div>
            </div>

            {/* TELÉFONO */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Teléfono *</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input 
                  type="tel" 
                  name="telefono"  // ✅ Agregado
                  value={formData.telefono}  // ✅ Agregado
                  onChange={handleChange}  // ✅ Agregado
                  required 
                  className="w-full pl-12 pr-4 py-3 bg-[#0a0a0f] border border-[#2a2a35] rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="5512345678" 
                />
              </div>
            </div>

            {/* COMISIÓN Y CAPITAL */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Comisión Inicial (%) *</label>
                <div className="relative">
                  <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input 
                    type="number" 
                    name="comision"  // ✅ Agregado
                    value={formData.comision}  // ✅ Agregado
                    onChange={handleChange}  // ✅ Agregado
                    required 
                    className="w-full pl-12 pr-4 py-3 bg-[#0a0a0f] border border-[#2a2a35] rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="10" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Capital Inicial *</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input 
                    type="number" 
                    name="capitalInicial"  // ✅ Agregado
                    value={formData.capitalInicial}  // ✅ Agregado
                    onChange={handleChange}  // ✅ Agregado
                    required 
                    className="w-full pl-12 pr-4 py-3 bg-[#0a0a0f] border border-[#2a2a35] rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="50000" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Botones (se quedan igual) */}
          <div className="flex gap-4 mt-6">
            <button type="button" onClick={() => router.back()} className="flex-1 px-6 py-3 bg-[#0a0a0f] text-white rounded-xl hover:bg-[#1a25] transition flex items-center justify-center gap-2 border border-[#2a2a35]">
              <X className="w-5 h-5" /> Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition flex items-center justify-center gap-2 disabled:opacity-50">
              <Save className="w-5 h-5" /> {loading ? 'Guardando...' : 'Guardar Distribuidor'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { ArrowLeft, User, Mail, Phone, Save, X } from 'lucide-react'

export default function NuevoPrestatarioPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    montoSolicitado: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    alert('✅ Prestatario creado exitosamente')
    router.push('/dashboard')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Sidebar />
      <main className="lg:ml-64 p-6 md:p-8">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="p-2 hover:bg-[#1a1a25] rounded-lg transition">
            <ArrowLeft className="w-6 h-6 text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Nuevo Prestatario</h1>
            <p className="text-gray-400 text-sm">Registra un nuevo cliente</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-2xl bg-[#1a1a25] rounded-2xl p-6 border border-[#2a2a35]">
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Nombre Completo *</label>
              <input type="text" required className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#2a2a35] rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Juan Pérez" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Email</label>
              <input type="email" className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#2a2a35] rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="juan@email.com" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Teléfono *</label>
              <input type="tel" required className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#2a2a35] rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="5512345678" />
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button type="button" onClick={() => router.back()} className="flex-1 px-6 py-3 bg-[#0a0a0f] text-white rounded-xl hover:bg-[#1a1a25] transition flex items-center justify-center gap-2 border border-[#2a2a35]">
              <X className="w-5 h-5" /> Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition flex items-center justify-center gap-2 disabled:opacity-50">
              <Save className="w-5 h-5" /> {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
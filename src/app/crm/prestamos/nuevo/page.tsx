'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { ArrowLeft, DollarSign, Percent, Calendar, Save, X } from 'lucide-react'

export default function NuevoPrestamoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    prestatario: '',
    monto: '',
    tasa: '',
    plazo: '',
    frecuencia: 'mensual'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    alert('✅ Préstamo creado exitosamente')
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
            <h1 className="text-2xl font-bold text-white">Nuevo Préstamo</h1>
            <p className="text-gray-400 text-sm">Registra un nuevo préstamo</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-2xl bg-[#1a1a25] rounded-2xl p-6 border border-[#2a2a35]">
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Prestatario *</label>
              <select required className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#2a2a35] rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">Seleccionar prestatario</option>
                <option value="1">Juan Pérez</option>
                <option value="2">María López</option>
                <option value="3">Carlos Ruiz</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Monto *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input type="number" required className="w-full pl-12 pr-4 py-3 bg-[#0a0a0f] border border-[#2a2a35] rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="50000" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Tasa de Interés (%) *</label>
                <div className="relative">
                  <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input type="number" required className="w-full pl-12 pr-4 py-3 bg-[#0a0a0f] border border-[#2a2a35] rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="5.0" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Plazo (meses) *</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input type="number" required className="w-full pl-12 pr-4 py-3 bg-[#0a0a0f] border border-[#2a2a35] rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="12" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Frecuencia de Pago *</label>
              <select className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#2a2a35] rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="semanal">Semanal</option>
                <option value="quincenal">Quincenal</option>
                <option value="mensual">Mensual</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button type="button" onClick={() => router.back()} className="flex-1 px-6 py-3 bg-[#0a0a0f] text-white rounded-xl hover:bg-[#1a1a25] transition flex items-center justify-center gap-2 border border-[#2a2a35]">
              <X className="w-5 h-5" /> Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition flex items-center justify-center gap-2 disabled:opacity-50">
              <Save className="w-5 h-5" /> {loading ? 'Guardando...' : 'Guardar Préstamo'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
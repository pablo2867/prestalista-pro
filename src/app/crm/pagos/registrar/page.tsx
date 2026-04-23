'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { ArrowLeft, DollarSign, CreditCard, Calendar, Save, X } from 'lucide-react'

export default function RegistrarPagoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    prestamo: '',
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    metodo: 'efectivo',
    referencia: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    alert('✅ Pago registrado exitosamente')
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
            <h1 className="text-2xl font-bold text-white">Registrar Pago</h1>
            <p className="text-gray-400 text-sm">Registra un nuevo pago recibido</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-2xl bg-[#1a1a25] rounded-2xl p-6 border border-[#2a2a35]">
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Préstamo *</label>
              <select required className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#2a2a35] rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">Seleccionar préstamo</option>
                <option value="1">Juan Pérez - $50,000</option>
                <option value="2">María López - $30,000</option>
                <option value="3">Carlos Ruiz - $20,000</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Monto *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input type="number" required className="w-full pl-12 pr-4 py-3 bg-[#0a0a0f] border border-[#2a2a35] rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="5000" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Fecha de Pago *</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input 
                  type="date" 
                  required 
                  value={formData.fecha}
                  onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 bg-[#0a0a0f] border border-[#2a2a35] rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Método de Pago *</label>
              <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <select 
                  required 
                  value={formData.metodo}
                  onChange={(e) => setFormData({...formData, metodo: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 bg-[#0a0a0f] border border-[#2a2a35] rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="deposito">Depósito Bancario</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Referencia / Nota</label>
              <textarea 
                rows={3}
                className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#2a2a35] rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none resize-none" 
                placeholder="Número de transferencia, comprobante, etc."
              />
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button type="button" onClick={() => router.back()} className="flex-1 px-6 py-3 bg-[#0a0a0f] text-white rounded-xl hover:bg-[#1a1a25] transition flex items-center justify-center gap-2 border border-[#2a2a35]">
              <X className="w-5 h-5" /> Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition flex items-center justify-center gap-2 disabled:opacity-50">
              <Save className="w-5 h-5" /> {loading ? 'Guardando...' : 'Registrar Pago'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
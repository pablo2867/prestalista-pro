'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, AlertTriangle, CheckCircle, XCircle, ShieldOff } from 'lucide-react'

interface ClienteMorosidad {
  id: string
  nombre: string
  email: string
  telefono: string
  montoAdeudado: number
  recargoPendiente: number
  diasAtraso: number
  estado: 'corriente' | 'riesgo' | 'moroso' | 'bloqueado'
}

interface ResumenMorosidad {
  totalClientes: number
  alCorriente: number
  enRiesgo: number
  morosos: number
  bloqueados: number
  totalAdeudado: number
  totalRecargos: number
  porcentajeMorosidad: number
}

export default function MorosidadPage() {
  const router = useRouter()
  const { user, profileLoading } = useAuth()
  const supabase = createClient()
  
  const [clientes, setClientes] = useState<ClienteMorosidad[]>([])
  const [resumen, setResumen] = useState<ResumenMorosidad>({
    totalClientes: 0, alCorriente: 0, enRiesgo: 0, morosos: 0, bloqueados: 0,
    totalAdeudado: 0, totalRecargos: 0, porcentajeMorosidad: 0
  })
  const [loading, setLoading] = useState(true)

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(amount)
  }

  useEffect(() => {
    async function cargarMorosidad() {
      if (!user) return
      try {
        const clientesData: ClienteMorosidad[] = [
          { id: '1', nombre: 'Pedro Sánchez', email: 'pedro@email.com', telefono: '9931234567', montoAdeudado: 3000, recargoPendiente: 255, diasAtraso: 45, estado: 'bloqueado' },
          { id: '2', nombre: 'María López', email: 'maria@email.com', telefono: '9937654321', montoAdeudado: 8500, recargoPendiente: 867, diasAtraso: 60, estado: 'bloqueado' },
          { id: '3', nombre: 'Carlos Ruiz', email: 'carlos@email.com', telefono: '9931112222', montoAdeudado: 5000, recargoPendiente: 145, diasAtraso: 20, estado: 'moroso' },
          { id: '4', nombre: 'Ana González', email: 'ana@email.com', telefono: '9933334444', montoAdeudado: 2000, recargoPendiente: 24, diasAtraso: 10, estado: 'riesgo' },
          { id: '5', nombre: 'Juan Pérez', email: 'juan@email.com', telefono: '9935556666', montoAdeudado: 0, recargoPendiente: 0, diasAtraso: 0, estado: 'corriente' }
        ]
        setClientes(clientesData)
        
        const totalClientes = clientesData.length
        const alCorriente = clientesData.filter(c => c.estado === 'corriente').length
        const enRiesgo = clientesData.filter(c => c.estado === 'riesgo').length
        const morosos = clientesData.filter(c => c.estado === 'moroso').length
        const bloqueados = clientesData.filter(c => c.estado === 'bloqueado').length
        const totalAdeudado = clientesData.reduce((sum, c) => sum + c.montoAdeudado, 0)
        const totalRecargos = clientesData.reduce((sum, c) => sum + c.recargoPendiente, 0)
        const porcentajeMorosidad = totalClientes > 0 ? ((morosos + bloqueados) / totalClientes) * 100 : 0

        setResumen({ totalClientes, alCorriente, enRiesgo, morosos, bloqueados, totalAdeudado, totalRecargos, porcentajeMorosidad })
      } catch (err) {
        console.error('❌ Error:', err)
      } finally {
        setLoading(false)
      }
    }
    cargarMorosidad()
  }, [user, supabase])

  const EstadoBadge = ({ estado }: { estado: string }) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      corriente: { bg: 'bg-green-100', text: 'text-green-700', label: '🟢 Al Corriente' },
      riesgo: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '🟡 En Riesgo' },
      moroso: { bg: 'bg-red-100', text: 'text-red-700', label: '🔴 Moroso' },
      bloqueado: { bg: 'bg-gray-100', text: 'text-gray-700', label: '⚫ Bloqueado' }
    }
    const c = config[estado] || config.corriente
    return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>{c.label}</span>
  }

  if (loading || profileLoading) {
    return <div className="p-8"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div></div>
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📊 Reporte de Morosidad</h1>
          <p className="text-gray-600">Clientes con pagos pendientes y recargos</p>
        </div>
      </div>

      {/* Resumen */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 mb-6 text-white">
        <h2 className="text-lg font-bold mb-4">Resumen Ejecutivo</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/20 rounded-lg p-3"><p className="text-xs opacity-80">Total Clientes</p><p className="text-lg font-bold">{resumen.totalClientes}</p></div>
          <div className="bg-white/20 rounded-lg p-3"><p className="text-xs opacity-80">Morosos + Bloqueados</p><p className="text-lg font-bold">{resumen.morosos + resumen.bloqueados}</p></div>
          <div className="bg-white/20 rounded-lg p-3"><p className="text-xs opacity-80">Adeudado</p><p className="text-lg font-bold">{formatMoney(resumen.totalAdeudado)}</p></div>
          <div className="bg-white/20 rounded-lg p-3"><p className="text-xs opacity-80">Recargos</p><p className="text-lg font-bold">{formatMoney(resumen.totalRecargos)}</p></div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Adeuda</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Recargos</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Días</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {clientes.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4"><p className="font-medium">{c.nombre}</p><p className="text-xs text-gray-400">{c.email}</p></td>
                  <td className="px-4 py-4 font-bold text-red-600">{formatMoney(c.montoAdeudado)}</td>
                  <td className="px-4 py-4 text-orange-600">{c.recargoPendiente > 0 ? formatMoney(c.recargoPendiente) : '—'}</td>
                  <td className="px-4 py-4">{c.diasAtraso} días</td>
                  <td className="px-4 py-4"><EstadoBadge estado={c.estado} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
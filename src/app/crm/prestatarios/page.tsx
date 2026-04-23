'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTenant } from '@/context/TenantContext'
import Sidebar from '@/components/Sidebar'
import { Users, Plus, Search, Phone, Mail, Star, Filter, DollarSign, TrendingUp } from 'lucide-react'

export default function PrestatariosPage() {
  const router = useRouter()
  const { tenant } = useTenant()
  
  const [prestatarios, setPrestatarios] = useState<any[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [filtroRiesgo, setFiltroRiesgo] = useState<'todos' | 'bajo' | 'medio' | 'alto'>('todos')
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'activo' | 'observacion' | 'bloqueado'>('todos')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setTimeout(() => {
      setPrestatarios([
        { id: '1', nombre: 'Juan Pérez', email: 'juan@email.com', telefono: '5512345678', estado: 'activo', score: 75, riesgo: 'bajo', desde: '2026', prestamosActivos: 2, montoTotal: 100000 },
        { id: '2', nombre: 'María López', email: 'maria@email.com', telefono: '5587654321', estado: 'observacion', score: 50, riesgo: 'medio', desde: '2026', prestamosActivos: 1, montoTotal: 50000 },
        { id: '3', nombre: 'Carlos Ruiz', email: 'carlos@email.com', telefono: '5511223344', estado: 'bloqueado', score: 30, riesgo: 'alto', desde: '2026', prestamosActivos: 0, montoTotal: 0 },
        { id: '4', nombre: 'Ana García', email: 'ana@email.com', telefono: '5599887766', estado: 'activo', score: 85, riesgo: 'bajo', desde: '2025', prestamosActivos: 3, montoTotal: 150000 },
        { id: '5', nombre: 'Roberto Díaz', email: 'roberto@email.com', telefono: '5544332211', estado: 'activo', score: 60, riesgo: 'medio', desde: '2026', prestamosActivos: 1, montoTotal: 30000 }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const prestatariosFiltrados = prestatarios.filter((p) => {
    if (busqueda && !p.nombre.toLowerCase().includes(busqueda.toLowerCase())) return false
    if (filtroRiesgo !== 'todos' && p.riesgo !== filtroRiesgo) return false
    if (filtroEstado !== 'todos' && p.estado !== filtroEstado) return false
    return true
  })

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'activo': return { bg: 'bg-green-900/30', text: 'text-green-400', border: 'border-green-700/50', label: 'Al Día' }
      case 'observacion': return { bg: 'bg-amber-900/30', text: 'text-amber-400', border: 'border-amber-700/50', label: 'Observación' }
      case 'bloqueado': return { bg: 'bg-red-900/30', text: 'text-red-400', border: 'border-red-700/50', label: 'Bloqueado' }
      default: return { bg: 'bg-gray-900/30', text: 'text-gray-400', border: 'border-gray-700/50', label: estado }
    }
  }

  const getRiesgoBadge = (riesgo: string) => {
    switch (riesgo) {
      case 'bajo': return { bg: 'bg-green-900/30', text: 'text-green-400', label: 'BAJO' }
      case 'medio': return { bg: 'bg-amber-900/30', text: 'text-amber-400', label: 'MEDIO' }
      case 'alto': return { bg: 'bg-red-900/30', text: 'text-red-400', label: 'ALTO' }
      default: return { bg: 'bg-gray-900/30', text: 'text-gray-400', label: riesgo }
    }
  }

  const getRatingStars = (score: number) => {
    const stars = Math.floor(score / 20)
    return Array(5).fill(0).map((_, i) => (
      <Star key={i} className={`w-3 h-3 ${i < stars ? 'text-amber-400 fill-amber-400' : 'text-gray-600'}`} />
    ))
  }

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando prestatarios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Sidebar />
      <main className="lg:ml-64 p-6 md:p-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Directorio de Prestatarios</h1>
              <p className="text-gray-400 text-sm">Gestiona la información y calificación crediticia de tus clientes</p>
            </div>
          </div>
          <button onClick={() => router.push('/crm/prestatarios/nuevo')} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition flex items-center gap-2 font-medium shadow-lg shadow-blue-900/20">
            <Plus className="w-4 h-4" />
            Añadir Prestatario
          </button>
        </div>

        {/* Stats Rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1a1a25] rounded-xl p-4 border border-[#2a2a35]">
            <p className="text-gray-400 text-xs">Total Prestatarios</p>
            <p className="text-2xl font-bold text-white">{prestatarios.length}</p>
          </div>
          <div className="bg-[#1a1a25] rounded-xl p-4 border border-[#2a2a35]">
            <p className="text-gray-400 text-xs">Activos</p>
            <p className="text-2xl font-bold text-green-400">{prestatarios.filter(p => p.estado === 'activo').length}</p>
          </div>
          <div className="bg-[#1a1a25] rounded-xl p-4 border border-[#2a2a35]">
            <p className="text-gray-400 text-xs">En Observación</p>
            <p className="text-2xl font-bold text-amber-400">{prestatarios.filter(p => p.estado === 'observacion').length}</p>
          </div>
          <div className="bg-[#1a1a25] rounded-xl p-4 border border-[#2a2a35]">
            <p className="text-gray-400 text-xs">Bloqueados</p>
            <p className="text-2xl font-bold text-red-400">{prestatarios.filter(p => p.estado === 'bloqueado').length}</p>
          </div>
        </div>

        {/* Buscador y Filtros */}
        <div className="bg-[#1a1a25] rounded-2xl p-6 border border-[#2a2a35] mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre..."
                className="w-full pl-12 pr-4 py-3 bg-[#0a0a0f] border border-[#2a2a35] rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {['todos', 'bajo', 'medio', 'alto'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFiltroRiesgo(f as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    filtroRiesgo === f
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'bg-[#0a0a0f] text-gray-400 hover:text-white border border-[#2a2a35]'
                  }`}
                >
                  {f === 'todos' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {['todos', 'activo', 'observacion', 'bloqueado'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFiltroEstado(f as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    filtroEstado === f
                      ? f === 'activo' ? 'bg-green-600 text-white' : f === 'observacion' ? 'bg-amber-600 text-white' : f === 'bloqueado' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                      : 'bg-[#0a0a0f] text-gray-400 hover:text-white border border-[#2a2a35]'
                  }`}
                >
                  {f === 'todos' ? 'Todos' : f === 'activo' ? 'Activo' : f === 'observacion' ? 'Observación' : 'Bloqueado'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lista de Prestatarios */}
        <div className="bg-[#1a1a25] rounded-2xl p-6 border border-[#2a2a35]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">Prestatarios Registrados</h2>
            <span className="text-sm text-gray-400 bg-[#0a0a0f] px-3 py-1 rounded-full">
              {prestatariosFiltrados.length} resultados
            </span>
          </div>

          {prestatariosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">No hay prestatarios que coincidan</p>
              <p className="text-gray-500 text-sm">Intenta con otros filtros o añade un nuevo prestatario</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {prestatariosFiltrados.map((p) => {
                const estadoBadge = getEstadoBadge(p.estado)
                const riesgoBadge = getRiesgoBadge(p.riesgo)
                return (
                  <div key={p.id} className="bg-[#0a0a0f] rounded-xl p-5 border border-[#2a2a35] hover:border-blue-600/50 transition cursor-pointer">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {p.nombre[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{p.nombre}</p>
                          <p className="text-xs text-gray-500">Desde {p.desde}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full border ${estadoBadge.bg} ${estadoBadge.text} ${estadoBadge.border}`}>
                        {estadoBadge.label}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Phone className="w-4 h-4" />
                        <span>{p.telefono}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{p.email}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-[#1a1a25] rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Préstamos</p>
                        <p className="text-lg font-bold text-white">{p.prestamosActivos}</p>
                      </div>
                      <div className="bg-[#1a1a25] rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Monto Total</p>
                        <p className="text-sm font-bold text-green-400">{formatMoney(p.montoTotal)}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[#2a2a35]">
                      <div className="flex items-center gap-2">
                        <div className="flex">{getRatingStars(p.score)}</div>
                        <span className="text-xs text-gray-500">{p.score}/100</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${riesgoBadge.bg} ${riesgoBadge.text}`}>
                        {riesgoBadge.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
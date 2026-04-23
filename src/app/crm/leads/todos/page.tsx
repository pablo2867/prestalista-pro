'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Sidebar from '@/components/Sidebar'
import { Users, Plus, Search, Phone, Mail, Star, Filter, Download, Eye } from 'lucide-react'

export default function TodosLeadsPage() {
  const router = useRouter()
  const { profile } = useAuth()
  
  const [leads, setLeads] = useState<any[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'nuevo' | 'contactado' | 'aprobado' | 'rechazado'>('todos')
  const [filtroRiesgo, setFiltroRiesgo] = useState<'todos' | 'bajo' | 'medio' | 'alto'>('todos')
  const [fotoModal, setFotoModal] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setTimeout(() => {
      setLeads([
        { id: '1', nombre: 'Juan Pérez', email: 'juan@email.com', telefono: '5512345678', estado: 'nuevo', riesgo: 'medio', score: 50, rating: 3, foto: 'https://via.placeholder.com/150', asignado_a: 'admin', creado: '2026-04-01' },
        { id: '2', nombre: 'María López', email: 'maria@email.com', telefono: '5587654321', estado: 'contactado', riesgo: 'bajo', score: 75, rating: 4, foto: 'https://via.placeholder.com/150', asignado_a: 'agent1', creado: '2026-04-02' },
        { id: '3', nombre: 'Carlos Ruiz', email: 'carlos@email.com', telefono: '5511223344', estado: 'aprobado', riesgo: 'alto', score: 30, rating: 2, foto: 'https://via.placeholder.com/150', asignado_a: 'admin', creado: '2026-04-03' },
        { id: '4', nombre: 'Ana García', email: 'ana@email.com', telefono: '5599887766', estado: 'rechazado', riesgo: 'medio', score: 45, rating: 3, foto: 'https://via.placeholder.com/150', asignado_a: 'agent2', creado: '2026-04-04' },
        { id: '5', nombre: 'Roberto Díaz', email: 'roberto@email.com', telefono: '5544332211', estado: 'nuevo', riesgo: 'bajo', score: 80, rating: 5, foto: 'https://via.placeholder.com/150', asignado_a: null, creado: '2026-04-05' }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const leadsFiltrados = leads.filter((lead) => {
    if (busqueda && !lead.nombre.toLowerCase().includes(busqueda.toLowerCase())) return false
    if (filtroEstado !== 'todos' && lead.estado !== filtroEstado) return false
    if (filtroRiesgo !== 'todos' && lead.riesgo !== filtroRiesgo) return false
    return true
  })

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'nuevo': return { bg: 'bg-blue-900/30', text: 'text-blue-400', border: 'border-blue-700/50', label: 'NUEVO' }
      case 'contactado': return { bg: 'bg-purple-900/30', text: 'text-purple-400', border: 'border-purple-700/50', label: 'CONTACTADO' }
      case 'aprobado': return { bg: 'bg-green-900/30', text: 'text-green-400', border: 'border-green-700/50', label: 'APROBADO' }
      case 'rechazado': return { bg: 'bg-red-900/30', text: 'text-red-400', border: 'border-red-700/50', label: 'RECHAZADO' }
      default: return { bg: 'bg-gray-900/30', text: 'text-gray-400', border: 'border-gray-700/50', label: estado.toUpperCase() }
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

  const getRatingStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <Star key={i} className={`w-3 h-3 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-600'}`} />
    ))
  }

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const downloadImage = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error descargando imagen:', err)
      alert('Error al descargar la imagen')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando leads...</p>
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
              <h1 className="text-2xl md:text-3xl font-bold text-white">Todos los Leads</h1>
              <p className="text-gray-400 text-sm">Vista completa de todos los leads del sistema</p>
            </div>
          </div>
          <button onClick={() => router.push('/crm/leads/nuevo')} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition flex items-center gap-2 font-medium shadow-lg shadow-blue-900/20">
            <Plus className="w-4 h-4" />
            Nuevo Lead
          </button>
        </div>

        {/* Stats Rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1a1a25] rounded-xl p-4 border border-[#2a2a35]">
            <p className="text-gray-400 text-xs">Total Leads</p>
            <p className="text-2xl font-bold text-white">{leads.length}</p>
          </div>
          <div className="bg-[#1a1a25] rounded-xl p-4 border border-[#2a2a35]">
            <p className="text-gray-400 text-xs">Nuevos</p>
            <p className="text-2xl font-bold text-blue-400">{leads.filter(l => l.estado === 'nuevo').length}</p>
          </div>
          <div className="bg-[#1a1a25] rounded-xl p-4 border border-[#2a2a35]">
            <p className="text-gray-400 text-xs">Aprobados</p>
            <p className="text-2xl font-bold text-green-400">{leads.filter(l => l.estado === 'aprobado').length}</p>
          </div>
          <div className="bg-[#1a1a25] rounded-xl p-4 border border-[#2a2a35]">
            <p className="text-gray-400 text-xs">Alto Riesgo</p>
            <p className="text-2xl font-bold text-red-400">{leads.filter(l => l.riesgo === 'alto').length}</p>
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
              {[
                { key: 'todos', label: 'Todos' },
                { key: 'nuevo', label: 'Nuevo' },
                { key: 'contactado', label: 'Contactado' },
                { key: 'aprobado', label: 'Aprobado' },
                { key: 'rechazado', label: 'Rechazado' }
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFiltroEstado(f.key as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    filtroEstado === f.key
                      ? f.key === 'nuevo' ? 'bg-blue-600 text-white' : f.key === 'contactado' ? 'bg-purple-600 text-white' : f.key === 'aprobado' ? 'bg-green-600 text-white' : f.key === 'rechazado' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                      : 'bg-[#0a0a0f] text-gray-400 hover:text-white border border-[#2a2a35]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'todos', label: 'Todos' },
                { key: 'bajo', label: 'Bajo' },
                { key: 'medio', label: 'Medio' },
                { key: 'alto', label: 'Alto' }
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFiltroRiesgo(f.key as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    filtroRiesgo === f.key
                      ? f.key === 'bajo' ? 'bg-green-600 text-white' : f.key === 'medio' ? 'bg-amber-600 text-white' : f.key === 'alto' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                      : 'bg-[#0a0a0f] text-gray-400 hover:text-white border border-[#2a2a35]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tabla de Leads */}
        <div className="bg-[#1a1a25] rounded-2xl p-6 border border-[#2a2a35]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">Leads del Sistema</h2>
            <span className="text-sm text-gray-400 bg-[#0a0a0f] px-3 py-1 rounded-full">
              {leadsFiltrados.length} resultados
            </span>
          </div>

          {leadsFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">No hay leads que coincidan</p>
              <p className="text-gray-500 text-sm">Intenta con otros filtros o crea un nuevo lead</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2a2a35]">
                    <th className="text-left text-xs text-gray-400 font-medium py-3 px-4">Prestatario</th>
                    <th className="text-left text-xs text-gray-400 font-medium py-3 px-4">Contacto</th>
                    <th className="text-left text-xs text-gray-400 font-medium py-3 px-4">Estado</th>
                    <th className="text-left text-xs text-gray-400 font-medium py-3 px-4">Riesgo</th>
                    <th className="text-left text-xs text-gray-400 font-medium py-3 px-4">Score</th>
                    <th className="text-left text-xs text-gray-400 font-medium py-3 px-4">Asignado</th>
                    <th className="text-left text-xs text-gray-400 font-medium py-3 px-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {leadsFiltrados.map((lead) => {
                    const estadoBadge = getEstadoBadge(lead.estado)
                    const riesgoBadge = getRiesgoBadge(lead.riesgo)
                    return (
                      <tr key={lead.id} className="border-b border-[#2a2a35] hover:bg-[#0a0a0f] transition">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:ring-2 hover:ring-blue-500 transition"
                              onClick={() => setFotoModal(lead.foto)}
                            >
                              {lead.nombre[0]}
                            </div>
                            <div>
                              <p className="text-white font-medium">{lead.nombre}</p>
                              <p className="text-xs text-gray-500">{formatFecha(lead.creado)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-400 space-y-1">
                            <div className="flex items-center gap-2"><Phone className="w-3 h-3" />{lead.telefono}</div>
                            <div className="flex items-center gap-2"><Mail className="w-3 h-3" />{lead.email}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`text-xs px-2 py-1 rounded-full border ${estadoBadge.bg} ${estadoBadge.text} ${estadoBadge.border}`}>
                            {estadoBadge.label}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${riesgoBadge.bg} ${riesgoBadge.text}`}>
                            {riesgoBadge.label}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className="flex">{getRatingStars(lead.rating)}</div>
                            <span className="text-xs text-gray-500">{lead.score}/100</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-white text-sm">
                          {lead.asignado_a ? '✅ Sí' : '❌ No'}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setFotoModal(lead.foto)}
                              className="p-2 text-blue-400 hover:bg-blue-900/30 rounded-lg transition"
                              title="Ver foto"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => downloadImage(lead.foto, `foto-${lead.nombre}.jpg`)}
                              className="p-2 text-green-400 hover:bg-green-900/30 rounded-lg transition"
                              title="Descargar foto"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal de Foto */}
        {fotoModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="relative max-w-3xl w-full">
              <button
                onClick={() => setFotoModal(null)}
                className="absolute -top-12 right-0 p-2 text-white hover:bg-white/10 rounded-lg transition"
              >
                <Users className="w-6 h-6" />
              </button>
              <div className="bg-[#1a1a25] rounded-2xl p-6 border border-[#2a2a35]">
                <img src={fotoModal} alt="Vista completa" className="w-full h-auto rounded-xl" />
                <div className="flex gap-4 mt-4">
                  <button
                    onClick={() => downloadImage(fotoModal, 'foto-completa.jpg')}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Descargar Foto
                  </button>
                  <button
                    onClick={() => setFotoModal(null)}
                    className="flex-1 px-4 py-3 bg-[#0a0a0f] text-white rounded-xl hover:bg-[#1a1a25] transition border border-[#2a2a35]"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
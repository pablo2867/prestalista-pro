'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { DollarSign, Plus, Search, Calendar, User, Download, X, Eye } from 'lucide-react'

export default function PagosPage() {
  const router = useRouter()
  
  const [pagos, setPagos] = useState<any[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [filtroMetodo, setFiltroMetodo] = useState<'todos' | 'efectivo' | 'transferencia' | 'tarjeta'>('todos')
  const [fotoModal, setFotoModal] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setTimeout(() => {
      setPagos([
        { id: '1', prestatario: 'Juan Pérez', foto: 'https://via.placeholder.com/150', monto: 5000, fecha: '2026-04-01', metodo: 'transferencia', prestamo: 'Préstamo #001', estado: 'completado' },
        { id: '2', prestatario: 'María López', foto: 'https://via.placeholder.com/150', monto: 3000, fecha: '2026-04-02', metodo: 'efectivo', prestamo: 'Préstamo #002', estado: 'completado' },
        { id: '3', prestatario: 'Ana García', foto: 'https://via.placeholder.com/150', monto: 8000, fecha: '2026-04-03', metodo: 'tarjeta', prestamo: 'Préstamo #004', estado: 'completado' },
        { id: '4', prestatario: 'Roberto Díaz', foto: 'https://via.placeholder.com/150', monto: 2500, fecha: '2026-04-05', metodo: 'transferencia', prestamo: 'Préstamo #005', estado: 'pendiente' },
        { id: '5', prestatario: 'Carlos Ruiz', foto: 'https://via.placeholder.com/150', monto: 1500, fecha: '2026-04-06', metodo: 'efectivo', prestamo: 'Préstamo #003', estado: 'completado' }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const pagosFiltrados = pagos.filter((p) => {
    if (busqueda && !p.prestatario.toLowerCase().includes(busqueda.toLowerCase())) return false
    if (filtroMetodo !== 'todos' && p.metodo !== filtroMetodo) return false
    return true
  })

  const getMetodoBadge = (metodo: string) => {
    switch (metodo) {
      case 'efectivo': return { bg: 'bg-green-900/30', text: 'text-green-400', label: 'EFECTIVO' }
      case 'transferencia': return { bg: 'bg-blue-900/30', text: 'text-blue-400', label: 'TRANSFERENCIA' }
      case 'tarjeta': return { bg: 'bg-purple-900/30', text: 'text-purple-400', label: 'TARJETA' }
      default: return { bg: 'bg-gray-900/30', text: 'text-gray-400', label: metodo.toUpperCase() }
    }
  }

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
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
          <p className="text-gray-400">Cargando pagos...</p>
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
              <h1 className="text-2xl md:text-3xl font-bold text-white">Pagos</h1>
              <p className="text-gray-400 text-sm">Historial de pagos recibidos</p>
            </div>
          </div>
          <button onClick={() => router.push('/crm/pagos/registrar')} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition flex items-center gap-2 font-medium shadow-lg shadow-blue-900/20">
            <Plus className="w-4 h-4" />
            Registrar Pago
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1a1a25] rounded-xl p-4 border border-[#2a2a35]">
            <p className="text-gray-400 text-xs">Total Pagos</p>
            <p className="text-2xl font-bold text-white">{pagos.length}</p>
          </div>
          <div className="bg-[#1a1a25] rounded-xl p-4 border border-[#2a2a35]">
            <p className="text-gray-400 text-xs">Total Cobrado</p>
            <p className="text-xl font-bold text-green-400">{formatMoney(pagos.reduce((sum, p) => sum + p.monto, 0))}</p>
          </div>
          <div className="bg-[#1a1a25] rounded-xl p-4 border border-[#2a2a35]">
            <p className="text-gray-400 text-xs">Este Mes</p>
            <p className="text-xl font-bold text-blue-400">{formatMoney(pagos.filter(p => new Date(p.fecha).getMonth() === new Date().getMonth()).reduce((sum, p) => sum + p.monto, 0))}</p>
          </div>
          <div className="bg-[#1a1a25] rounded-xl p-4 border border-[#2a2a35]">
            <p className="text-gray-400 text-xs">Pendientes</p>
            <p className="text-2xl font-bold text-amber-400">{pagos.filter(p => p.estado === 'pendiente').length}</p>
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
                placeholder="Buscar por prestatario..."
                className="w-full pl-12 pr-4 py-3 bg-[#0a0a0f] border border-[#2a2a35] rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'todos', label: 'Todos' },
                { key: 'efectivo', label: 'Efectivo' },
                { key: 'transferencia', label: 'Transferencia' },
                { key: 'tarjeta', label: 'Tarjeta' }
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFiltroMetodo(f.key as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    filtroMetodo === f.key
                      ? f.key === 'efectivo' ? 'bg-green-600 text-white' : f.key === 'transferencia' ? 'bg-blue-600 text-white' : f.key === 'tarjeta' ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'
                      : 'bg-[#0a0a0f] text-gray-400 hover:text-white border border-[#2a2a35]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tabla de Pagos */}
        <div className="bg-[#1a1a25] rounded-2xl p-6 border border-[#2a2a35]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">Historial de Pagos</h2>
            <span className="text-sm text-gray-400 bg-[#0a0a0f] px-3 py-1 rounded-full">
              {pagosFiltrados.length} resultados
            </span>
          </div>

          {pagosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">No hay pagos que coincidan</p>
              <p className="text-gray-500 text-sm">Intenta con otros filtros o registra un nuevo pago</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2a2a35]">
                    <th className="text-left text-xs text-gray-400 font-medium py-3 px-4">Prestatario</th>
                    <th className="text-left text-xs text-gray-400 font-medium py-3 px-4">Monto</th>
                    <th className="text-left text-xs text-gray-400 font-medium py-3 px-4">Fecha</th>
                    <th className="text-left text-xs text-gray-400 font-medium py-3 px-4">Método</th>
                    <th className="text-left text-xs text-gray-400 font-medium py-3 px-4">Préstamo</th>
                    <th className="text-left text-xs text-gray-400 font-medium py-3 px-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pagosFiltrados.map((p) => {
                    const metodoBadge = getMetodoBadge(p.metodo)
                    return (
                      <tr key={p.id} className="border-b border-[#2a2a35] hover:bg-[#0a0a0f] transition">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:ring-2 hover:ring-blue-500 transition"
                              onClick={() => setFotoModal(p.foto)}
                            >
                              {p.prestatario[0]}
                            </div>
                            <span className="text-white font-medium">{p.prestatario}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-green-400 font-bold">{formatMoney(p.monto)}</td>
                        <td className="py-4 px-4 text-white">{formatDate(p.fecha)}</td>
                        <td className="py-4 px-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${metodoBadge.bg} ${metodoBadge.text}`}>
                            {metodoBadge.label}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-white">{p.prestamo}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setFotoModal(p.foto)}
                              className="p-2 text-blue-400 hover:bg-blue-900/30 rounded-lg transition"
                              title="Ver foto"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => downloadImage(p.foto, `foto-${p.prestatario}.jpg`)}
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
                <X className="w-6 h-6" />
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
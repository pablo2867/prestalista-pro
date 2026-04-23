'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import { BarChart3, TrendingUp, DollarSign, Users, FileText, Calendar, Download, PieChart } from 'lucide-react'

export default function ReportesPage() {
  const [periodo, setPeriodo] = useState<'1M' | '3M' | '6M' | '12M'>('3M')
  const [loading, setLoading] = useState(true)

  const [stats, setStats] = useState({
    totalPrestamos: 15,
    totalPagos: 45,
    montoPrestado: 750000,
    montoCobrado: 320000,
    tasaMorosidad: 6.5,
    crecimiento: 12.5
  })

  const [gananciasMensuales, setGananciasMensuales] = useState([
    { mes: 'Ene', monto: 25000 },
    { mes: 'Feb', monto: 32000 },
    { mes: 'Mar', monto: 28000 },
    { mes: 'Abr', monto: 45000 },
    { mes: 'May', monto: 38000 },
    { mes: 'Jun', monto: 52000 }
  ])

  useEffect(() => {
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }, [])

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(amount)
  }

  const maxGanancia = Math.max(...gananciasMensuales.map(g => g.monto))

  const downloadReport = (type: string) => {
    alert(`📥 Descargando reporte ${type} en formato CSV...\n\nEn producción, esto descargará un archivo real.`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando reportes...</p>
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
              <h1 className="text-2xl md:text-3xl font-bold text-white">Reportes y Analytics</h1>
              <p className="text-gray-400 text-sm">Análisis detallado del rendimiento de tu negocio</p>
            </div>
          </div>
          <div className="flex gap-2">
            {['1M', '3M', '6M', '12M'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriodo(p as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  periodo === p
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'bg-[#1a1a25] text-gray-400 hover:text-white border border-[#2a2a35]'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => downloadReport('completo')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1a1a25] rounded-xl p-6 border border-[#2a2a35]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-400 text-sm">Total Préstamos</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.totalPrestamos}</p>
              </div>
              <div className="w-12 h-12 bg-blue-900/30 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-green-400">+{stats.crecimiento}%</span>
              <span className="text-gray-500">vs período anterior</span>
            </div>
          </div>

          <div className="bg-[#1a1a25] rounded-xl p-6 border border-[#2a2a35]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-400 text-sm">Total Pagos</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.totalPagos}</p>
              </div>
              <div className="w-12 h-12 bg-green-900/30 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Tasa de cobro:</span>
              <span className="text-green-400 font-medium">92%</span>
            </div>
          </div>

          <div className="bg-[#1a1a25] rounded-xl p-6 border border-[#2a2a35]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-400 text-sm">Monto Prestado</p>
                <p className="text-2xl font-bold text-white mt-1">{formatMoney(stats.montoPrestado)}</p>
              </div>
              <div className="w-12 h-12 bg-purple-900/30 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Promedio:</span>
              <span className="text-white font-medium">{formatMoney(stats.montoPrestado / stats.totalPrestamos)}</span>
            </div>
          </div>

          <div className="bg-[#1a1a25] rounded-xl p-6 border border-[#2a2a35]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-400 text-sm">Monto Cobrado</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">{formatMoney(stats.montoCobrado)}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-900/30 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Morosidad:</span>
              <span className="text-red-400 font-medium">{stats.tasaMorosidad}%</span>
            </div>
          </div>
        </div>

        {/* Gráfica de Ganancias */}
        <div className="bg-[#1a1a25] rounded-2xl p-6 border border-[#2a2a35] mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Ganancias Netas por Mes</h2>
                <p className="text-sm text-gray-400">Últimos 6 meses</p>
              </div>
            </div>
            <button onClick={() => downloadReport('ganancias')} className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2">
              <Download className="w-4 h-4" />
              CSV
            </button>
          </div>

          {gananciasMensuales.length === 0 ? (
            <div className="text-center py-16">
              <BarChart3 className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">Sin pagos registrados en este período</p>
              <p className="text-gray-500 text-sm">Los datos aparecerán cuando registres cobros</p>
            </div>
          ) : (
            <div className="space-y-4">
              {gananciasMensuales.map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-12 text-sm text-gray-400 font-medium">{item.mes}</div>
                  <div className="flex-1 bg-[#0a0a0f] rounded-full h-12 relative overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-end pr-4 transition-all duration-500"
                      style={{ width: `${(item.monto / maxGanancia) * 100}%` }}
                    >
                      <span className="text-white font-bold text-sm">{formatMoney(item.monto)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Métricas Adicionales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Distribución por Estado */}
          <div className="bg-[#1a1a25] rounded-2xl p-6 border border-[#2a2a35]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-900/30 rounded-xl flex items-center justify-center">
                <PieChart className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Distribución de Préstamos</h2>
                <p className="text-sm text-gray-400">Por estado</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Activos', value: 65, color: 'bg-green-500', count: 10 },
                { label: 'Pagados', value: 25, color: 'bg-blue-500', count: 4 },
                { label: 'Vencidos', value: 10, color: 'bg-red-500', count: 1 }
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">{item.label}</span>
                    <span className="text-sm text-white font-medium">{item.count} ({item.value}%)</span>
                  </div>
                  <div className="w-full bg-[#0a0a0f] rounded-full h-2">
                    <div className={`${item.color} h-2 rounded-full`} style={{ width: `${item.value}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Prestatarios */}
          <div className="bg-[#1a1a25] rounded-2xl p-6 border border-[#2a2a35]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-900/30 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Top Prestatarios</h2>
                <p className="text-sm text-gray-400">Por monto total</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { nombre: 'Ana García', monto: 150000, prestamos: 3 },
                { nombre: 'Juan Pérez', monto: 100000, prestamos: 2 },
                { nombre: 'María López', monto: 80000, prestamos: 2 },
                { nombre: 'Roberto Díaz', monto: 50000, prestamos: 1 }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-[#0a0a0f] rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-white font-medium">{item.nombre}</p>
                      <p className="text-xs text-gray-500">{item.prestamos} préstamos</p>
                    </div>
                  </div>
                  <p className="text-green-400 font-bold">{formatMoney(item.monto)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resumen del Período */}
        <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-2xl p-6 border border-blue-800/50">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-6 h-6 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Resumen del Período</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Período seleccionado</p>
              <p className="text-white font-medium">{periodo === '1M' ? 'Último mes' : periodo === '3M' ? 'Últimos 3 meses' : periodo === '6M' ? 'Últimos 6 meses' : 'Último año'}</p>
            </div>
            <div>
              <p className="text-gray-400">Crecimiento</p>
              <p className="text-green-400 font-medium">+{stats.crecimiento}% vs período anterior</p>
            </div>
            <div>
              <p className="text-gray-400">Proyección</p>
              <p className="text-blue-400 font-medium">{formatMoney(stats.montoCobrado * 1.15)}</p>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
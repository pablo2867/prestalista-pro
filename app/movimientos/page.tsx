// app/movimientos/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useGlobalContext } from '../lib/GlobalContext' // 🔗 Importar contexto

export default function MovimientosPage() {
  const [loading, setLoading] = useState(true)
  const [movimientos, setMovimientos] = useState<any[]>([])

  // 🔗 Obtener señal de actualización
  const { movimientosActualizados } = useGlobalContext()

  useEffect(() => {
    setLoading(true)
    fetch('/api/movimientos')
      .then(r => r.json())
      .then(d => {
        setMovimientos(d.data || [])
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [movimientosActualizados]) // 🔗 Se recarga cuando se activa la señal

  // 🖨️ Función de Impresión
  const handlePrint = () => {
    window.print()
  }

  // 📥 Función de Exportar a Excel (CSV)
  const handleExport = () => {
    const headers = ['Fecha', 'Cliente', 'Préstamo ID', 'Monto', 'Tipo', 'Notas']
    const rows = movimientos.map((m: any) => [
      new Date(m.fecha_pago).toLocaleDateString('es-MX'),
      `"${m.prestamo?.prestatario?.nombre || ''} ${m.prestamo?.prestatario?.apellido || ''}"`,
      m.prestamo?.id?.substring(0, 8),
      m.monto,
      m.tipo,
      `"${(m.notas || '').replace(/"/g, '""')}"`
    ])

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `movimientos_prestamos_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const s = {
    page: { display: 'flex', minHeight: '100vh', backgroundColor: '#0b0f19', fontFamily: 'system-ui, sans-serif', color: 'white' },
    sidebar: { width: '260px', backgroundColor: '#111827', borderRight: '1px solid #1f2937', position: 'fixed' as const, height: '100vh', zIndex: 10 },
    main: { marginLeft: '260px', flex: 1, padding: '24px' },
    header: { background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 20px rgba(37, 99, 235, 0.25)' },
    btn: { padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' },
    btnPrint: { backgroundColor: '#1e40af', color: 'white' },
    btnExport: { backgroundColor: '#059669', color: 'white' },
    table: { width: '100%', borderCollapse: 'collapse' as const, backgroundColor: '#111827', borderRadius: '12px', overflow: 'hidden' }
  }

  return (
    <div style={s.page}>
      {/* Estilos para impresión */}
      <style>
        {`@media print {
          aside, .no-print { display: none !important; }
          main { margin-left: 0 !important; padding: 0 !important; }
          body { background: white !important; color: black !important; }
          table { border: 1px solid #ccc !important; }
          th, td { border: 1px solid #ccc !important; color: black !important; }
        }`}
      </style>

      {/* Sidebar */}
      <aside style={s.sidebar} className="no-print">
        <div style={{ padding: '20px', borderBottom: '1px solid #1f2937' }}><div style={{ fontWeight: 'bold', fontSize: '16px' }}>PrestaLista Pro</div></div>
        <nav style={{ padding: '16px 12px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}>📊 Dashboard</Link>
          <Link href="/capital" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}>💰 Capital</Link>
          <Link href="/leads" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}>🎯 Mis Leads</Link>
          <Link href="/distribuidores" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}>🤝 Distribuidores</Link>
          <Link href="/prestatarios" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}>👤 Prestatarios</Link>
          <Link href="/prestamos" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}>📄 Préstamos</Link>
          <Link href="/movimientos" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', borderRadius: '8px', marginBottom: '4px', fontWeight: '600', border: '1px solid rgba(59, 130, 246, 0.3)', textDecoration: 'none' }}>📋 Movimientos</Link>
        </nav>
      </aside>

      <main style={s.main}>
        {/* Header */}
        <div style={s.header}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '6px' }}>Historial de Movimientos</h1>
              <p style={{ color: '#e0e7ff', fontSize: '14px' }}>Registro global de pagos recibidos</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }} className="no-print">
              <button onClick={handlePrint} style={{ ...s.btn, ...s.btnPrint }}>🖨️ Imprimir</button>
              <button onClick={handleExport} style={{ ...s.btn, ...s.btnExport }}>📥 Exportar Excel</button>
            </div>
          </div>
        </div>

        {/* Tabla */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>⏳ Cargando movimientos...</div>
        ) : movimientos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>📋 No hay movimientos registrados aún</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr style={{ backgroundColor: '#1f2937', textAlign: 'left' }}>
                  <th style={{ padding: '16px', color: '#9ca3af', fontSize: '14px' }}>Fecha</th>
                  <th style={{ padding: '16px', color: '#9ca3af', fontSize: '14px' }}>Cliente</th>
                  <th style={{ padding: '16px', color: '#9ca3af', fontSize: '14px' }}>ID Préstamo</th>
                  <th style={{ padding: '16px', color: '#9ca3af', fontSize: '14px' }}>Monto</th>
                  <th style={{ padding: '16px', color: '#9ca3af', fontSize: '14px' }}>Tipo</th>
                  <th style={{ padding: '16px', color: '#9ca3af', fontSize: '14px' }}>Notas</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m: any) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid #1f2937' }}>
                    <td style={{ padding: '16px', color: '#e5e7eb' }}>{new Date(m.fecha_pago).toLocaleDateString('es-MX')}</td>
                    <td style={{ padding: '16px', fontWeight: '600', color: 'white' }}>
                      {m.prestamo?.prestatario?.nombre} {m.prestamo?.prestatario?.apellido}
                    </td>
                    <td style={{ padding: '16px', color: '#6b7280', fontSize: '12px' }}>...{m.prestamo?.id?.substring(0, 8)}</td>
                    <td style={{ padding: '16px', fontWeight: 'bold', color: '#34d399' }}>+${Number(m.monto).toLocaleString()}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '12px', 
                        backgroundColor: m.tipo === 'regular' ? '#1e40af' : '#f59e0b',
                        color: 'white'
                      }}>
                        {m.tipo.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '16px', color: '#9ca3af', fontSize: '14px' }}>{m.notas || '-'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: '#1f2937' }}>
                  <td colSpan={3} style={{ padding: '16px', fontWeight: 'bold', textAlign: 'right' }}>TOTAL COBRADO:</td>
                  <td colSpan={3} style={{ padding: '16px', fontWeight: 'bold', fontSize: '20px', color: '#34d399' }}>
                    ${movimientos.reduce((sum, m) => sum + parseFloat(m.monto || 0), 0).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
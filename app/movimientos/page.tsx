'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabaseClient'
import ProtectedRoute from '../lib/ProtectedRoute'
import NotificationsBell from '../components/NotificationsBell'

export default function MovimientosPage() {
  const { user, signOut, isAdmin, isDistributor } = useAuth()
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  
  // ✅ Estados para Movimientos
  const [movimientos, setMovimientos] = useState<any[]>([])
  const [filterSearch, setFilterSearch] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  // ✅ Cargar Datos
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return
      try {
        setLoading(true)

        // 1. Avatar
        const { data: profile } = await supabase.from('user_profiles').select('avatar_url').eq('id', user.id).single()
        if (profile?.avatar_url) setAvatarUrl(profile.avatar_url)

        // 2. Cargar Capital
        const { data: capitalData } = await supabase
          .from('transacciones_capital')
          .select('fecha, descripcion, monto, tipo')
          .eq('user_id', user.id)

        // 3. Cargar Préstamos (Creación)
        const { data: prestamosData } = await supabase
          .from('prestamos')
          .select('fecha_inicio, prestatario, monto_principal')
          .eq('user_id', user.id)

        // 4. Cargar Pagos
        const { data: pagosData } = await supabase
          .from('prestamos_pagos')
          .select('fecha, monto, prestamo_id')
          .eq('user_id', user.id)
        
        // Obtener nombres de prestatarios para los pagos
        let pagosConNombre = []
        if (pagosData) {
          const prestamoIds = pagosData.map(p => p.prestamo_id)
          const { data: prestamosMap } = await supabase
            .from('prestamos')
            .select('id, prestatario')
            .in('id', prestamoIds)
          
          pagosConNombre = pagosData.map(pago => {
            const prestamo = prestamosMap?.find(p => p.id === pago.prestamo_id)
            return {
              ...pago,
              prestatario: prestamo?.prestatario
            }
          })
        }

        // 5. Unificar y Transformar
        const movimientosUnificados = [
          // Capital
          ...(capitalData || []).map(c => ({
            fecha: c.fecha,
            concepto: c.descripcion,
            tipo: c.tipo, // Ingreso o Egreso
            monto: c.monto,
            origen: 'Capital'
          })),
          // Préstamos (Son egresos de caja porque sale dinero)
          ...(prestamosData || []).map(p => ({
            fecha: p.fecha_inicio,
            concepto: `Préstamo otorgado a ${p.prestatario?.nombre || 'Cliente'}`,
            tipo: 'Egreso',
            monto: p.monto_principal,
            origen: 'Préstamos'
          })),
          // Pagos (Son ingresos de caja)
          ...(pagosConNombre || []).map(p => ({
            fecha: p.fecha,
            concepto: `Pago recibido de ${p.prestatario?.nombre || 'Cliente'}`,
            tipo: 'Ingreso',
            monto: p.monto,
            origen: 'Cobranza'
          }))
        ]

        // 6. Ordenar por fecha (más reciente primero)
        movimientosUnificados.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

        setMovimientos(movimientosUnificados)

      } catch (error) {
        console.error('❌ Error cargando movimientos:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user?.id])

  // ✅ Filtrar Movimientos
  const movimientosFiltrados = movimientos.filter(m => {
    const matchSearch = filterSearch === '' || m.concepto.toLowerCase().includes(filterSearch.toLowerCase())
    const fechaMov = new Date(m.fecha).toISOString().split('T')[0]
    const matchFrom = filterDateFrom === '' || fechaMov >= filterDateFrom
    const matchTo = filterDateTo === '' || fechaMov <= filterDateTo
    return matchSearch && matchFrom && matchTo
  })

  // ✅ Exportar CSV
  const handleExportCSV = () => {
    if (movimientosFiltrados.length === 0) return alert('No hay movimientos para exportar')
    const BOM = '\uFEFF'
    const headers = 'Fecha,Concepto,Tipo,Monto,Origen'
    const rows = movimientosFiltrados.map(m => 
      `${new Date(m.fecha).toLocaleDateString('es-MX')},${m.concepto},${m.tipo},${m.monto},${m.origen}`
    ).join('\n')
    const csvContent = BOM + [headers, rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Movimientos_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getInitials = () => {
    if (user?.full_name) {
      const names = user.full_name.split(' ')
      return names.length >= 2 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : user.full_name[0].toUpperCase()
    }
    return user?.email?.[0]?.toUpperCase() || 'U'
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0b0f19', color: 'white' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'pulse 1.5s infinite' }}>⏳</div>
        <div>Cargando Movimientos...</div>
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  )

  return (
    <ProtectedRoute>
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0b0f19', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <style>{`
          @media (max-width: 768px) {
            .sidebar { transform: translateX(-100%) !important; transition: transform 0.3s ease; }
            .sidebar.open { transform: translateX(0) !important; }
            .main-content { margin-left: 0 !important; }
            .mobile-menu-btn { display: flex !important; }
            .overlay { display: block !important; }
          }
          @media (min-width: 769px) {
            .overlay { display: none !important; }
            .mobile-menu-btn { display: none !important; }
          }
        `}</style>

        <div className="overlay" onClick={() => setSidebarOpen(false)} style={{ display: 'none', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 40 }} />

        {/* ✅ SIDEBAR */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} style={{ width: '280px', backgroundColor: '#111827', borderRight: '1px solid #1f2937', position: 'fixed', top: 0, left: 0, bottom: 0, display: 'flex', flexDirection: 'column', zIndex: 50 }}>
          <div style={{ padding: '24px 20px', borderBottom: '1px solid #1f2937' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>💼</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>PrestaLista</div>
            </div>
            <div style={{ backgroundColor: '#1f2937', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold', color: 'white', background: avatarUrl ? 'transparent' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)', flexShrink: 0 }}>
                {avatarUrl ? (<img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />) : (getInitials())}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: '600', fontSize: '14px', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.full_name || 'Usuario'}</div>
                <div style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', backgroundColor: isAdmin() ? '#7c3aed' : isDistributor() ? '#2563eb' : '#059669', color: 'white' }}>{user?.role || 'ADMIN'}</div>
              </div>
            </div>
          </div>

          <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
            <Link href="/dashboard" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}><span style={{ fontSize: '18px' }}>📊</span><span>Dashboard</span></Link>
            <Link href="/prestamos" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}><span style={{ fontSize: '18px' }}>📄</span><span>Préstamos</span></Link>
            <Link href="/capital" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}><span style={{ fontSize: '18px' }}>💰</span><span>Capital</span></Link>
            <Link href="/movimientos" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none', fontWeight: '600' }}><span style={{ fontSize: '18px' }}>📋</span><span>Movimientos</span></Link>
            {isAdmin() && (<Link href="/prestatarios" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}><span style={{ fontSize: '18px' }}>👤</span><span>Prestatarios</span></Link>)}
            {isAdmin() && (<Link href="/distribuidores" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}><span style={{ fontSize: '18px' }}>🤝</span><span>Distribuidores</span></Link>)}
          </nav>

          <div style={{ padding: '20px', borderTop: '1px solid #1f2937' }}>
            <button onClick={() => { signOut(); setSidebarOpen(false); }} style={{ width: '100%', padding: '12px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><span>🚪</span><span>Cerrar Sesión</span></button>
          </div>
        </aside>

        {/* ✅ MAIN CONTENT */}
        <main className="main-content" style={{ marginLeft: '280px', flex: 1, minHeight: '100vh', backgroundColor: '#0b0f19' }}>
          <header style={{ backgroundColor: '#111827', borderBottom: '1px solid #1f2937', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '16px', position: 'sticky', top: 0, zIndex: 30 }}>
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} style={{ display: 'none', padding: '8px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '20px', marginRight: 'auto' }}>☰</button>
            <NotificationsBell />
          </header>

          <div style={{ padding: '32px' }}>
            {/* HEADER */}
            <div style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', borderRadius: '16px', padding: '32px', marginBottom: '32px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0', color: 'white' }}>📋 Movimientos</h1>
              <p style={{ margin: '0 0 24px 0', opacity: 0.9, color: 'rgba(255,255,255,0.9)' }}>Historial unificado de Capital, Préstamos y Cobros</p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => window.print()} className="no-print" style={{ flex: 1, padding: '12px 24px', backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', backdropFilter: 'blur(4px)' }}>🖨️ Imprimir</button>
                <button onClick={handleExportCSV} className="no-print" style={{ flex: 1, padding: '12px 24px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>📥 Exportar CSV</button>
              </div>
            </div>

            {/* FILTROS */}
            <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block', fontWeight: '500' }}>🔍 Buscar</label>
                  <input 
                    type="text" 
                    placeholder="Concepto o cliente..." 
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    style={{ width: '100%', padding: '12px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block', fontWeight: '500' }}>📅 Desde</label>
                  <input 
                    type="date" 
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    style={{ width: '100%', padding: '12px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block', fontWeight: '500' }}>📅 Hasta</label>
                  <input 
                    type="date" 
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    style={{ width: '100%', padding: '12px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: '14px' }}
                  />
                </div>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => { setFilterSearch(''); setFilterDateFrom(''); setFilterDateTo('') }}
                  style={{ padding: '8px 16px', backgroundColor: '#374151', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                >
                  🔄 Limpiar Filtros
                </button>
              </div>
            </div>

            {/* TABLA DE MOVIMIENTOS */}
            <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '24px' }}>
              <h2 style={{ margin: '0 0 24px', fontSize: '20px', fontWeight: '600', color: 'white' }}>Historial ({movimientosFiltrados.length})</h2>
              
              {movimientosFiltrados.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                  <div>No se encontraron movimientos</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {movimientosFiltrados.map((m, index) => (
                    <div key={index} style={{ backgroundColor: '#0b0f19', border: '1px solid #1f2937', borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: 'white', fontWeight: '600', marginBottom: '4px' }}>{m.concepto}</div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                          📅 {new Date(m.fecha).toLocaleDateString('es-MX')} • 📂 {m.origen}
                        </div>
                      </div>
                      <div style={{ 
                        fontWeight: 'bold', 
                        fontSize: '18px', 
                        color: m.tipo === 'Ingreso' ? '#34d399' : '#f87171',
                        textAlign: 'right'
                      }}>
                        {m.tipo === 'Ingreso' ? '+' : '-'}${Number(m.monto).toLocaleString('es-MX')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
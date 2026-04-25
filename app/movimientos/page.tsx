// app/movimientos/page.tsx - VERSIÓN MÓVIL OPTIMIZADA
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../lib/AuthContext'
import ProtectedRoute from '../lib/ProtectedRoute'
import { useGlobalContext } from '../lib/GlobalContext'

export default function MovimientosPage() {
  const { user, signOut, isAdmin, isDistributor, isCollector } = useAuth()
  const [movimientos, setMovimientos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [filterTipo, setFilterTipo] = useState('')
  
  const { triggerMovimientosUpdate } = useGlobalContext()

  useEffect(() => {
    loadMovimientos()
  }, [filterTipo, user?.id])

  const loadMovimientos = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterTipo) params.append('tipo', filterTipo)
      
      // 🔐 Filtrar por rol
      if (!isAdmin() && user?.id) {
        if (isDistributor()) params.append('distribuidor_id', user.id)
        if (isCollector()) params.append('cobrador_id', user.id)
      }
      
      const res = await fetch(`/api/movimientos?${params}`)
      const json = await res.json()
      if (json.success) setMovimientos(json.movimientos || [])
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const getInitials = () => {
    if (user?.full_name) {
      const names = user.full_name.split(' ')
      return names.length >= 2 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : user.full_name[0].toUpperCase()
    }
    return user?.email?.[0]?.toUpperCase() || 'U'
  }

  const getRoleColor = () => {
    if (isAdmin()) return { backgroundColor: '#7c3aed', color: '#fff' }
    if (isDistributor()) return { backgroundColor: '#2563eb', color: '#fff' }
    return { backgroundColor: '#059669', color: '#fff' }
  }

  const getTipoBadge = (tipo: string) => {
    const styles: Record<string, any> = {
      pago: { backgroundColor: '#065f46', color: '#34d399' },
      prestamo: { backgroundColor: '#1e40af', color: '#60a5fa' },
      egreso: { backgroundColor: '#7f1d1d', color: '#f87171' },
      inversion: { backgroundColor: '#581c87', color: '#a78bfa' }
    }
    return <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: '600', ...styles[tipo] }}>{tipo?.toUpperCase()}</span>
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0b0f19', color: 'white' }}>⏳ Cargando...</div>

  return (
    <ProtectedRoute>
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0b0f19', fontFamily: 'system-ui', color: 'white' }}>
        
        {/* 📱 CSS Responsive */}
        <style>{`
          @media (max-width: 768px) {
            .sidebar { transform: translateX(-100%) !important; transition: transform 0.3s ease; }
            .sidebar.open { transform: translateX(0) !important; }
            .main { margin-left: 0 !important; padding: 16px !important; }
            .grid-stats { grid-template-columns: 1fr 1fr !important; gap: 12px !important; }
            .mobile-menu-btn { display: flex !important; }
            .overlay { display: block !important; }
          }
          @media (min-width: 769px) {
            .overlay { display: none !important; }
            .mobile-menu-btn { display: none !important; }
          }
        `}</style>

        {/* Overlay Móvil */}
        <div className="overlay" onClick={() => setSidebarOpen(false)} style={{ display: 'none', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 40 }} />

        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} style={{ width: '260px', backgroundColor: '#111827', borderRight: '1px solid #1f2937', position: 'fixed' as const, top: 0, left: 0, bottom: 0, display: 'flex', flexDirection: 'column' as const, zIndex: 50 }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #1f2937', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#1e40af', border: '2px solid #3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 18, fontWeight: 'bold', color: 'white' }}>{getInitials()}</span>
              </div>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: 14 }}>{user?.full_name || 'Usuario'}</div>
                <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' as const, ...getRoleColor() }}>{user?.role}</span>
              </div>
            </div>
          </div>
          <nav style={{ flex: 1, overflowY: 'auto' as const, padding: '16px 12px' }}>
            <Link href="/dashboard" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', gap: 12, padding: 10, color: '#9ca3af', borderRadius: 8, marginBottom: 4, textDecoration: 'none' }}>📊 Dashboard</Link>
            {(isAdmin() || isDistributor()) && <Link href="/prestamos" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', gap: 12, padding: 10, color: '#9ca3af', borderRadius: 8, marginBottom: 4, textDecoration: 'none' }}>📄 Préstamos</Link>}
            <Link href="/movimientos" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', gap: 12, padding: 12, background: 'rgba(59,130,246,0.15)', color: '#60a5fa', borderRadius: 8, marginBottom: 4, textDecoration: 'none', fontWeight: 600 }}>📋 Movimientos</Link>
            {isAdmin() ? (
              <Link href="/prestatarios" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', gap: 12, padding: 10, color: '#9ca3af', borderRadius: 8, marginBottom: 4, textDecoration: 'none' }}>👤 Prestatarios</Link>
            ) : (
              <Link href="/prestatarios?mis-clientes=true" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', gap: 12, padding: 10, color: '#9ca3af', borderRadius: 8, marginBottom: 4, textDecoration: 'none' }}>👤 Mis Clientes</Link>
            )}
            {isAdmin() && <Link href="/distribuidores" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', gap: 12, padding: 10, color: '#9ca3af', borderRadius: 8, marginBottom: 4, textDecoration: 'none' }}>🤝 Distribuidores</Link>}
          </nav>
          <div style={{ padding: '16px', borderTop: '1px solid #1f2937', backgroundColor: '#111827', flexShrink: 0 }}>
            <button onClick={signOut} style={{ width: '100%', padding: 12, backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>🚪 Cerrar Sesión</button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main" style={{ marginLeft: '260px', flex: 1, padding: '24px' }}>
          
          {/* 🔴 BOTÓN HAMBURGUESA */}
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} style={{ display: 'none', position: 'fixed', top: '70px', left: '16px', zIndex: 100, padding: '10px 14px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>☰</button>
          
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div><h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0 }}>📋 Historial de Movimientos</h1><p style={{ margin: '6px 0 0', opacity: 0.9 }}>Registro de pagos, préstamos y egresos</p></div>
            </div>
          </div>

          {/* Filtros */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)} style={{ width: '100%', padding: '12px', backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: 14 }}>
              <option value="">Todos los tipos</option>
              <option value="pago">✅ Pagos</option>
              <option value="prestamo">📄 Préstamos</option>
              <option value="egreso">💸 Egresos</option>
              <option value="inversion">📈 Inversiones</option>
            </select>
          </div>

          {/* Lista de Movimientos (Cards para móvil) */}
          {movimientos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#6b7280', backgroundColor: '#111827', borderRadius: 12 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
              <p>No hay movimientos registrados aún.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {movimientos.map((m: any) => (
                <div key={m.id} style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, backgroundColor: m.tipo === 'egreso' ? '#7f1d1d' : '#065f46', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                        {m.tipo === 'egreso' ? '📉' : m.tipo === 'prestamo' ? '📄' : '💰'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{m.descripcion || m.prestatario?.nombre || 'Movimiento'}</div>
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>{new Date(m.fecha).toLocaleDateString('es-MX')}</div>
                      </div>
                    </div>
                    {getTipoBadge(m.tipo)}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1f2937', paddingTop: 12 }}>
                    <span style={{ fontSize: 13, color: '#9ca3af' }}>Monto</span>
                    <span style={{ fontSize: 18, fontWeight: 'bold', color: m.tipo === 'egreso' ? '#f87171' : '#34d399' }}>
                      {m.tipo === 'egreso' ? '-' : '+'}${Number(m.monto).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}
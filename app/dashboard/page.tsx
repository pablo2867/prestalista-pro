'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabaseClient'
import ProtectedRoute from '../lib/ProtectedRoute'
import NotificationsBell from '../components/NotificationsBell'

export default function DashboardPage() {
  const { user, signOut, isAdmin, isDistributor } = useAuth()
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  
  // ✅ Estados para Métricas
  const [metrics, setMetrics] = useState({
    saldoCaja: 0,
    prestamosActivos: 0,
    porCobrar: 0,
    vencidos: 0
  })

  // ✅ Estados para Semáforo (Listas)
  const [vencidos, setVencidos] = useState<any[]>([])
  const [porVencer, setPorVencer] = useState<any[]>([])
  const [recientes, setRecientes] = useState<any[]>([])

  // ✅ Cargar Datos al Iniciar
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return
      try {
        setLoading(true)

        // 1. Cargar Avatar
        const { data: profile } = await supabase.from('user_profiles').select('avatar_url').eq('id', user.id).single()
        if (profile?.avatar_url) setAvatarUrl(profile.avatar_url)

        // 2. Cargar Métricas de Capital (Saldo)
        const { data: capital } = await supabase
          .from('transacciones_capital')
          .select('tipo, monto')
          .eq('user_id', user.id)
        
        let ingresos = 0
        let egresos = 0
        if (capital) {
          ingresos = capital.filter(t => t.tipo === 'Ingreso').reduce((sum, t) => sum + (t.monto || 0), 0)
          egresos = capital.filter(t => t.tipo === 'Egreso').reduce((sum, t) => sum + (t.monto || 0), 0)
        }

        // 3. Cargar Préstamos Activos y Vencidos
        const { data: prestamos } = await supabase
          .from('prestamos')
          .select('id, prestatario, monto_total, saldo_pendiente, estado, fecha_vencimiento, fecha_inicio')
          .eq('user_id', user.id)
          .or('estado.eq.activo,estado.eq.vencido')
          .order('fecha_vencimiento', { ascending: true }) // Ordenar por fecha de vencimiento

        let activosCount = 0
        let totalPorCobrar = 0
        let vencidosCount = 0
        let listaVencidos: any[] = []
        let listaPorVencer: any[] = []

        if (prestamos) {
          const today = new Date().toISOString().split('T')[0]
          const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

          prestamos.forEach(p => {
            if (p.estado === 'activo') {
              activosCount++
              totalPorCobrar += (p.saldo_pendiente || 0)
              
              // Lógica Semáforo
              if (p.fecha_vencimiento && p.fecha_vencimiento < today) {
                listaVencidos.push(p)
              } else if (p.fecha_vencimiento && p.fecha_vencimiento <= nextWeek) {
                listaPorVencer.push(p)
              }
            }
            if (p.estado === 'vencido') {
              vencidosCount++
              listaVencidos.push(p) // Asegurar que los marcados como vencidos aparezcan
            }
          })
        }

        setMetrics({
          saldoCaja: ingresos - egresos,
          prestamosActivos: activosCount,
          porCobrar: totalPorCobrar,
          vencidos: vencidosCount
        })

        setVencidos(listaVencidos.slice(0, 3)) // Top 3
        setPorVencer(listaPorVencer.slice(0, 3)) // Top 3
        
        // Recientes: Últimos 3 préstamos creados
        const { data: recientesData } = await supabase
          .from('prestamos')
          .select('id, prestatario, monto_principal, fecha_inicio')
          .eq('user_id', user.id)
          .order('fecha_inicio', { ascending: false })
          .limit(3)
        if (recientesData) setRecientes(recientesData)

      } catch (error) {
        console.error('❌ Error cargando dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user?.id])

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
        <div>Cargando Dashboard...</div>
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
            <Link href="/dashboard" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none', fontWeight: '600' }}><span style={{ fontSize: '18px' }}>📊</span><span>Dashboard</span></Link>
            <Link href="/prestamos" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}><span style={{ fontSize: '18px' }}>📄</span><span>Préstamos</span></Link>
            <Link href="/capital" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}><span style={{ fontSize: '18px' }}>💰</span><span>Capital</span></Link>
            {(isAdmin() || isDistributor()) && (<Link href="/movimientos" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}><span style={{ fontSize: '18px' }}>📋</span><span>Movimientos</span></Link>)}
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
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', margin: '0 0 8px 0' }}>📊 Panel General</h1>
              <p style={{ color: '#9ca3af', margin: 0 }}>Bienvenido de nuevo, {user?.full_name?.split(' ')[0] || 'Usuario'}</p>
            </div>

            {/* ✅ TARJETAS DE MÉTRICAS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              
              {/* Saldo Caja */}
              <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '24px' }}>
                <div style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>💰 Saldo en Caja</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#34d399' }}>${metrics.saldoCaja.toLocaleString('es-MX')}</div>
              </div>

              {/* Préstamos Activos */}
              <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '24px' }}>
                <div style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>📄 Préstamos Activos</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#60a5fa' }}>{metrics.prestamosActivos}</div>
              </div>

              {/* Por Cobrar */}
              <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '24px' }}>
                <div style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>📈 Por Cobrar (Activos)</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#fbbf24' }}>${metrics.porCobrar.toLocaleString('es-MX')}</div>
              </div>

              {/* Vencidos */}
              <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '24px' }}>
                <div style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>⚠️ Préstamos Vencidos</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f87171' }}>{metrics.vencidos}</div>
              </div>
            </div>

            {/* ✅ SEMÁFORO DE COBRANZA */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              
              {/* Columna 1: Vencidos y Por Vencer */}
              <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '24px' }}>
                <h2 style={{ margin: '0 0 24px', fontSize: '20px', fontWeight: '600', color: 'white' }}>🚨 Atención Inmediata</h2>
                
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '14px', color: '#f87171', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>🔴 Vencidos ({vencidos.length})</div>
                  {vencidos.length === 0 ? <div style={{ color: '#6b7280', fontSize: '13px' }}>Todo al día 🎉</div> : (
                    vencidos.map(p => (
                      <div key={p.id} style={{ backgroundColor: '#0b0f19', padding: '12px', borderRadius: '8px', marginBottom: '8px', borderLeft: '3px solid #ef4444' }}>
                        <div style={{ color: 'white', fontWeight: '600' }}>{p.prestatario?.nombre || 'Cliente'}</div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>Venció: {new Date(p.fecha_vencimiento).toLocaleDateString()}</div>
                      </div>
                    ))
                  )}
                </div>

                <div>
                  <div style={{ fontSize: '14px', color: '#fbbf24', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>🟡 Por Vencer (7 días)</div>
                  {porVencer.length === 0 ? <div style={{ color: '#6b7280', fontSize: '13px' }}>Sin alertas próximas</div> : (
                    porVencer.map(p => (
                      <div key={p.id} style={{ backgroundColor: '#0b0f19', padding: '12px', borderRadius: '8px', marginBottom: '8px', borderLeft: '3px solid #f59e0b' }}>
                        <div style={{ color: 'white', fontWeight: '600' }}>{p.prestatario?.nombre || 'Cliente'}</div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>Vence: {new Date(p.fecha_vencimiento).toLocaleDateString()}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Columna 2: Recientes */}
              <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '24px' }}>
                <h2 style={{ margin: '0 0 24px', fontSize: '20px', fontWeight: '600', color: 'white' }}>🆕 Últimos Préstamos</h2>
                {recientes.length === 0 ? <div style={{ color: '#6b7280', fontSize: '13px' }}>No hay registros aún</div> : (
                  recientes.map(p => (
                    <div key={p.id} style={{ backgroundColor: '#0b0f19', padding: '16px', borderRadius: '8px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ color: 'white', fontWeight: '600' }}>{p.prestatario?.nombre || 'Cliente'}</div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>{new Date(p.fecha_inicio).toLocaleDateString()}</div>
                      </div>
                      <div style={{ color: '#34d399', fontWeight: 'bold' }}>${Number(p.monto_principal).toLocaleString()}</div>
                    </div>
                  ))
                )}
                <Link href="/prestamos" style={{ display: 'block', textAlign: 'center', marginTop: '16px', color: '#60a5fa', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>Ver todos los préstamos →</Link>
              </div>

            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
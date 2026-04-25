// app/capital/page.tsx - VERSIÓN MÓVIL OPTIMIZADA
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../lib/AuthContext'
import ProtectedRoute from '../lib/ProtectedRoute'

export default function CapitalPage() {
  const { user, signOut, isAdmin } = useAuth()
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [transactions, setTransactions] = useState<any[]>([])
  const [balance, setBalance] = useState({ actual: 0, ingresos: 0, egresos: 0 })
  const [formData, setFormData] = useState({ tipo: 'ingreso', descripcion: '', monto: '', categoria: 'capital' })
  const [formLoading, setFormLoading] = useState(false)

  // 🔐 Solo Admin puede acceder
  useEffect(() => {
    if (!isAdmin()) {
      window.location.href = '/dashboard'
      return
    }
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/capital')
      const json = await res.json()
      if (json.success) {
        setTransactions(json.transactions || [])
        setBalance(json.balance || { actual: 0, ingresos: 0, egresos: 0 })
      }
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.descripcion || !formData.monto) return alert('📝 Descripción y monto son obligatorios')
    
    setFormLoading(true)
    try {
      const res = await fetch('/api/capital', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const result = await res.json()
      if (result.success) {
        alert('✅ Transacción registrada')
        setFormData({ tipo: 'ingreso', descripcion: '', monto: '', categoria: 'capital' })
        loadData()
      } else {
        alert('❌ ' + result.error)
      }
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setFormLoading(false)
    }
  }

  const getInitials = () => {
    if (user?.full_name) {
      const names = user.full_name.split(' ')
      return names.length >= 2 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : user.full_name[0].toUpperCase()
    }
    return user?.email?.[0]?.toUpperCase() || 'U'
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
            .grid-stats { grid-template-columns: 1fr !important; gap: 12px !important; }
            .grid-form { grid-template-columns: 1fr !important; }
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
                <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', backgroundColor: '#7c3aed', color: '#fff' }}>ADMIN</span>
              </div>
            </div>
          </div>
          <nav style={{ flex: 1, overflowY: 'auto' as const, padding: '16px 12px' }}>
            <Link href="/dashboard" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', gap: 12, padding: 10, color: '#9ca3af', borderRadius: 8, marginBottom: 4, textDecoration: 'none' }}>📊 Dashboard</Link>
            <Link href="/prestamos" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', gap: 12, padding: 10, color: '#9ca3af', borderRadius: 8, marginBottom: 4, textDecoration: 'none' }}>📄 Préstamos</Link>
            <Link href="/movimientos" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', gap: 12, padding: 10, color: '#9ca3af', borderRadius: 8, marginBottom: 4, textDecoration: 'none' }}>📋 Movimientos</Link>
            <Link href="/prestatarios" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', gap: 12, padding: 10, color: '#9ca3af', borderRadius: 8, marginBottom: 4, textDecoration: 'none' }}>👤 Prestatarios</Link>
            <Link href="/distribuidores" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', gap: 12, padding: 10, color: '#9ca3af', borderRadius: 8, marginBottom: 4, textDecoration: 'none' }}>🤝 Distribuidores</Link>
            <Link href="/capital" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', gap: 12, padding: 12, background: 'rgba(59,130,246,0.15)', color: '#60a5fa', borderRadius: 8, marginBottom: 4, textDecoration: 'none', fontWeight: 600 }}>💰 Capital</Link>
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
            <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0 }}>💰 Gestión de Capital</h1>
            <p style={{ margin: '6px 0 0', opacity: 0.9 }}>Controla ingresos, egresos y el balance de tu negocio</p>
          </div>

          {/* Stats Cards */}
          <div className="grid-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 24 }}>
            <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 20 }}>
              <div style={{color:'#9ca3af',fontSize:13,marginBottom:8}}>Saldo Actual</div>
              <div style={{fontSize:28,fontWeight:'bold',color:'#34d399'}}>${balance.actual.toLocaleString()}</div>
            </div>
            <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 20 }}>
              <div style={{color:'#9ca3af',fontSize:13,marginBottom:8}}>Ingresos</div>
              <div style={{fontSize:28,fontWeight:'bold',color:'#60a5fa'}}>${balance.ingresos.toLocaleString()}</div>
            </div>
            <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 20 }}>
              <div style={{color:'#9ca3af',fontSize:13,marginBottom:8}}>Egresos</div>
              <div style={{fontSize:28,fontWeight:'bold',color:'#ef4444'}}>${balance.egresos.toLocaleString()}</div>
            </div>
          </div>

          {/* Formulario */}
          <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <h2 style={{ margin: '0 0 24px', fontSize: 18, fontWeight: 600 }}>📝 Registrar Transacción</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ color: '#9ca3af', fontSize: 13, marginBottom: 8, display: 'block' }}>Tipo</label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', backgroundColor: formData.tipo === 'ingreso' ? '#065f46' : '#030712', border: '1px solid #1f2937', borderRadius: 8, cursor: 'pointer' }}>
                      <input type="radio" name="tipo" value="ingreso" checked={formData.tipo === 'ingreso'} onChange={(e) => setFormData({...formData, tipo: e.target.value})} style={{ display: 'none' }} />
                      <span>📈 Ingreso</span>
                    </label>
                    <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', backgroundColor: formData.tipo === 'egreso' ? '#7f1d1d' : '#030712', border: '1px solid #1f2937', borderRadius: 8, cursor: 'pointer' }}>
                      <input type="radio" name="tipo" value="egreso" checked={formData.tipo === 'egreso'} onChange={(e) => setFormData({...formData, tipo: e.target.value})} style={{ display: 'none' }} />
                      <span>📉 Egreso</span>
                    </label>
                  </div>
                </div>
                <div><label style={{ color: '#9ca3af', fontSize: 13, marginBottom: 8, display: 'block' }}>Descripción *</label><input type="text" value={formData.descripcion} onChange={(e) => setFormData({...formData, descripcion: e.target.value})} required style={{ width: '100%', padding: '14px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: 16 }} /></div>
                <div><label style={{ color: '#9ca3af', fontSize: 13, marginBottom: 8, display: 'block' }}>Monto *</label><input type="number" value={formData.monto} onChange={(e) => setFormData({...formData, monto: e.target.value})} required style={{ width: '100%', padding: '14px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: 16 }} /></div>
                <div style={{ gridColumn: '1 / -1' }}><label style={{ color: '#9ca3af', fontSize: 13, marginBottom: 8, display: 'block' }}>Categoría</label><input type="text" value={formData.categoria} onChange={(e) => setFormData({...formData, categoria: e.target.value})} placeholder="Ej: Capital, Operación, Marketing" style={{ width: '100%', padding: '14px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: 16 }} /></div>
              </div>
              <div style={{ marginTop: 24 }}>
                <button type="submit" disabled={formLoading} style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #2563eb, #3b82f6)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: 16 }}>{formLoading ? '⏳...' : '💾 Registrar'}</button>
              </div>
            </form>
          </div>

          {/* Historial (Cards para móvil) */}
          <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 24 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 600 }}>Historial de Transacciones</h2>
            
            {transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
                <p>Aún no hay transacciones registradas</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {transactions.map((t: any) => (
                  <div key={t.id} style={{ backgroundColor: '#0b0f19', border: '1px solid #1f2937', borderRadius: 12, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, backgroundColor: t.tipo === 'ingreso' ? '#065f46' : '#7f1d1d', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                          {t.tipo === 'ingreso' ? '📈' : '📉'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{t.descripcion}</div>
                          <div style={{ fontSize: 12, color: '#9ca3af' }}>{t.categoria} • {new Date(t.fecha).toLocaleDateString('es-MX')}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: 16, fontWeight: 'bold', color: t.tipo === 'ingreso' ? '#34d399' : '#f87171' }}>
                        {t.tipo === 'ingreso' ? '+' : '-'}${Number(t.monto).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
// app/distribuidores/page.tsx - VERSIÓN MÓVIL OPTIMIZADA
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../lib/AuthContext'
import ProtectedRoute from '../lib/ProtectedRoute'

export default function DistribuidoresPage() {
  const { user, signOut, isAdmin } = useAuth()
  const [distribuidores, setDistribuidores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [formData, setFormData] = useState({ nombre: '', email: '', telefono: '', comision: '10' })
  const [formLoading, setFormLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // 🔐 Solo Admin puede acceder
  useEffect(() => {
    if (!isAdmin()) {
      window.location.href = '/dashboard'
      return
    }
    loadDistribuidores()
  }, [])

  const loadDistribuidores = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/distributors')
      const json = await res.json()
      if (json.success) setDistribuidores(json.data || [])
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nombre || !formData.email) return alert('📧 Nombre y email son obligatorios')
    
    setFormLoading(true)
    try {
      const url = editingId ? `/api/distributors/${editingId}` : '/api/distributors'
      const method = editingId ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const result = await res.json()
      
      if (result.success) {
        alert(editingId ? '✅ Distribuidor actualizado' : '✅ Distribuidor registrado')
        setFormData({ nombre: '', email: '', telefono: '', comision: '10' })
        setEditingId(null)
        loadDistribuidores()
      } else {
        alert('❌ ' + result.error)
      }
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = (dist: any) => {
    setEditingId(dist.id)
    setFormData({ nombre: dist.nombre, email: dist.email, telefono: dist.telefono || '', comision: dist.comision?.toString() || '10' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este distribuidor?')) return
    try {
      const res = await fetch(`/api/distributors/${id}`, { method: 'DELETE' })
      const result = await res.json()
      if (result.success) {
        alert('✅ Distribuidor eliminado')
        loadDistribuidores()
      } else {
        alert('❌ ' + result.error)
      }
    } catch (err: any) {
      alert('Error: ' + err.message)
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
            <Link href="/distribuidores" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', gap: 12, padding: 12, background: 'rgba(59,130,246,0.15)', color: '#60a5fa', borderRadius: 8, marginBottom: 4, textDecoration: 'none', fontWeight: 600 }}>🤝 Distribuidores</Link>
            <Link href="/capital" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', gap: 12, padding: 10, color: '#9ca3af', borderRadius: 8, marginBottom: 4, textDecoration: 'none' }}>💰 Capital</Link>
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
            <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0 }}>🤝 Gestión de Distribuidores</h1>
            <p style={{ margin: '6px 0 0', opacity: 0.9 }}>Administra tus socios distribuidores y sus comisiones</p>
          </div>

          {/* Formulario */}
          <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <h2 style={{ margin: '0 0 24px', fontSize: 18, fontWeight: 600 }}>{editingId ? '✏️ Editar Distribuidor' : '📝 Nuevo Distribuidor'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                <div><label style={{ color: '#9ca3af', fontSize: 13, marginBottom: 8, display: 'block' }}>Nombre *</label><input type="text" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} required style={{ width: '100%', padding: '14px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: 16 }} /></div>
                <div><label style={{ color: '#9ca3af', fontSize: 13, marginBottom: 8, display: 'block' }}>Email *</label><input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required style={{ width: '100%', padding: '14px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: 16 }} /></div>
                <div><label style={{ color: '#9ca3af', fontSize: 13, marginBottom: 8, display: 'block' }}>Teléfono</label><input type="tel" value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})} style={{ width: '100%', padding: '14px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: 16 }} /></div>
                <div><label style={{ color: '#9ca3af', fontSize: 13, marginBottom: 8, display: 'block' }}>Comisión %</label><input type="number" value={formData.comision} onChange={(e) => setFormData({...formData, comision: e.target.value})} style={{ width: '100%', padding: '14px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: 16 }} /></div>
              </div>
              <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                <button type="submit" disabled={formLoading} style={{ flex: 1, padding: '16px', background: 'linear-gradient(135deg, #2563eb, #3b82f6)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: 16 }}>{formLoading ? '⏳...' : editingId ? '💾 Actualizar' : '💾 Registrar'}</button>
                {editingId && (
                  <button type="button" onClick={() => { setEditingId(null); setFormData({ nombre: '', email: '', telefono: '', comision: '10' }) }} style={{ padding: '16px 24px', backgroundColor: '#1f2937', color: '#9ca3af', border: '1px solid #374151', borderRadius: '8px', cursor: 'pointer', fontSize: 16 }}>Cancelar</button>
                )}
              </div>
            </form>
          </div>

          {/* Lista de Distribuidores (Cards para móvil) */}
          <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 24 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 600 }}>Distribuidores Registrados ({distribuidores.length})</h2>
            
            {distribuidores.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🤝</div>
                <p>Aún no hay distribuidores registrados</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {distribuidores.map((d: any) => (
                  <div key={d.id} style={{ backgroundColor: '#0b0f19', border: '1px solid #1f2937', borderRadius: 12, padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                      <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: '#581c87', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 20, color: 'white' }}>
                        {d.nombre?.[0]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 16 }}>{d.nombre}</div>
                        <div style={{ fontSize: 13, color: '#9ca3af' }}>{d.email}</div>
                      </div>
                      <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: '600', backgroundColor: '#065f46', color: '#34d399' }}>{d.comision}%</span>
                    </div>
                    {d.telefono && <div style={{ fontSize: 14, color: '#9ca3af', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>📞 {d.telefono}</div>}
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button onClick={() => handleEdit(d)} style={{ flex: 1, padding: '12px', backgroundColor: '#1e40af', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>✏️ Editar</button>
                      <button onClick={() => handleDelete(d.id)} style={{ flex: 1, padding: '12px', backgroundColor: '#7f1d1d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>🗑️ Eliminar</button>
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
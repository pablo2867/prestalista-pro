// app/leads/page.tsx - VERSIÓN FINAL: SPLIT DE NOMBRE/APPELLIDO
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../lib/AuthContext'
import ProtectedRoute from '../lib/ProtectedRoute'

export default function LeadsPage() {
  const { user, signOut, isAdmin, isDistributor } = useAuth()
  
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => { loadLeads() }, [])

  const loadLeads = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/leads')
      const json = await res.json()
      if (json.success) setLeads(json.leads || [])
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  // ✅ SOLUCIÓN DEFINITIVA: Separar Nombre y Apellido automáticamente
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 1. Obtener datos del formulario
    const formElement = e.target as HTMLFormElement
    const datos = new FormData(formElement)
    
    const nombreCompleto = (datos.get('nombre') as string)?.trim() || ''
    const telefono = (datos.get('telefono') as string)?.trim() || ''
    
    if (!nombreCompleto || !telefono) return alert('👤 Nombre y teléfono son obligatorios')

    // 2. Separar el nombre completo en partes
    // Si el usuario escribe "Eddy A Flores":
    // nombre = "Eddy"
    // apellido = "A Flores"
    const partes = nombreCompleto.split(' ')
    const nombre = partes[0]
    const apellido = partes.length > 1 ? partes.slice(1).join(' ') : 'N/A'

    setFormLoading(true)
    try {
      // 3. Enviar nombre y apellido por separado a la API
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nombre, 
          apellido, // ✅ AQUÍ ESTÁ LA MAGIA
          telefono, 
          fuente: datos.get('fuente'),
          monto_potencial: datos.get('monto_potencial'),
          notas: ''
        })
      })
      
      const result = await res.json()
      
      if (result.success) {
        alert('✅ Lead registrado exitosamente')
        formElement.reset()
        setShowForm(false)
        loadLeads()
      } else { 
        alert('❌ ' + result.error) 
      }
    } catch (err: any) { 
      alert('Error: ' + err.message) 
    } finally { 
      setFormLoading(false) 
    }
  }

  const updateStatus = async (id: string, nuevoEstado: string) => {
    try {
      const res = await fetch(`/api/leads/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado: nuevoEstado }) })
      if (res.ok) loadLeads()
    } catch (err) { console.error(err) }
  }

  const convertToClient = async (lead: any) => {
    if (!confirm(`¿Convertir a ${lead.nombre} en cliente?`)) return
    try {
      const res = await fetch('/api/leads/convert', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lead_id: lead.id }) })
      const result = await res.json()
      if (result.success) { alert('✅ Cliente creado'); loadLeads() } else { alert('❌ ' + result.error) }
    } catch (err: any) { alert('Error: ' + err.message) }
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

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'nuevo': return { backgroundColor: '#1e3a8a', color: '#60a5fa' }
      case 'contactado': return { backgroundColor: '#581c87', color: '#c084fc' }
      case 'convertido': return { backgroundColor: '#065f46', color: '#34d399' }
      default: return { backgroundColor: '#374151', color: '#9ca3af' }
    }
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0b0f19', color: 'white' }}>⏳ Cargando...</div>

  return (
    <ProtectedRoute>
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0b0f19', fontFamily: 'system-ui', color: 'white' }}>
        
        {/* 📱 CSS RESPONSIVE */}
        <style>{`
          @media (max-width: 768px) {
            .sidebar { transform: translateX(-100%) !important; transition: transform 0.3s ease; }
            .sidebar.open { transform: translateX(0) !important; }
            .main { margin-left: 0 !important; padding: 16px !important; }
            .grid-stats { grid-template-columns: 1fr 1fr !important; gap: 12px !important; }
            .mobile-menu-btn { display: flex !important; }
            button { -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
            input, select, textarea, button { -webkit-user-select: auto; user-select: auto; }
          }
          @media (min-width: 769px) {
            .overlay { display: none !important; }
            .mobile-menu-btn { display: none !important; }
          }
          @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>

        {/* Overlay controlado por React */}
        <div 
          className="overlay" 
          onClick={() => setSidebarOpen(false)} 
          style={{ 
            display: sidebarOpen ? 'block' : 'none', 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: 'rgba(0,0,0,0.5)', 
            zIndex: 40 
          }} 
        />

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
            {(isAdmin() || isDistributor()) && (
              <Link href="/leads" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', gap: 12, padding: 12, background: 'rgba(59,130,246,0.15)', color: '#60a5fa', borderRadius: 8, marginBottom: 4, textDecoration: 'none', fontWeight: 600 }}>🎯 Mis Leads</Link>
            )}
            {(isAdmin() || isDistributor()) && <Link href="/movimientos" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', gap: 12, padding: 10, color: '#9ca3af', borderRadius: 8, marginBottom: 4, textDecoration: 'none' }}>📋 Movimientos</Link>}
            {isAdmin() ? (
              <Link href="/prestatarios" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', gap: 12, padding: 10, color: '#9ca3af', borderRadius: 8, marginBottom: 4, textDecoration: 'none' }}>👤 Prestatarios</Link>
            ) : (
              <Link href="/prestatarios?mis-clientes=true" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', gap: 12, padding: 10, color: '#9ca3af', borderRadius: 8, marginBottom: 4, textDecoration: 'none' }}>👤 Mis Clientes</Link>
            )}
            {isAdmin() && <Link href="/distribuidores" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', gap: 12, padding: 10, color: '#9ca3af', borderRadius: 8, marginBottom: 4, textDecoration: 'none' }}>🤝 Distribuidores</Link>}
            {isAdmin() && <Link href="/capital" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', gap: 12, padding: 10, color: '#9ca3af', borderRadius: 8, marginBottom: 4, textDecoration: 'none' }}>💰 Capital</Link>}
          </nav>
          <div style={{ padding: '16px', borderTop: '1px solid #1f2937', backgroundColor: '#111827', flexShrink: 0 }}>
            <button onClick={signOut} style={{ width: '100%', padding: 12, backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>🚪 Cerrar Sesión</button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main" style={{ marginLeft: '260px', flex: 1, padding: '24px' }}>
          
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} style={{ display: 'none', position: 'fixed', top: '70px', left: '16px', zIndex: 100, padding: '10px 14px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>☰</button>
          
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, color: 'white' }}>🎯 Mis Leads</h1>
                <p style={{ margin: '6px 0 0', opacity: 0.9, color: 'white' }}>Gestiona tu pipeline de ventas</p>
              </div>
              
              <button 
                onClick={() => setShowForm(prev => !prev)}
                style={{ 
                  padding: '14px 28px', 
                  backgroundColor: showForm ? '#dc2626' : '#ffffff', 
                  color: showForm ? '#fff' : '#2563eb', 
                  border: '3px solid #2563eb',
                  borderRadius: '10px', 
                  cursor: 'pointer', 
                  fontWeight: 'bold', 
                  fontSize: 15,
                  boxShadow: '0 6px 16px rgba(0,0,0,0.3)',
                  transition: 'all 0.2s ease',
                  zIndex: 60,
                  position: 'relative' as const,
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  minWidth: '160px'
                }}
              >
                {showForm ? '✕ Cerrar' : '＋ Nuevo Lead'}
              </button>
            </div>
          </div>

          {/* ✅ FORMULARIO */}
          {showForm && (
            <div style={{ 
              backgroundColor: '#ffffff',
              color: '#1f2937',
              border: '4px solid #22c55e',
              borderRadius: 12, 
              padding: 24, 
              marginBottom: 24,
              boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
              animation: 'slideDown 0.3s ease',
              position: 'relative',
              zIndex: 70
            }}>
              <div style={{ 
                backgroundColor: '#22c55e', 
                color: 'white', 
                padding: '10px 16px', 
                borderRadius: 8, 
                marginBottom: 20, 
                fontWeight: 'bold', 
                textAlign: 'center'
              }}>
                ✅ Formulario de Nuevo Lead
              </div>
              
              <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700, color: '#1f2937' }}>📝 Registrar Lead</h2>
              
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                  <div>
                    <label style={{ color: '#374151', fontSize: 14, marginBottom: 6, display: 'block', fontWeight: 600 }}>Nombre y Apellido *</label>
                    <input 
                      name="nombre"
                      type="text" 
                      placeholder="Ej: Eddy A Flores" 
                      required 
                      style={{ width: '100%', padding: '14px', backgroundColor: '#f9fafb', border: '2px solid #d1d5db', borderRadius: '8px', color: '#1f2937', fontSize: 16 }} 
                    />
                  </div>
                  <div>
                    <label style={{ color: '#374151', fontSize: 14, marginBottom: 6, display: 'block', fontWeight: 600 }}>Teléfono *</label>
                    <input 
                      name="telefono"
                      type="tel" 
                      placeholder="Ej: 9934023786" 
                      required 
                      style={{ width: '100%', padding: '14px', backgroundColor: '#f9fafb', border: '2px solid #d1d5db', borderRadius: '8px', color: '#1f2937', fontSize: 16 }} 
                    />
                  </div>
                  <div>
                    <label style={{ color: '#374151', fontSize: 14, marginBottom: 6, display: 'block', fontWeight: 600 }}>Fuente</label>
                    <select 
                      name="fuente"
                      style={{ width: '100%', padding: '14px', backgroundColor: '#f9fafb', border: '2px solid #d1d5db', borderRadius: '8px', color: '#1f2937', fontSize: 16 }}
                    >
                      <option value="referido">Referido</option>
                      <option value="redes">Redes Sociales</option>
                      <option value="llamada">Llamada en Frío</option>
                      <option value="distribuidor">Distribuidor</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ color: '#374151', fontSize: 14, marginBottom: 6, display: 'block', fontWeight: 600 }}>Monto Potencial</label>
                    <input 
                      name="monto_potencial"
                      type="number" 
                      placeholder="Ej: 60000" 
                      style={{ width: '100%', padding: '14px', backgroundColor: '#f9fafb', border: '2px solid #d1d5db', borderRadius: '8px', color: '#1f2937', fontSize: 16 }} 
                    />
                  </div>
                </div>
                <button type="submit" disabled={formLoading} style={{ width: '100%', marginTop: 20, padding: '16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: 16 }}>{formLoading ? '⏳ Guardando...' : '💾 GUARDAR LEAD'}</button>
              </form>
            </div>
          )}

          {/* Stats */}
          <div className="grid-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
            <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 16, textAlign: 'center' }}><div style={{ fontSize: 24, marginBottom: 4 }}>🔵</div><div style={{ fontSize: 12, color: '#9ca3af' }}>Nuevos</div><div style={{ fontSize: 20, fontWeight: 'bold', color: '#60a5fa' }}>{leads.filter(l => l.estado === 'nuevo').length}</div></div>
            <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 16, textAlign: 'center' }}><div style={{ fontSize: 24, marginBottom: 4 }}>🟣</div><div style={{ fontSize: 12, color: '#9ca3af' }}>Contactados</div><div style={{ fontSize: 20, fontWeight: 'bold', color: '#c084fc' }}>{leads.filter(l => l.estado === 'contactado').length}</div></div>
            <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 16, textAlign: 'center' }}><div style={{ fontSize: 24, marginBottom: 4 }}>🟢</div><div style={{ fontSize: 12, color: '#9ca3af' }}>Convertidos</div><div style={{ fontSize: 20, fontWeight: 'bold', color: '#34d399' }}>{leads.filter(l => l.estado === 'convertido').length}</div></div>
          </div>

          {/* Lista de Leads */}
          <div>
            <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 600, color: 'white' }}>Todos los Leads</h2>
            {leads.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#6b7280', backgroundColor: '#111827', borderRadius: 12 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
                <p>No hay leads registrados aún.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {leads.map((lead: any) => (
                  <div key={lead.id} style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 18, color: 'white' }}>{lead.nombre?.[0]}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 16, color: 'white' }}>{lead.nombre} {lead.apellido}</div>
                          <div style={{ fontSize: 13, color: '#9ca3af' }}>📞 {lead.telefono}</div>
                        </div>
                      </div>
                      <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: '600', ...getStatusColor(lead.estado) }}>{lead.estado.toUpperCase()}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {lead.estado === 'nuevo' && (<button onClick={() => updateStatus(lead.id, 'contactado')} style={{ flex: 1, padding: '10px', backgroundColor: '#581c87', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: 14 }}>📞 Contactado</button>)}
                      {lead.estado === 'contactado' && (<button onClick={() => updateStatus(lead.id, 'nuevo')} style={{ flex: 1, padding: '10px', backgroundColor: '#1f2937', color: '#9ca3af', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: 14 }}>↩️ Volver</button>)}
                      <button onClick={() => convertToClient(lead)} disabled={lead.estado === 'convertido'} style={{ flex: 1, padding: '10px', backgroundColor: lead.estado === 'convertido' ? '#065f46' : '#059669', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>{lead.estado === 'convertido' ? '✅ Cliente' : '🔄 Convertir'}</button>
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
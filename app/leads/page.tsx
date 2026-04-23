// app/leads/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'  // 🔹 Agregado: Import para navegación

export default function LeadsPage() {
  const [loading, setLoading] = useState(true)
  const [leads, setLeads] = useState<any[]>([])
  const [metrics, setMetrics] = useState({ 
    total: 0, 
    nuevos: 0, 
    contactados: 0,
    calificados: 0,
    convertidos: 0,
    perdidos: 0,
    totalInteres: 0
  })
  const [filterEstado, setFilterEstado] = useState('')
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
    origen: 'facebook',
    fuente_detalle: '',
    monto_interes: '',
    proposito: '',
    prioridad: 'media',
    notas: ''
  })
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [filterEstado])

  const loadData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterEstado) params.append('estado', filterEstado)

      const res = await fetch(`/api/leads?${params}`)
      const json = await res.json()
      
      if (json.success) {
        setLeads(json.leads || [])
        setMetrics(json.metrics || { total: 0, nuevos: 0, contactados: 0, calificados: 0, convertidos: 0, perdidos: 0, totalInteres: 0 })
      }
    } catch (err) {
      console.error('Error cargando leads:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const result = await res.json()
      
      if (result.success) {
        alert('✅ Lead registrado exitosamente')
        setFormData({
          nombre: '',
          apellido: '',
          telefono: '',
          email: '',
          origen: 'facebook',
          fuente_detalle: '',
          monto_interes: '',
          proposito: '',
          prioridad: 'media',
          notas: ''
        })
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

  const handleCambiarEstado = async (id: string, nuevoEstado: string) => {
    try {
      const res = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, estado: nuevoEstado })
      })
      const result = await res.json()
      
      if (result.success) {
        alert(`✅ Lead actualizado a: ${nuevoEstado}`)
        loadData()
      } else {
        alert('❌ ' + result.error)
      }
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  const s = {
    page: { display: 'flex', minHeight: '100vh', backgroundColor: '#0b0f19', fontFamily: 'system-ui, sans-serif', color: 'white' },
    sidebar: { width: '260px', backgroundColor: '#111827', borderRight: '1px solid #1f2937', position: 'fixed' as const, height: '100vh', zIndex: 10 },
    main: { marginLeft: '260px', flex: 1, padding: '24px' },
    card: { backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '28px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', marginBottom: '24px' },
    input: { width: '100%', padding: '14px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: '15px', boxSizing: 'border-box' as const, outline: 'none', marginBottom: '16px' },
    btn: { padding: '14px 32px', background: 'linear-gradient(135deg, #2563eb, #3b82f6)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '15px', boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)' },
    btnCancel: { padding: '14px 28px', backgroundColor: '#1f2937', color: '#9ca3af', border: '1px solid #374151', borderRadius: '8px', cursor: 'pointer', fontSize: '15px' },
    badge: { padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: '600' }
  }

  const getEstadoBadge = (estado: string) => {
    const styles: Record<string, any> = {
      nuevo: { backgroundColor: '#1e40af', color: '#60a5fa' },
      contactado: { backgroundColor: '#065f46', color: '#34d399' },
      calificado: { backgroundColor: '#7c3aed', color: '#a78bfa' },
      propuesta_enviada: { backgroundColor: '#f59e0b', color: '#fbbf24' },
      convertido: { backgroundColor: '#059669', color: '#34d399' },
      perdido: { backgroundColor: '#7f1d1d', color: '#f87171' }
    }
    const labels: Record<string, string> = {
      nuevo: '🆕 Nuevo',
      contactado: '📞 Contactado',
      calificado: '✅ Calificado',
      propuesta_enviada: '📄 Propuesta',
      convertido: '✅ Convertido',
      perdido: '❌ Perdido'
    }
    return (
      <span style={{ ...s.badge, ...styles[estado] }}>
        {labels[estado] || estado}
      </span>
    )
  }

  const getPrioridadBadge = (prioridad: string) => {
    const styles: Record<string, any> = {
      baja: { backgroundColor: '#374151', color: '#9ca3af' },
      media: { backgroundColor: '#1e40af', color: '#60a5fa' },
      alta: { backgroundColor: '#f59e0b', color: '#fbbf24' },
      urgente: { backgroundColor: '#dc2626', color: '#f87171' }
    }
    return (
      <span style={{ ...s.badge, ...styles[prioridad] }}>
        {prioridad.toUpperCase()}
      </span>
    )
  }

  const getOrigenIcon = (origen: string) => {
    const icons: Record<string, string> = {
      facebook: '📘',
      instagram: '📷',
      google: '🔍',
      referido: '👥',
      walk_in: '🚶',
      telefono: '📞',
      otro: '📌'
    }
    return icons[origen] || '📌'
  }

  return (
    <div style={s.page}>
      {/* Sidebar */}
      <aside style={s.sidebar}>
        <div style={{ padding: '20px', borderBottom: '1px solid #1f2937' }}>
          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>PrestaLista Pro</div>
        </div>
        <nav style={{ padding: '16px 12px' }}>
          {/* 🔹 CORREGIDO: Reemplazar <a> por <Link> con href */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}>📊 Dashboard</Link>
          <Link href="/capital" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}>💰 Capital</Link>
          <Link href="/leads" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', borderRadius: '8px', marginBottom: '4px', fontWeight: '600', border: '1px solid rgba(59, 130, 246, 0.3)', textDecoration: 'none' }}>🎯 Mis Leads</Link>
          <Link href="/distribuidores" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}>🤝 Distribuidores</Link>
          <Link href="/prestatarios" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}>👤 Prestatarios</Link>
          <Link href="/prestamos" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}>📄 Préstamos</Link>
        </nav>
      </aside>

      {/* Contenido Principal - EL RESTO DE TU CÓDIGO SE MANTIENE IGUAL */}
      <main style={s.main}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 20px rgba(37, 99, 235, 0.25)' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '6px' }}>Gestión de Leads</h1>
          <p style={{ color: '#e0e7ff', fontSize: '14px' }}>Captura y sigue prospectos hasta convertirlos en clientes</p>
        </div>

        {/* Métricas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
          <div style={{ ...s.card, marginBottom: 0 }}>
            <div style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px' }}>Total Leads</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#60a5fa' }}>{metrics.total}</div>
          </div>
          <div style={{ ...s.card, marginBottom: 0 }}>
            <div style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px' }}>Nuevos</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fbbf24' }}>{metrics.nuevos}</div>
          </div>
          <div style={{ ...s.card, marginBottom: 0 }}>
            <div style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px' }}>Convertidos</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#34d399' }}>{metrics.convertidos}</div>
          </div>
          <div style={{ ...s.card, marginBottom: 0 }}>
            <div style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px' }}>Monto Potencial</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f87171' }}>${metrics.totalInteres.toLocaleString()}</div>
          </div>
        </div>

        {/* Filtros */}
        <div style={s.card}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
            <div>
              <label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block' }}>Filtrar por estado</label>
              <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} style={s.input}>
                <option value="">Todos los estados</option>
                <option value="nuevo">🆕 Nuevos</option>
                <option value="contactado">📞 Contactados</option>
                <option value="calificado">✅ Calificados</option>
                <option value="propuesta_enviada">📄 Propuesta Enviada</option>
                <option value="convertido">✅ Convertidos</option>
                <option value="perdido">❌ Perdidos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Formulario de Registro */}
        <div style={s.card}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '4px', height: '24px', backgroundColor: '#3b82f6', borderRadius: '2px' }}></div> Capturar Nuevo Lead
          </h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              <div>
                <label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block' }}>Nombre *</label>
                <input type="text" placeholder="Ej. Ana" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} required style={s.input} />
              </div>
              <div>
                <label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block' }}>Apellido *</label>
                <input type="text" placeholder="Ej. González" value={formData.apellido} onChange={(e) => setFormData({...formData, apellido: e.target.value})} required style={s.input} />
              </div>
              <div>
                <label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block' }}>Teléfono *</label>
                <input type="tel" placeholder="555-1234" value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})} required style={s.input} />
              </div>
              <div>
                <label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block' }}>Email</label>
                <input type="email" placeholder="email@ejemplo.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} style={s.input} />
              </div>
              <div>
                <label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block' }}>Origen</label>
                <select value={formData.origen} onChange={(e) => setFormData({...formData, origen: e.target.value})} style={s.input}>
                  <option value="facebook">📘 Facebook</option>
                  <option value="instagram">📷 Instagram</option>
                  <option value="google">🔍 Google</option>
                  <option value="referido">👥 Referido</option>
                  <option value="walk_in">🚶 Walk-in</option>
                  <option value="telefono">📞 Teléfono</option>
                  <option value="otro">📌 Otro</option>
                </select>
              </div>
              <div>
                <label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block' }}>Monto Interés</label>
                <input type="number" placeholder="0.00" value={formData.monto_interes} onChange={(e) => setFormData({...formData, monto_interes: e.target.value})} style={s.input} />
              </div>
              <div>
                <label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block' }}>Prioridad</label>
                <select value={formData.prioridad} onChange={(e) => setFormData({...formData, prioridad: e.target.value})} style={s.input}>
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
              <div>
                <label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block' }}>Propósito</label>
                <input type="text" placeholder="¿Para qué quiere el préstamo?" value={formData.proposito} onChange={(e) => setFormData({...formData, proposito: e.target.value})} style={s.input} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block' }}>Notas</label>
                <textarea placeholder="Información adicional..." value={formData.notas} onChange={(e) => setFormData({...formData, notas: e.target.value})} style={{ ...s.input, minHeight: '80px', resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #1f2937' }}>
              <button type="reset" onClick={() => setFormData({ nombre: '', apellido: '', telefono: '', email: '', origen: 'facebook', fuente_detalle: '', monto_interes: '', proposito: '', prioridad: 'media', notas: '' })} style={s.btnCancel}>Limpiar</button>
              <button type="submit" disabled={formLoading} style={s.btn}>{formLoading ? '⏳ Registrando...' : '🎯 Capturar Lead'}</button>
            </div>
          </form>
        </div>

        {/* Lista de Leads */}
        <div style={{ ...s.card, marginTop: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px' }}>Leads Registrados</h2>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>⏳ Cargando leads...</div>
          ) : leads.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>📋 No hay leads registrados aún</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {leads.map((lead: any) => (
                <div key={lead.id} style={{ backgroundColor: '#0b0f19', border: '1px solid #1f2937', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '40px', height: '40px', backgroundColor: '#1e40af', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🎯</div>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '16px' }}>{lead.nombre} {lead.apellido}</div>
                        <div style={{ fontSize: '13px', color: '#9ca3af', display: 'flex', gap: '12px' }}>
                          <span>📞 {lead.telefono}</span>
                          {lead.email && <span>✉ {lead.email}</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {getEstadoBadge(lead.estado)}
                      {getPrioridadBadge(lead.prioridad)}
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', paddingTop: '12px', borderTop: '1px solid #1f2937', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>Origen</div>
                      <div style={{ fontWeight: '600' }}>{getOrigenIcon(lead.origen)} {lead.origen}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>Monto Interés</div>
                      <div style={{ fontWeight: '600', color: '#fbbf24' }}>${Number(lead.monto_interes || 0).toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>Propósito</div>
                      <div style={{ fontWeight: '600' }}>{lead.proposito || '-'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>Creado</div>
                      <div style={{ fontWeight: '600' }}>{new Date(lead.created_at).toLocaleDateString('es-MX')}</div>
                    </div>
                  </div>

                  {lead.notas && (
                    <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '12px', padding: '8px', backgroundColor: '#030712', borderRadius: '4px' }}>
                      📝 {lead.notas}
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <select 
                      value={lead.estado} 
                      onChange={(e) => handleCambiarEstado(lead.id, e.target.value)}
                      style={{ ...s.input, width: 'auto', padding: '8px 16px', fontSize: '13px', marginBottom: 0 }}
                    >
                      <option value="nuevo">🆕 Nuevo</option>
                      <option value="contactado">📞 Contactado</option>
                      <option value="calificado">✅ Calificado</option>
                      <option value="propuesta_enviada">📄 Propuesta Enviada</option>
                      <option value="convertido">✅ Convertido</option>
                      <option value="perdido">❌ Perdido</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
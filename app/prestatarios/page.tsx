'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function PrestatariosPage() {
  const [loading, setLoading] = useState(true)
  const [prestatarios, setPrestatarios] = useState<any[]>([])
  const [metrics, setMetrics] = useState({ total: 0, activos: 0, morosos: 0 })
  const [search, setSearch] = useState('')
  const [filterEstado, setFilterEstado] = useState('')
  const [formData, setFormData] = useState({ nombre: '', apellido: '', telefono: '', email: '', direccion: '', identificacion: '', estado: 'activo', limite_credito: '', notas: '' })
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => { loadData() }, [search, filterEstado])

  const loadData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (filterEstado) params.append('estado', filterEstado)
      const res = await fetch(`/api/prestatarios?${params}`)
      const json = await res.json()
      if (json.success) { setPrestatarios(json.prestatarios || []); setMetrics(json.metrics || { total: 0, activos: 0, morosos: 0 }) }
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    try {
      const res = await fetch('/api/prestatarios', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
      const result = await res.json()
      if (result.success) {
        alert('✅ Cliente registrado')
        setFormData({ nombre: '', apellido: '', telefono: '', email: '', direccion: '', identificacion: '', estado: 'activo', limite_credito: '', notas: '' })
        loadData()
      } else { alert('❌ ' + result.error) }
    } catch (err: any) { alert('Error: ' + err.message) } finally { setFormLoading(false) }
  }

  const s = {
    page: { display: 'flex', minHeight: '100vh', backgroundColor: '#0b0f19', fontFamily: 'system-ui, sans-serif', color: 'white' },
    sidebar: { width: '260px', backgroundColor: '#111827', borderRight: '1px solid #1f2937', position: 'fixed' as const, height: '100vh', zIndex: 10 },
    main: { marginLeft: '260px', flex: 1, padding: '24px' },
    card: { backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '28px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', marginBottom: '24px' },
    input: { width: '100%', padding: '14px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: '15px', boxSizing: 'border-box' as const, outline: 'none', marginBottom: '16px' },
    btn: { padding: '14px 32px', background: 'linear-gradient(135deg, #2563eb, #3b82f6)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '15px' },
    btnCancel: { padding: '14px 28px', backgroundColor: '#1f2937', color: '#9ca3af', border: '1px solid #374151', borderRadius: '8px', cursor: 'pointer', fontSize: '15px' },
    badge: { padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: '600' }
  }

  const getEstadoBadge = (estado: string) => {
    const styles: Record<string, any> = { activo: { backgroundColor: '#065f46', color: '#34d399' }, inactivo: { backgroundColor: '#374151', color: '#9ca3af' }, moroso: { backgroundColor: '#7f1d1d', color: '#f87171' } }
    return <span style={{ ...s.badge, ...styles[estado] }}>{estado.toUpperCase()}</span>
  }

  return (
    <div style={s.page}>
      <aside style={s.sidebar}>
        <div style={{ padding: '20px', borderBottom: '1px solid #1f2937' }}><div style={{ fontWeight: 'bold', fontSize: '16px' }}>PrestaLista Pro</div></div>
        <nav style={{ padding: '16px 12px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}>📊 Dashboard</Link>
          <Link href="/capital" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}>💰 Capital</Link>
          <Link href="/leads" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}>🎯 Mis Leads</Link>
          <Link href="/distribuidores" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}>🤝 Distribuidores</Link>
          <Link href="/prestatarios" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', borderRadius: '8px', marginBottom: '4px', fontWeight: '600', border: '1px solid rgba(59, 130, 246, 0.3)', textDecoration: 'none' }}>👤 Prestatarios</Link>
          <Link href="/prestamos" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}>📄 Préstamos</Link>
        </nav>
      </aside>

      <main style={s.main}>
        <div style={{ background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 20px rgba(37, 99, 235, 0.25)' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '6px' }}>Gestión de Prestatarios</h1>
          <p style={{ color: '#e0e7ff', fontSize: '14px' }}>Administra tus clientes</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
          <div style={{ ...s.card, marginBottom: 0 }}><div style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px' }}>Total Clientes</div><div style={{ fontSize: '28px', fontWeight: 'bold', color: '#60a5fa' }}>{metrics.total}</div></div>
          <div style={{ ...s.card, marginBottom: 0 }}><div style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px' }}>Activos</div><div style={{ fontSize: '28px', fontWeight: 'bold', color: '#34d399' }}>{metrics.activos}</div></div>
          <div style={{ ...s.card, marginBottom: 0 }}><div style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px' }}>Morosos</div><div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f87171' }}>{metrics.morosos}</div></div>
        </div>

        <div style={s.card}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px' }}>🔍 Buscar / Filtrar</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
            <input type="text" placeholder="Buscar por nombre, teléfono..." value={search} onChange={(e) => setSearch(e.target.value)} style={s.input} />
            <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} style={s.input}><option value="">Todos los estados</option><option value="activo">✅ Activos</option><option value="inactivo">⏸ Inactivos</option><option value="moroso">⚠ Morosos</option></select>
          </div>
        </div>

        <div style={s.card}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px' }}>Registrar Nuevo Cliente</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              <div><label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block' }}>Nombre *</label><input type="text" placeholder="Ej. Juan" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} required style={s.input} /></div>
              <div><label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block' }}>Apellido *</label><input type="text" placeholder="Ej. Pérez" value={formData.apellido} onChange={(e) => setFormData({...formData, apellido: e.target.value})} required style={s.input} /></div>
              <div><label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block' }}>Teléfono</label><input type="tel" placeholder="555-1234" value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})} style={s.input} /></div>
              <div><label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block' }}>Email</label><input type="email" placeholder="email@ejemplo.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} style={s.input} /></div>
              <div><label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block' }}>Identificación</label><input type="text" placeholder="INE/DNI" value={formData.identificacion} onChange={(e) => setFormData({...formData, identificacion: e.target.value})} style={s.input} /></div>
              <div><label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block' }}>Límite de Crédito</label><input type="number" placeholder="0.00" value={formData.limite_credito} onChange={(e) => setFormData({...formData, limite_credito: e.target.value})} style={s.input} /></div>
              <div><label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block' }}>Estado</label><select value={formData.estado} onChange={(e) => setFormData({...formData, estado: e.target.value})} style={s.input}><option value="activo">Activo</option><option value="inactivo">Inactivo</option><option value="moroso">Moroso</option></select></div>
              <div><label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block' }}>Dirección</label><input type="text" placeholder="Calle..." value={formData.direccion} onChange={(e) => setFormData({...formData, direccion: e.target.value})} style={s.input} /></div>
              <div style={{ gridColumn: '1 / -1' }}><label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block' }}>Notas</label><textarea placeholder="Notas..." value={formData.notas} onChange={(e) => setFormData({...formData, notas: e.target.value})} style={{ ...s.input, minHeight: '80px', resize: 'vertical' }} /></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #1f2937' }}>
              <button type="reset" onClick={() => setFormData({ nombre: '', apellido: '', telefono: '', email: '', direccion: '', identificacion: '', estado: 'activo', limite_credito: '', notas: '' })} style={s.btnCancel}>Limpiar</button>
              <button type="submit" disabled={formLoading} style={s.btn}>{formLoading ? '⏳ Registrando...' : '💾 Registrar Cliente'}</button>
            </div>
          </form>
        </div>

        <div style={{ ...s.card, marginTop: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px' }}>Clientes Registrados</h2>
          {loading ? <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>⏳ Cargando...</div> : prestatarios.length === 0 ? <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>📋 No hay clientes registrados</div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {prestatarios.map((p: any) => (
                <div key={p.id} style={{ backgroundColor: '#0b0f19', border: '1px solid #1f2937', borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '40px', height: '40px', backgroundColor: '#1e40af', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>👤</div>
                    <div><div style={{ fontWeight: '600', fontSize: '16px' }}>{p.nombre} {p.apellido}</div><div style={{ fontSize: '13px', color: '#9ca3af', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>{p.telefono && <span>📞 {p.telefono}</span>}{p.identificacion && <span>🆔 {p.identificacion}</span>}{p.limite_credito && <span>💰 Límite: ${Number(p.limite_credito).toLocaleString()}</span>}</div></div>
                  </div>
                  <div style={{ textAlign: 'right' }}>{getEstadoBadge(p.estado)}<div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{new Date(p.created_at).toLocaleDateString('es-MX')}</div></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
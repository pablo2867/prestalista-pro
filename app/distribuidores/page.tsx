'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function DistribuidoresPage() {
  const [loading, setLoading] = useState(true)
  const [distribuidores, setDistribuidores] = useState<any[]>([])
  const [formData, setFormData] = useState({ nombre: '', telefono: '', email: '', comision: '' })
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/distributors')
      const json = await res.json()
      if (json.success) setDistribuidores(json.data || [])
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    try {
      const res = await fetch('/api/distributors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
      const result = await res.json()
      if (result.success) {
        alert('✅ Distribuidor registrado')
        setFormData({ nombre: '', telefono: '', email: '', comision: '' })
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

  return (
    <div style={s.page}>
      <aside style={s.sidebar}>
        <div style={{ padding: '20px', borderBottom: '1px solid #1f2937' }}><div style={{ fontWeight: 'bold', fontSize: '16px' }}>PrestaLista Pro</div></div>
        <nav style={{ padding: '16px 12px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}>📊 Dashboard</Link>
          <Link href="/capital" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}>💰 Capital</Link>
          <Link href="/leads" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}>🎯 Mis Leads</Link>
          <Link href="/distribuidores" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', borderRadius: '8px', marginBottom: '4px', fontWeight: '600', border: '1px solid rgba(59, 130, 246, 0.3)', textDecoration: 'none' }}>🤝 Distribuidores</Link>
          <Link href="/prestatarios" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}>👤 Prestatarios</Link>
          <Link href="/prestamos" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}>📄 Préstamos</Link>
        </nav>
      </aside>

      <main style={s.main}>
        <div style={{ background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 20px rgba(37, 99, 235, 0.25)' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '6px' }}>Gestión de Distribuidores</h1>
          <p style={{ color: '#e0e7ff', fontSize: '14px' }}>Administra tu red de agentes</p>
        </div>

        <div style={s.card}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px' }}>🤝 Registrar Nuevo Distribuidor</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              <div><label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block' }}>Nombre Completo *</label><input type="text" placeholder="Ej. Carlos Mendoza" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} required style={s.input} /></div>
              <div><label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block' }}>Teléfono</label><input type="tel" placeholder="555-1234" value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})} style={s.input} /></div>
              <div><label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block' }}>Email</label><input type="email" placeholder="email@ejemplo.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} style={s.input} /></div>
              <div><label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block' }}>Comisión (%)</label><input type="number" placeholder="10" value={formData.comision} onChange={(e) => setFormData({...formData, comision: e.target.value})} style={s.input} /></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #1f2937' }}>
              <button type="reset" onClick={() => setFormData({ nombre: '', telefono: '', email: '', comision: '' })} style={s.btnCancel}>Limpiar</button>
              <button type="submit" disabled={formLoading} style={s.btn}>{formLoading ? '⏳ Registrando...' : '💾 Registrar Distribuidor'}</button>
            </div>
          </form>
        </div>

        <div style={s.card}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px' }}>Distribuidores Registrados</h2>
          {loading ? <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>⏳ Cargando...</div> : distribuidores.length === 0 ? <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>📋 No hay distribuidores registrados</div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {distribuidores.map((d: any) => (
                <div key={d.id} style={{ backgroundColor: '#0b0f19', border: '1px solid #1f2937', borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '40px', height: '40px', backgroundColor: '#1e40af', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🤝</div>
                    <div><div style={{ fontWeight: '600', fontSize: '16px' }}>{d.nombre}</div><div style={{ fontSize: '13px', color: '#9ca3af' }}>{d.telefono && <span>📞 {d.telefono}</span>} {d.email && <span>• ✉ {d.email}</span>}</div></div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fbbf24' }}>{d.comision ? d.comision + '%' : '0%'}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Comisión</div>
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
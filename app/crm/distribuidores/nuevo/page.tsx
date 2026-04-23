'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Distribuidor = {
  id: string
  nombre: string
  email: string
  telefono?: string
  comision_porcentaje: number
  capital_asignado: number
  capital_disponible: number
  estado: string
  created_at: string
}

export default function GestionDistribuidoresPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [distribuidores, setDistribuidores] = useState<Distribuidor[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [formData, setFormData] = useState({ nombre: '', email: '', telefono: '', comision: '', capitalInicial: '' })
  const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value })

  // Cargar datos al iniciar
  useEffect(() => {
    cargarDistribuidores()
  }, [])

  const cargarDistribuidores = async () => {
    setLoadingData(true)
    try {
      const res = await fetch('/api/distributors')
      const result = await res.json()
      if (result.success) setDistribuidores(result.data || [])
    } catch (err) {
      console.error('Error cargando datos:', err)
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault(); setLoading(true)
    try {
      const res = await fetch('/api/distributors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
      const result = await res.json()
      if (result.success) {
        alert('✅ Distribuidor registrado exitosamente')
        setFormData({ nombre: '', email: '', telefono: '', comision: '', capitalInicial: '' })
        cargarDistribuidores()
      } else {
        alert('❌ ' + result.error)
      }
    } catch (err: any) { alert('Error: ' + err.message) }
    finally { setLoading(false) }
  }

  // Función Exportar CSV
  const exportarCSV = () => {
    if (distribuidores.length === 0) return alert('No hay datos para exportar')
    
    const headers = ['Nombre', 'Email', 'Teléfono', 'Comisión %', 'Capital Asignado', 'Capital Disponible', 'Estado', 'Fecha Registro']
    const csvRows = [
      headers.join(','),
      ...distribuidores.map(d => [
        `"${d.nombre}"`, d.email, d.telefono || '', 
        d.comision_porcentaje, d.capital_asignado, d.capital_disponible, 
        d.estado, new Date(d.created_at).toLocaleDateString()
      ].join(','))
    ]
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `distribuidores_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Función Imprimir
  const imprimirPagina = () => {
    window.print()
  }

  // Cálculos de métricas
  const totalDistribuidores = distribuidores.length
  const capitalAsignadoTotal = distribuidores.reduce((sum, d) => sum + (Number(d.capital_asignado) || 0), 0)
  const capitalDisponibleTotal = distribuidores.reduce((sum, d) => sum + (Number(d.capital_disponible) || 0), 0)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0b0f19', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '260px', backgroundColor: '#111827', borderRight: '1px solid #1f2937', display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh', zIndex: 10 }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #1f2937' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px', color: 'white' }}>PL</div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '16px', color: 'white' }}>PrestaLista Pro</div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>CRM de Préstamos</div>
            </div>
          </div>
        </div>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1f2937' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', backgroundColor: '#374151', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white' }}>A</div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '500', color: 'white' }}>admin</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>admin@prestalista.com</div>
            </div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          <a style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', color: '#9ca3af', textDecoration: 'none', borderRadius: '8px', marginBottom: '4px', fontSize: '14px' }}>📊 Dashboard</a>
          <a style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', backgroundColor: '#1f2937', color: 'white', textDecoration: 'none', borderRadius: '8px', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>💰 Capital</a>
          <a style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', color: '#9ca3af', textDecoration: 'none', borderRadius: '8px', marginBottom: '4px', fontSize: '14px' }}>👥 Mis Leads</a>
          <a style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', color: '#9ca3af', textDecoration: 'none', borderRadius: '8px', marginBottom: '4px', fontSize: '14px' }}>👤 Prestatarios</a>
          <a style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', textDecoration: 'none', borderRadius: '8px', marginBottom: '4px', fontSize: '14px', fontWeight: '600', border: '1px solid rgba(59, 130, 246, 0.3)' }}>🤝 Distribuidores</a>
          <a style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', color: '#9ca3af', textDecoration: 'none', borderRadius: '8px', marginBottom: '4px', fontSize: '14px' }}>📄 Préstamos</a>
        </nav>
        <div style={{ padding: '16px 12px', borderTop: '1px solid #1f2937' }}>
          <a style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', color: '#ef4444', textDecoration: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>🔒 Cerrar Sesión</a>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main style={{ marginLeft: '260px', flex: 1, padding: '24px', backgroundColor: '#0b0f19' }}>
        
        {/* HEADER AZUL CON BOTONES DE ACCIÓN */}
        <div style={{ background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', borderRadius: '12px', padding: '24px 28px', marginBottom: '24px', boxShadow: '0 4px 20px rgba(37, 99, 235, 0.25)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '6px' }}>Gestión de Distribuidores</h1>
              <p style={{ color: '#e0e7ff', fontSize: '14px', margin: 0 }}>Administra el capital y red de distribuidores</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={exportarCSV} style={{ padding: '10px 18px', backgroundColor: 'rgba(139, 92, 246, 0.8)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                📥 Exportar CSV
              </button>
              <button onClick={imprimirPagina} style={{ padding: '10px 18px', backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.3)', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🖨️ Imprimir
              </button>
            </div>
          </div>
        </div>

        {/* TARJETAS DE MÉTRICAS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
          
          {/* Métrica 1 */}
          <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '8px' }}>Total Distribuidores</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>{loadingData ? '...' : totalDistribuidores}</div>
          </div>

          {/* Métrica 2 */}
          <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '8px' }}>Capital Asignado</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#60a5fa' }}>{loadingData ? '...' : `$${capitalAsignadoTotal.toLocaleString()}`}</div>
          </div>

          {/* Métrica 3 */}
          <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '8px' }}>Capital Disponible</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#34d399' }}>{loadingData ? '...' : `$${capitalDisponibleTotal.toLocaleString()}`}</div>
          </div>

        </div>

        {/* FORMULARIO DE REGISTRO */}
        <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '28px', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'white', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '4px', height: '24px', backgroundColor: '#3b82f6', borderRadius: '2px' }}></div>
            Registrar Nuevo Distribuidor
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', color: '#9ca3af', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Nombre Completo *</label>
                <input name="nombre" placeholder="Ej. Juan Pérez" value={formData.nombre} onChange={handleChange} required style={{ width: '100%', padding: '14px 16px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: '15px', boxSizing: 'border-box', outline: 'none', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)' }} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', color: '#9ca3af', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Email *</label>
                <input name="email" type="email" placeholder="juan@empresa.com" value={formData.email} onChange={handleChange} required style={{ width: '100%', padding: '14px 16px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: '15px', boxSizing: 'border-box', outline: 'none', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)' }} />
              </div>
              <div>
                <label style={{ display: 'block', color: '#9ca3af', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Teléfono</label>
                <input name="telefono" placeholder="+52 55 1234 5678" value={formData.telefono} onChange={handleChange} style={{ width: '100%', padding: '14px 16px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: '15px', boxSizing: 'border-box', outline: 'none', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)' }} />
              </div>
              <div>
                <label style={{ display: 'block', color: '#9ca3af', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Comisión (%) *</label>
                <input name="comision" type="number" placeholder="10" value={formData.comision} onChange={handleChange} required style={{ width: '100%', padding: '14px 16px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: '15px', boxSizing: 'border-box', outline: 'none', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)' }} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', color: '#9ca3af', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Capital Inicial Asignado *</label>
                <input name="capitalInicial" type="number" placeholder="50000" value={formData.capitalInicial} onChange={handleChange} required style={{ width: '100%', padding: '14px 16px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: '15px', boxSizing: 'border-box', outline: 'none', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #1f2937' }}>
              <button type="reset" style={{ padding: '14px 28px', backgroundColor: '#1f2937', color: '#9ca3af', border: '1px solid #374151', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: '500' }}>Limpiar</button>
              <button type="submit" disabled={loading} style={{ padding: '14px 32px', background: 'linear-gradient(135deg, #2563eb, #3b82f6)', color: 'white', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '15px', opacity: loading ? 0.7 : 1, boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)' }}>{loading ? '⏳ Registrando...' : '💾 Registrar Distribuidor'}</button>
            </div>
          </form>
        </div>

        {/* SECCIÓN HISTORIAL / LISTADO */}
        <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '28px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #1f2937' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '4px', height: '24px', backgroundColor: '#3b82f6', borderRadius: '2px' }}></div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'white', margin: 0 }}>Historial de Distribuidores</h2>
            </div>
            <div style={{ fontSize: '13px', color: '#9ca3af' }}>Total: {distribuidores.length} registros</div>
          </div>

          {loadingData ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>Cargando distribuidores...</div>
          ) : distribuidores.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
              <p>No hay distribuidores registrados aún</p>
              <p style={{ fontSize: '13px' }}>Registra tu primer agente usando el formulario de arriba</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {distribuidores.map((dist, index) => (
                <div key={dist.id} style={{ 
                  backgroundColor: '#0b0f19', 
                  border: '1px solid #1f2937', 
                  borderRadius: '8px', 
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      backgroundColor: '#1f2937', 
                      borderRadius: '8px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '20px'
                    }}>
                      🤝
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: 'white', marginBottom: '4px' }}>{dist.nombre}</div>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>{dist.email}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#34d399', marginBottom: '4px' }}>
                      ${Number(dist.capital_asignado).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                      {new Date(dist.created_at).toLocaleDateString('es-MX', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
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
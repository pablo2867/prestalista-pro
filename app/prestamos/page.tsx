// app/prestamos/page.tsx - BOTÓN HAMBURGUESA POSICIONADO CORRECTAMENTE
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useGlobalContext } from '../lib/GlobalContext'
import { useAuth } from '../lib/AuthContext'
import ProtectedRoute from '../lib/ProtectedRoute'

export default function PrestamosPage() {
  const { user, signOut, isAdmin, isDistributor, isCollector } = useAuth()
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [prestamos, setPrestamos] = useState<any[]>([])
  const [metrics, setMetrics] = useState({ total: 0, activos: 0, totalPrestado: 0, totalPorCobrar: 0 })
  const [filterEstado, setFilterEstado] = useState('')
  const [prestatarios, setPrestatarios] = useState<any[]>([])
  const [distribuidores, setDistribuidores] = useState<any[]>([])
  
  const [formData, setFormData] = useState({ 
    prestatario_id: '', distribuidor_id: '', monto_principal: '', 
    tasa_interes_mensual: '10', plazo_meses: '6', cuota_inicial: '0', 
    notas: '', garantia: '' 
  })
  
  const [formLoading, setFormLoading] = useState(false)
  const [calculo, setCalculo] = useState({ montoTotal: 0, cuotaMensual: 0, interesTotal: 0 })
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPrestamo, setSelectedPrestamo] = useState<any>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentNotas, setPaymentNotas] = useState('')

  const { triggerPrestamosUpdate, triggerMovimientosUpdate } = useGlobalContext()

  useEffect(() => { loadData(); loadPrestatarios(); loadDistribuidores() }, [filterEstado])

  const loadData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterEstado) params.append('estado', filterEstado)
      const res = await fetch(`/api/prestamos?${params}`)
      const json = await res.json()
      if (json.success) { 
        setPrestamos(json.prestamos || [])
        setMetrics(json.metrics || { total: 0, activos: 0, totalPrestado: 0, totalPorCobrar: 0 })
      }
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const loadPrestatarios = async () => { 
    try { const res = await fetch('/api/prestatarios'); const json = await res.json(); if (json.success) setPrestatarios(json.prestatarios || []) } 
    catch (err) { console.error(err) } 
  }
  const loadDistribuidores = async () => { 
    try { const res = await fetch('/api/distributors'); const json = await res.json(); if (json.success) setDistribuidores(json.data || []) } 
    catch (err) { console.error(err) } 
  }

  useEffect(() => {
    const monto = parseFloat(formData.monto_principal) || 0
    const tasa = parseFloat(formData.tasa_interes_mensual) || 0
    const plazo = parseInt(formData.plazo_meses) || 0
    const inicial = parseFloat(formData.cuota_inicial) || 0
    if (monto > 0 && tasa > 0 && plazo > 0) {
      const interesTotal = monto * (tasa / 100) * plazo
      const montoTotal = monto + interesTotal
      const cuotaMensual = (montoTotal - inicial) / plazo
      setCalculo({ 
        montoTotal: Math.round(montoTotal * 100) / 100, 
        cuotaMensual: Math.round(cuotaMensual * 100) / 100, 
        interesTotal: Math.round(interesTotal * 100) / 100 
      })
    } else { setCalculo({ montoTotal: 0, cuotaMensual: 0, interesTotal: 0 }) }
  }, [formData.monto_principal, formData.tasa_interes_mensual, formData.plazo_meses, formData.cuota_inicial])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.prestatario_id) return alert('👤 Selecciona un prestatario')
    const monto = parseFloat(formData.monto_principal)
    if (isNaN(monto) || monto <= 0) return alert('💰 El monto debe ser mayor a 0')
    const tasa = parseFloat(formData.tasa_interes_mensual)
    if (isNaN(tasa) || tasa < 0) return alert('📉 La tasa no puede ser negativa')
    const plazo = parseInt(formData.plazo_meses)
    if (isNaN(plazo) || plazo <= 0) return alert('📅 El plazo debe ser mayor a 0')
    const inicial = parseFloat(formData.cuota_inicial) || 0
    if (inicial > monto) return alert('⚠️ La cuota inicial no puede ser mayor al monto')

    setFormLoading(true)
    try {
      const res = await fetch('/api/prestamos', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(formData) 
      })
      const result = await res.json()
      if (result.success) { 
        alert('✅ Préstamo registrado')
        setFormData({ prestatario_id: '', distribuidor_id: '', monto_principal: '', tasa_interes_mensual: '10', plazo_meses: '6', cuota_inicial: '0', notas: '', garantia: '' })
        loadData() 
      } else { alert('❌ ' + result.error) }
    } catch (err: any) { alert('Error: ' + err.message) } finally { setFormLoading(false) }
  }

  const handleRegistrarPago = (prestamo: any) => {
    setSelectedPrestamo(prestamo)
    setPaymentAmount('')
    setPaymentNotas('')
    setShowPaymentModal(true)
  }

  const confirmarPago = async () => {
    if (!selectedPrestamo || !paymentAmount) return
    if (parseFloat(paymentAmount) > selectedPrestamo.saldo_pendiente) {
      alert('❌ El monto no puede superar el saldo pendiente')
      return
    }
    try {
      const res = await fetch('/api/pagos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prestamo_id: selectedPrestamo.id,
          monto: parseFloat(paymentAmount),
          tipo: 'regular',
          notas: paymentNotas || null
        })
      })
      const result = await res.json()
      if (result.success) {
        alert('✅ Pago registrado')
        setShowPaymentModal(false)
        loadData()
        triggerPrestamosUpdate()
        triggerMovimientosUpdate()
      } else { alert('❌ ' + result.error) }
    } catch (err: any) { alert('Error: ' + err.message) }
  }

  const exportarPrestamos = () => {
    const BOM = '\uFEFF'
    const headers = 'Cliente;Fecha Inicio;Monto Principal;Monto Total;Cuota Mensual;Saldo Pendiente;Estado;Vencimiento'
    const rows = prestamos.map((p: any) => [
      `${p.prestatario?.nombre || ''} ${p.prestatario?.apellido || ''}`,
      new Date(p.fecha_inicio).toLocaleDateString('es-MX'),
      Number(p.monto_principal).toFixed(2),
      Number(p.monto_total).toFixed(2),
      Number(p.cuota_mensual).toFixed(2),
      Number(p.saldo_pendiente).toFixed(2),
      p.estado,
      new Date(p.fecha_vencimiento).toLocaleDateString('es-MX')
    ].join(';'))
    const csvContent = BOM + [headers, ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `prestamos_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
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

  const getEstadoBadge = (estado: string) => {
    const styles: Record<string, any> = { 
      activo: { backgroundColor: '#065f46', color: '#34d399' }, 
      pagado: { backgroundColor: '#1e40af', color: '#60a5fa' }, 
      vencido: { backgroundColor: '#7f1d1d', color: '#f87171' }, 
      cancelado: { backgroundColor: '#374151', color: '#9ca3af' } 
    }
    return <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: '600', ...styles[estado] }}>{estado.toUpperCase()}</span>
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0b0f19', color: 'white' }}>⏳ Cargando...</div>

  return (
    <ProtectedRoute>
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0b0f19', fontFamily: 'system-ui', color: 'white' }}>
        
        {/* 📱 CSS Responsive */}
        <style>{`
          @media (max-width: 768px) {
            .sidebar { 
              transform: translateX(-100%) !important; 
              transition: transform 0.3s ease; 
            }
            .sidebar.open { 
              transform: translateX(0) !important; 
            }
            .main { 
              margin-left: 0 !important; 
              padding: 16px !important; 
            }
            .grid-form { 
              grid-template-columns: 1fr !important; 
            }
            .grid-stats { 
              grid-template-columns: 1fr 1fr !important; 
              gap: 12px !important; 
            }
            .header-content { 
              flex-direction: column !important; 
              align-items: flex-start !important; 
            }
            .mobile-menu-btn { 
              display: flex !important; 
            }
            .overlay { 
              display: block !important; 
            }
          }
          @media (min-width: 769px) {
            .overlay { 
              display: none !important; 
            }
            .mobile-menu-btn { 
              display: none !important; 
            }
          }
          @media print { 
            aside, .no-print, .overlay { display: none !important; } 
            main { margin-left: 0 !important; padding: 20px !important; } 
            body { background: white !important; color: black !important; } 
            * { color: black !important; background: white !important; } 
          }
        `}</style>

        {/* Overlay para cerrar sidebar en móvil */}
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
            <Link href="/prestamos" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', gap: 12, padding: 12, background: 'rgba(59,130,246,0.15)', color: '#60a5fa', borderRadius: 8, marginBottom: 4, textDecoration: 'none', fontWeight: 600 }}>📄 Préstamos</Link>
            {(isAdmin() || isCollector()) && <Link href="/movimientos" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', gap: 12, padding: 10, color: '#9ca3af', borderRadius: 8, marginBottom: 4, textDecoration: 'none' }}>📋 Movimientos</Link>}
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
          
          {/* 🔴 BOTÓN HAMBURGUESA - POSICIÓN CORREGIDA (top: 70px) */}
          <button 
            className="mobile-menu-btn" 
            onClick={() => setSidebarOpen(true)} 
            style={{ 
              display: 'none',
              position: 'fixed', 
              top: '70px', // ⬅️ BAJADO PARA NO TAPAR LA BÚSQUEDA
              left: '16px', 
              zIndex: 100, 
              padding: '10px 14px', 
              backgroundColor: '#2563eb', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              fontSize: '20px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
            }}
          >
            ☰
          </button>
          
          <div className="header-content" style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <div style={{ marginBottom: 16 }}>
              <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0 }}>Gestión de Préstamos</h1>
              <p style={{ margin: '6px 0 0', opacity: 0.9 }}>Administra préstamos, intereses y cobros</p>
            </div>
            <div style={{ display: 'flex', gap: 12, width: '100%' }}>
              <button onClick={() => window.print()} className="no-print" style={{ flex: 1, padding: '12px 20px', backgroundColor: '#1e40af', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>🖨️ Imprimir</button>
              <button onClick={exportarPrestamos} className="no-print" style={{ flex: 1, padding: '12px 20px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>📥 Exportar</button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 24 }}>
            <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 20 }}><div style={{color:'#9ca3af',fontSize:13,marginBottom:8}}>Total</div><div style={{fontSize:28,fontWeight:'bold',color:'#60a5fa'}}>{metrics.total}</div></div>
            <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 20 }}><div style={{color:'#9ca3af',fontSize:13,marginBottom:8}}>Activos</div><div style={{fontSize:28,fontWeight:'bold',color:'#34d399'}}>{metrics.activos}</div></div>
            <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 20 }}><div style={{color:'#9ca3af',fontSize:13,marginBottom:8}}>Prestado</div><div style={{fontSize:28,fontWeight:'bold',color:'#fbbf24'}}>${metrics.totalPrestado.toLocaleString()}</div></div>
            <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 20 }}><div style={{color:'#9ca3af',fontSize:13,marginBottom:8}}>Por Cobrar</div><div style={{fontSize:28,fontWeight:'bold',color:'#f87171'}}>${metrics.totalPorCobrar.toLocaleString()}</div></div>
          </div>

          {/* Formulario */}
          <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <h2 style={{ margin: '0 0 24px', fontSize: 18, fontWeight: 600 }}>📝 Nuevo Préstamo</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                <div style={{ gridColumn: '1 / -1' }}><label style={{ color: '#9ca3af', fontSize: 13, marginBottom: 8, display: 'block' }}>Prestatario *</label><select value={formData.prestatario_id} onChange={(e) => setFormData({...formData, prestatario_id: e.target.value})} required style={{ width: '100%', padding: '14px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: 16 }}><option value="">Seleccionar...</option>{prestatarios.map((p: any) => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}</select></div>
                <div><label style={{ color: '#9ca3af', fontSize: 13, marginBottom: 8, display: 'block' }}>Monto *</label><input type="number" placeholder="0.00" value={formData.monto_principal} onChange={(e) => setFormData({...formData, monto_principal: e.target.value})} required style={{ width: '100%', padding: '14px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: 16 }} /></div>
                <div><label style={{ color: '#9ca3af', fontSize: 13, marginBottom: 8, display: 'block' }}>Tasa Mensual % *</label><input type="number" step="0.01" placeholder="10" value={formData.tasa_interes_mensual} onChange={(e) => setFormData({...formData, tasa_interes_mensual: e.target.value})} required style={{ width: '100%', padding: '14px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: 16 }} /></div>
                <div><label style={{ color: '#9ca3af', fontSize: 13, marginBottom: 8, display: 'block' }}>Plazo (meses) *</label><input type="number" placeholder="6" value={formData.plazo_meses} onChange={(e) => setFormData({...formData, plazo_meses: e.target.value})} required style={{ width: '100%', padding: '14px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: 16 }} /></div>
                <div><label style={{ color: '#9ca3af', fontSize: 13, marginBottom: 8, display: 'block' }}>Cuota Inicial</label><input type="number" placeholder="0.00" value={formData.cuota_inicial} onChange={(e) => setFormData({...formData, cuota_inicial: e.target.value})} style={{ width: '100%', padding: '14px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: 16 }} /></div>
              </div>
              
              {calculo.montoTotal > 0 && (
                <div style={{ backgroundColor: '#030712', border: '1px solid #374151', borderRadius: 8, padding: 16, margin: '16px 0' }}>
                  <div className="grid-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    <div><div style={{ fontSize: 12, color: '#9ca3af' }}>Total a Pagar</div><div style={{ fontSize: 20, fontWeight: 'bold', color: '#fbbf24' }}>${calculo.montoTotal.toLocaleString()}</div></div>
                    <div><div style={{ fontSize: 12, color: '#9ca3af' }}>Interés Total</div><div style={{ fontSize: 20, fontWeight: 'bold', color: '#f87171' }}>${calculo.interesTotal.toLocaleString()}</div></div>
                    <div><div style={{ fontSize: 12, color: '#9ca3af' }}>Cuota Mensual</div><div style={{ fontSize: 20, fontWeight: 'bold', color: '#34d399' }}>${calculo.cuotaMensual.toLocaleString()}</div></div>
                  </div>
                </div>
              )}
              
              <div style={{ marginTop: 24 }}>
                <button type="submit" disabled={formLoading} style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #2563eb, #3b82f6)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: 16 }}>{formLoading ? '⏳...' : '💾 Registrar'}</button>
              </div>
            </form>
          </div>

          {/* Lista de Préstamos */}
          <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 24 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 600 }}>Préstamos Registrados</h2>
            <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} style={{ width: '100%', padding: '14px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: 16, marginBottom: 24 }}><option value="">Todos</option><option value="activo">✅ Activos</option><option value="pagado">✅ Pagados</option><option value="vencido">⚠ Vencidos</option></select>
            
            {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>⏳ Cargando...</div> : prestamos.length === 0 ? <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>📋 Sin préstamos</div> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {prestamos.map((p: any) => (
                  <div key={p.id} style={{ backgroundColor: '#0b0f19', border: '1px solid #1f2937', borderRadius: 12, padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, backgroundColor: '#1e40af', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📄</div>
                        <div><div style={{ fontWeight: 600 }}>{p.prestatario?.nombre} {p.prestatario?.apellido}</div><div style={{ fontSize: 12, color: '#9ca3af' }}>📅 {new Date(p.fecha_inicio).toLocaleDateString('es-MX')}</div></div>
                      </div>
                      {getEstadoBadge(p.estado)}
                    </div>
                    <div className="grid-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, paddingTop: 16, borderTop: '1px solid #1f2937' }}>
                      <div><div style={{ fontSize: 12, color: '#9ca3af' }}>Principal</div><div style={{ fontWeight: 600, color: '#60a5fa' }}>${Number(p.monto_principal).toLocaleString()}</div></div>
                      <div><div style={{ fontSize: 12, color: '#9ca3af' }}>Total</div><div style={{ fontWeight: 600, color: '#fbbf24' }}>${Number(p.monto_total).toLocaleString()}</div></div>
                      <div><div style={{ fontSize: 12, color: '#9ca3af' }}>Cuota</div><div style={{ fontWeight: 600, color: '#34d399' }}>${Number(p.cuota_mensual).toLocaleString()}</div></div>
                      <div><div style={{ fontSize: 12, color: '#9ca3af' }}>Saldo</div><div style={{ fontWeight: 600, color: p.saldo_pendiente > 0 ? '#f87171' : '#34d399' }}>${Number(p.saldo_pendiente).toLocaleString()}</div></div>
                    </div>
                    {p.estado === 'activo' && <button onClick={() => handleRegistrarPago(p)} style={{ marginTop: 16, width: '100%', padding: '14px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16, fontWeight: 600 }}>💵 Registrar Pago</button>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal de Pago */}
          {showPaymentModal && selectedPrestamo && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
              <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 24, maxWidth: 500, width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
                <h2 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 'bold' }}>💵 Registrar Pago</h2>
                <div style={{ marginBottom: 16, padding: 16, backgroundColor: '#030712', borderRadius: 8 }}>
                  <div style={{ fontSize: 14, color: '#9ca3af' }}>Prestatario</div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{selectedPrestamo.prestatario?.nombre} {selectedPrestamo.prestatario?.apellido}</div>
                </div>
                <div style={{ marginBottom: 16 }}><label style={{ color: '#9ca3af', fontSize: 13, marginBottom: 8, display: 'block' }}>Monto *</label><input type="number" placeholder="0.00" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} style={{ width: '100%', padding: '14px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: 16 }} /><div style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>Saldo pendiente: ${Number(selectedPrestamo.saldo_pendiente).toLocaleString()}</div></div>
                <div style={{ marginBottom: 24 }}><label style={{ color: '#9ca3af', fontSize: 13, marginBottom: 8, display: 'block' }}>Notas</label><textarea placeholder="Notas..." value={paymentNotas} onChange={(e) => setPaymentNotas(e.target.value)} style={{ width: '100%', padding: '14px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: 16, minHeight: 80, resize: 'vertical' }} /></div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={() => setShowPaymentModal(false)} style={{ flex: 1, padding: '14px', backgroundColor: '#1f2937', color: '#9ca3af', border: '1px solid #374151', borderRadius: '8px', cursor: 'pointer', fontSize: 16 }}>Cancelar</button>
                  <button onClick={confirmarPago} style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg, #2563eb, #3b82f6)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: 16 }}>💾 Confirmar</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}
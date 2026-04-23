// app/prestamos/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useGlobalContext } from '../lib/GlobalContext'

export default function PrestamosPage() {
  const [loading, setLoading] = useState(true)
  const [prestamos, setPrestamos] = useState<any[]>([])
  const [metrics, setMetrics] = useState({ total: 0, activos: 0, totalPrestado: 0, totalPorCobrar: 0 })
  const [filterEstado, setFilterEstado] = useState('')
  const [prestatarios, setPrestatarios] = useState<any[]>([])
  const [distribuidores, setDistribuidores] = useState<any[]>([])
  
  const [formData, setFormData] = useState({ 
    prestatario_id: '', distribuidor_id: '', monto_principal: '', 
    tasa_interes_mensual: '10', plazo_meses: '6', cuota_inicial: '', 
    notas: '', garantia: '' 
  })
  
  const [formLoading, setFormLoading] = useState(false)
  const [calculo, setCalculo] = useState({ montoTotal: 0, cuotaMensual: 0, interesTotal: 0 })

  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPrestamo, setSelectedPrestamo] = useState<any>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentNotas, setPaymentNotas] = useState('')
  const [prestamosPorVencer, setPrestamosPorVencer] = useState<any[]>([])

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
    if (prestamos.length === 0) return
    const hoy = new Date()
    const porVencer = prestamos.filter((p: any) => {
      if (p.estado !== 'activo') return false
      const vencimiento = new Date(p.fecha_vencimiento)
      const diffTime = vencimiento.getTime() - hoy.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays <= 7 && diffDays >= 0
    })
    setPrestamosPorVencer(porVencer)
  }, [prestamos])

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
    } else { 
      setCalculo({ montoTotal: 0, cuotaMensual: 0, interesTotal: 0 }) 
    }
  }, [formData.monto_principal, formData.tasa_interes_mensual, formData.plazo_meses, formData.cuota_inicial])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
        setFormData({ prestatario_id: '', distribuidor_id: '', monto_principal: '', tasa_interes_mensual: '10', plazo_meses: '6', cuota_inicial: '', notas: '', garantia: '' })
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
        alert('✅ Pago registrado exitosamente')
        setShowPaymentModal(false)
        loadData()
        triggerPrestamosUpdate()
        triggerMovimientosUpdate()
      } else {
        alert('❌ ' + result.error)
      }
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  // 📥 Función corregida: Cada préstamo es una FILA, los campos son COLUMNAS
  const exportarPrestamos = () => {
    const BOM = '\uFEFF'
    // 🔹 Headers como columnas
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

  const s = {
    page: { display: 'flex', minHeight: '100vh', backgroundColor: '#0b0f19', fontFamily: 'system-ui, sans-serif', color: 'white' },
    sidebar: { width: '260px', backgroundColor: '#111827', borderRight: '1px solid #1f2937', position: 'fixed' as const, height: '100vh', zIndex: 10 },
    main: { marginLeft: '260px', flex: 1, padding: '24px' },
    card: { backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '28px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', marginBottom: '24px' },
    input: { width: '100%', padding: '14px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: '15px', boxSizing: 'border-box' as const, outline: 'none', marginBottom: '16px' },
    btn: { padding: '14px 32px', background: 'linear-gradient(135deg, #2563eb, #3b82f6)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '15px' },
    btnCancel: { padding: '14px 28px', backgroundColor: '#1f2937', color: '#9ca3af', border: '1px solid #374151', borderRadius: '8px', cursor: 'pointer', fontSize: '15px' },
    badge: { padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: '600' },
    calcBox: { backgroundColor: '#030712', border: '1px solid #374151', borderRadius: '8px', padding: '16px', marginBottom: '16px' }
  }

  const getEstadoBadge = (estado: string) => {
    const styles: Record<string, any> = { 
      activo: { backgroundColor: '#065f46', color: '#34d399' }, 
      pagado: { backgroundColor: '#1e40af', color: '#60a5fa' }, 
      vencido: { backgroundColor: '#7f1d1d', color: '#f87171' }, 
      cancelado: { backgroundColor: '#374151', color: '#9ca3af' } 
    }
    return <span style={{ ...s.badge, ...styles[estado] }}>{estado.toUpperCase()}</span>
  }

  return (
    <div style={s.page}>
      <style>
        {`@media print {
          aside, .no-print { display: none !important; }
          main { margin-left: 0 !important; padding: 20px !important; }
          body { background: white !important; color: black !important; }
          * { color: black !important; background: white !important; }
          table, th, td, div { border: 1px solid #ccc !important; }
        }`}
      </style>

      <aside style={s.sidebar}>
        <div style={{ padding: '20px', borderBottom: '1px solid #1f2937' }}><div style={{ fontWeight: 'bold', fontSize: '16px' }}>PrestaLista Pro</div></div>
        <nav style={{ padding: '16px 12px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}>📊 Dashboard</Link>
          <Link href="/capital" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}>💰 Capital</Link>
          <Link href="/leads" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}>🎯 Mis Leads</Link>
          <Link href="/distribuidores" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}>🤝 Distribuidores</Link>
          <Link href="/prestatarios" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}>👤 Prestatarios</Link>
          <Link href="/prestamos" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', borderRadius: '8px', marginBottom: '4px', fontWeight: '600', border: '1px solid rgba(59, 130, 246, 0.3)', textDecoration: 'none' }}>📄 Préstamos</Link>
        </nav>
      </aside>

      <main style={s.main}>
        <div style={{ background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 20px rgba(37, 99, 235, 0.25)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '6px' }}>Gestión de Préstamos</h1>
              <p style={{ color: '#e0e7ff', fontSize: '14px' }}>Administra préstamos, intereses y cobros</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }} className="no-print">
              <button onClick={() => window.print()} style={{ padding: '10px 20px', backgroundColor: '#1e40af', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>🖨️ Imprimir</button>
              <button onClick={exportarPrestamos} style={{ padding: '10px 20px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>📥 Exportar Excel</button>
            </div>
          </div>
        </div>

        {prestamosPorVencer.length > 0 && (
          <div style={{ backgroundColor: '#451a03', border: '1px solid #b45309', color: '#fbbf24', padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>⚠️</span>
            <div>
              <strong>{prestamosPorVencer.length} préstamo(s) próximo(s) a vencer</strong>
              <p style={{ margin: 0, fontSize: '13px', opacity: 0.9 }}>Revisa los vencimientos en los próximos 7 días.</p>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
          <div style={{ ...s.card, marginBottom: 0 }}><div style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px' }}>Total Préstamos</div><div style={{ fontSize: '28px', fontWeight: 'bold', color: '#60a5fa' }}>{metrics.total}</div></div>
          <div style={{ ...s.card, marginBottom: 0 }}><div style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px' }}>Activos</div><div style={{ fontSize: '28px', fontWeight: 'bold', color: '#34d399' }}>{metrics.activos}</div></div>
          <div style={{ ...s.card, marginBottom: 0 }}><div style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px' }}>Total Prestado</div><div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fbbf24' }}>${metrics.totalPrestado.toLocaleString()}</div></div>
          <div style={{ ...s.card, marginBottom: 0 }}><div style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px' }}>Por Cobrar</div><div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f87171' }}>${metrics.totalPorCobrar.toLocaleString()}</div></div>
        </div>

        <div style={s.card}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px' }}>📝 Registrar Nuevo Préstamo</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              <div><label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block' }}>Prestatario *</label><select value={formData.prestatario_id} onChange={(e) => setFormData({...formData, prestatario_id: e.target.value})} required style={s.input}><option value="">Seleccionar cliente...</option>{prestatarios.map((p: any) => (<option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>))}</select></div>
              <div><label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block' }}>Distribuidor</label><select value={formData.distribuidor_id} onChange={(e) => setFormData({...formData, distribuidor_id: e.target.value})} style={s.input}><option value="">Sin asignar</option>{distribuidores.map((d: any) => (<option key={d.id} value={d.id}>{d.nombre}</option>))}</select></div>
              <div><label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block' }}>Monto Principal *</label><input type="number" placeholder="0.00" value={formData.monto_principal} onChange={(e) => setFormData({...formData, monto_principal: e.target.value})} required style={s.input} /></div>
              <div><label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block' }}>Tasa de Interés Mensual (%) *</label><input type="number" step="0.01" placeholder="10" value={formData.tasa_interes_mensual} onChange={(e) => setFormData({...formData, tasa_interes_mensual: e.target.value})} required style={s.input} /></div>
              <div><label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block' }}>Plazo (meses) *</label><input type="number" placeholder="6" value={formData.plazo_meses} onChange={(e) => setFormData({...formData, plazo_meses: e.target.value})} required style={s.input} /></div>
              <div><label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block' }}>Cuota Inicial</label><input type="number" placeholder="0.00" value={formData.cuota_inicial} onChange={(e) => setFormData({...formData, cuota_inicial: e.target.value})} style={s.input} /></div>
              <div style={{ gridColumn: '1 / -1' }}><label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block' }}>Garantía</label><input type="text" placeholder="Descripción..." value={formData.garantia} onChange={(e) => setFormData({...formData, garantia: e.target.value})} style={s.input} /></div>
              <div style={{ gridColumn: '1 / -1' }}><label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block' }}>Notas</label><textarea placeholder="Info adicional..." value={formData.notas} onChange={(e) => setFormData({...formData, notas: e.target.value})} style={{ ...s.input, minHeight: '80px', resize: 'vertical' }} /></div>
            </div>
            {calculo.montoTotal > 0 && <div style={s.calcBox}><h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#60a5fa' }}>📊 Resumen del Préstamo</h3><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}><div><div style={{ fontSize: '12px', color: '#9ca3af' }}>Monto Total a Pagar</div><div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fbbf24' }}>${calculo.montoTotal.toLocaleString()}</div></div><div><div style={{ fontSize: '12px', color: '#9ca3af' }}>Interés Total</div><div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f87171' }}>${calculo.interesTotal.toLocaleString()}</div></div><div><div style={{ fontSize: '12px', color: '#9ca3af' }}>Cuota Mensual</div><div style={{ fontSize: '20px', fontWeight: 'bold', color: '#34d399' }}>${calculo.cuotaMensual.toLocaleString()}</div></div></div></div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #1f2937' }}>
              <button type="reset" onClick={() => setFormData({ prestatario_id: '', distribuidor_id: '', monto_principal: '', tasa_interes_mensual: '10', plazo_meses: '6', cuota_inicial: '', notas: '', garantia: '' })} style={s.btnCancel}>Limpiar</button>
              <button type="submit" disabled={formLoading} style={s.btn}>{formLoading ? '⏳ Registrando...' : '💾 Registrar Préstamo'}</button>
            </div>
          </form>
        </div>

        <div style={{ ...s.card, marginTop: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px' }}>Préstamos Registrados</h2>
          <div style={{ marginBottom: '16px' }}>
            <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} style={s.input}>
              <option value="">Todos los estados</option>
              <option value="activo">✅ Activos</option>
              <option value="pagado">✅ Pagados</option>
              <option value="vencido">⚠ Vencidos</option>
              <option value="cancelado">❌ Cancelados</option>
            </select>
          </div>
          
          {loading ? <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>⏳ Cargando...</div> : prestamos.length === 0 ? <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>📋 No hay préstamos registrados</div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {prestamos.map((p: any) => (
                <div key={p.id} style={{ backgroundColor: '#0b0f19', border: '1px solid #1f2937', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '40px', height: '40px', backgroundColor: '#1e40af', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📄</div>
                      <div><div style={{ fontWeight: '600', fontSize: '16px' }}>{p.prestatario?.nombre} {p.prestatario?.apellido}</div><div style={{ fontSize: '13px', color: '#9ca3af' }}>{p.distribuidor?.nombre && `🤝 ${p.distribuidor.nombre} • `}📅 {new Date(p.fecha_inicio).toLocaleDateString('es-MX')}</div></div>
                    </div>
                    {getEstadoBadge(p.estado)}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', paddingTop: '12px', borderTop: '1px solid #1f2937' }}>
                    <div><div style={{ fontSize: '12px', color: '#9ca3af' }}>Monto Principal</div><div style={{ fontWeight: '600', color: '#60a5fa' }}>${Number(p.monto_principal).toLocaleString()}</div></div>
                    <div><div style={{ fontSize: '12px', color: '#9ca3af' }}>Monto Total</div><div style={{ fontWeight: '600', color: '#fbbf24' }}>${Number(p.monto_total).toLocaleString()}</div></div>
                    <div><div style={{ fontSize: '12px', color: '#9ca3af' }}>Cuota Mensual</div><div style={{ fontWeight: '600', color: '#34d399' }}>${Number(p.cuota_mensual).toLocaleString()}</div></div>
                    <div><div style={{ fontSize: '12px', color: '#9ca3af' }}>Saldo Pendiente</div><div style={{ fontWeight: '600', color: p.saldo_pendiente > 0 ? '#f87171' : '#34d399' }}>${Number(p.saldo_pendiente).toLocaleString()}</div></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #1f2937', fontSize: '12px', color: '#6b7280' }}>
                    <div>Interés: {p.tasa_interes_mensual}% mensual • {p.plazo_meses} meses</div>
                    <div>Vencimiento: {new Date(p.fecha_vencimiento).toLocaleDateString('es-MX')}</div>
                  </div>
                  {p.estado === 'activo' && (
                    <button 
                      onClick={() => handleRegistrarPago(p)}
                      style={{ marginTop: '12px', padding: '8px 16px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      💵 Registrar Pago
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {showPaymentModal && selectedPrestamo && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
            <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '32px', maxWidth: '500px', width: '100%' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px', color: '#60a5fa' }}>💵 Registrar Pago</h2>
              <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: '#030712', borderRadius: '8px' }}>
                <div style={{ fontSize: '14px', color: '#9ca3af' }}>Prestatario</div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>{selectedPrestamo.prestatario?.nombre} {selectedPrestamo.prestatario?.apellido}</div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block' }}>Monto del Pago *</label>
                <input type="number" placeholder="0.00" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} style={s.input} />
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Saldo pendiente: ${Number(selectedPrestamo.saldo_pendiente).toLocaleString()}</div>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block' }}>Notas</label>
                <textarea placeholder="Notas del pago..." value={paymentNotas} onChange={(e) => setPaymentNotas(e.target.value)} style={{ ...s.input, minHeight: '80px', resize: 'vertical', marginBottom: 0 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button onClick={() => setShowPaymentModal(false)} style={s.btnCancel}>Cancelar</button>
                <button onClick={confirmarPago} style={s.btn}>💾 Confirmar Pago</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
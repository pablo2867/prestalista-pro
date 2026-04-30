// app/prestamos/page.tsx - VERSIÓN FINAL CON AVATAR FUNCIONAL
'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useGlobalContext } from '../lib/GlobalContext'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabaseClient'
import ProtectedRoute from '../lib/ProtectedRoute'
import NotificationsBell from '../components/NotificationsBell'

export default function PrestamosPage() {
  const { user, signOut, isAdmin, isDistributor, isCollector } = useAuth()
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [prestamos, setPrestamos] = useState<any[]>([])
  const [metrics, setMetrics] = useState({ total: 0, activos: 0, totalPrestado: 0, totalPorCobrar: 0 })
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEstado, setFilterEstado] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10
  
  const [prestatarios, setPrestatarios] = useState<any[]>([])
  const [distribuidores, setDistribuidores] = useState<any[]>([])
  
  // ✅ Estados para el avatar
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
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

  // ✅ Cargar datos iniciales y Avatar
  useEffect(() => { 
    loadData()
    loadPrestatarios()
    loadDistribuidores()
    
    if (user?.id) {
      supabase.from('user_profiles').select('avatar_url').eq('id', user.id).single().then(({ data }) => {
        if (data?.avatar_url) setAvatarUrl(data.avatar_url)
      })
    }
  }, [])

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

  const getUserId = (): string | null => {
    if (user?.id) return user.id
    try {
      const token = localStorage.getItem('sb-dbnqkvcsdeluekfyxqcu-auth-token')
      if (token) {
        const payload = JSON.parse(decodeURIComponent(escape(window.atob(token.split('.')[1]))))
        if (payload?.sub) return payload.sub
      }
    } catch (e) { console.warn('⚠️ No se pudo parsear token') }
    return null
  }

  // ✅ LÓGICA DE SUBIDA DE AVATAR - CORREGIDA
  const handleAvatarClick = () => fileInputRef.current?.click()
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return
    
    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      // ✅ RUTA SIMPLIFICADA: solo userId.ext (sin carpetas "public/")
      const fileName = `${user.id}.${fileExt}`
      
      // ✅ Subir con upsert: true para reemplazar si ya existe
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { 
          upsert: true,
          cacheControl: '3600'
        })
      
      if (uploadError) {
        console.error('❌ Error de subida:', uploadError)
        throw uploadError
      }
      
      // ✅ Obtener URL pública
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
      const publicUrl = data.publicUrl
      
      // ✅ Guardar en perfil de usuario
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({ 
          id: user.id, 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
      
      if (profileError) throw profileError
      
      // ✅ Actualizar estado local
      setAvatarUrl(publicUrl)
      alert('✅ Avatar actualizado exitosamente')
      
    } catch (err: any) {
      console.error('❌ Error completo:', err)
      alert('Error al subir imagen: ' + (err.message || err.toString()))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

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

    const userId = getUserId()
    if (!userId) return alert('⚠️ Error de sesión')

    setFormLoading(true)
    try {
      const body = { ...formData, userId }
      const res = await fetch('/api/prestamos', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(body)
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
    const rows = prestamosFiltrados.map((p: any) => [
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

  // ✅ FILTRADO REAL
  const prestamosFiltrados = prestamos.filter((p) => {
    const cliente = `${p.prestatario?.nombre || ''} ${p.prestatario?.apellido || ''}`.toLowerCase()
    const matchSearch = searchTerm === '' || cliente.includes(searchTerm.toLowerCase())
    const matchEstado = filterEstado === '' || p.estado === filterEstado
    return matchSearch && matchEstado
  })

  const totalPages = Math.ceil(prestamosFiltrados.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const prestamosPage = prestamosFiltrados.slice(startIndex, endIndex)

  if (loading && prestamos.length === 0) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0b0f19', color: 'white' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
        <div>Cargando...</div>
      </div>
    </div>
  )

  return (
    <ProtectedRoute>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
      
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
            <div onClick={handleAvatarClick} style={{ backgroundColor: '#1f2937', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'background 0.2s' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold', color: 'white', background: avatarUrl ? 'transparent' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)', position: 'relative', flexShrink: 0 }}>
                {uploading ? (
                  <span style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⏳</span>
                ) : avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  getInitials()
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: '600', fontSize: '14px', color: 'white', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.full_name || 'Usuario'}</div>
                <div style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', backgroundColor: isAdmin() ? '#7c3aed' : isDistributor() ? '#2563eb' : '#059669', color: 'white' }}>{user?.role || 'ADMIN'}</div>
              </div>
              <span style={{ fontSize: '16px', color: '#6b7280' }}>📷</span>
            </div>
          </div>

          <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
            <Link href="/dashboard" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}><span style={{ fontSize: '18px' }}>📊</span><span style={{ fontWeight: '500' }}>Dashboard</span></Link>
            <Link href="/prestamos" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none', fontWeight: '600' }}><span style={{ fontSize: '18px' }}>📄</span><span>Préstamos</span></Link>
            {(isAdmin() || isCollector()) && (<Link href="/movimientos" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}><span style={{ fontSize: '18px' }}>📋</span><span>Movimientos</span></Link>)}
            {isAdmin() ? (<Link href="/prestatarios" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}><span style={{ fontSize: '18px' }}>👤</span><span>Prestatarios</span></Link>) : (<Link href="/prestatarios?mis-clientes=true" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}><span style={{ fontSize: '18px' }}>👤</span><span>Mis Clientes</span></Link>)}
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
            <div style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', borderRadius: '16px', padding: '32px', marginBottom: '32px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0', color: 'white' }}>Gestión de Préstamos</h1>
              <p style={{ margin: '0 0 24px 0', opacity: 0.9, color: 'rgba(255,255,255,0.9)' }}>Administra préstamos, intereses y cobros</p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => window.print()} className="no-print" style={{ flex: 1, padding: '12px 24px', backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', backdropFilter: 'blur(4px)' }}>🖨️ Imprimir</button>
                <button onClick={exportarPrestamos} className="no-print" style={{ flex: 1, padding: '12px 24px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>📥 Exportar</button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '24px' }}><div style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Total</div><div style={{ fontSize: '32px', fontWeight: 'bold', color: '#60a5fa' }}>{metrics.total}</div></div>
              <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '24px' }}><div style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Activos</div><div style={{ fontSize: '32px', fontWeight: 'bold', color: '#34d399' }}>{metrics.activos}</div></div>
              <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '24px' }}><div style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Prestado</div><div style={{ fontSize: '32px', fontWeight: 'bold', color: '#fbbf24' }}>${metrics.totalPrestado.toLocaleString()}</div></div>
              <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '24px' }}><div style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Por Cobrar</div><div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f87171' }}>${metrics.totalPorCobrar.toLocaleString()}</div></div>
            </div>

            <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '32px', marginBottom: '32px' }}>
              <h2 style={{ margin: '0 0 24px', fontSize: '20px', fontWeight: '600', color: 'white' }}>📝 Nuevo Préstamo</h2>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                  <div style={{ gridColumn: '1 / -1' }}><label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block', fontWeight: '500' }}>Prestatario *</label><select value={formData.prestatario_id} onChange={(e) => setFormData({...formData, prestatario_id: e.target.value})} required style={{ width: '100%', padding: '12px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: '14px', cursor: 'pointer' }}><option value="">Seleccionar...</option>{prestatarios.map((p: any) => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}</select></div>
                  <div><label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block', fontWeight: '500' }}>Monto *</label><input type="number" placeholder="0.00" value={formData.monto_principal} onChange={(e) => setFormData({...formData, monto_principal: e.target.value})} required style={{ width: '100%', padding: '12px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: '14px' }} /></div>
                  <div><label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block', fontWeight: '500' }}>Tasa Mensual % *</label><input type="number" step="0.01" placeholder="10" value={formData.tasa_interes_mensual} onChange={(e) => setFormData({...formData, tasa_interes_mensual: e.target.value})} required style={{ width: '100%', padding: '12px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: '14px' }} /></div>
                  <div><label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block', fontWeight: '500' }}>Plazo (meses) *</label><input type="number" placeholder="6" value={formData.plazo_meses} onChange={(e) => setFormData({...formData, plazo_meses: e.target.value})} required style={{ width: '100%', padding: '12px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: '14px' }} /></div>
                  <div><label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block', fontWeight: '500' }}>Cuota Inicial</label><input type="number" placeholder="0.00" value={formData.cuota_inicial} onChange={(e) => setFormData({...formData, cuota_inicial: e.target.value})} style={{ width: '100%', padding: '12px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: '14px' }} /></div>
                </div>
                {calculo.montoTotal > 0 && (<div style={{ backgroundColor: '#030712', border: '1px solid #374151', borderRadius: '8px', padding: '20px', margin: '24px 0' }}><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}><div><div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Total a Pagar</div><div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fbbf24' }}>${calculo.montoTotal.toLocaleString()}</div></div><div><div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Interés Total</div><div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f87171' }}>${calculo.interesTotal.toLocaleString()}</div></div><div><div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Cuota Mensual</div><div style={{ fontSize: '24px', fontWeight: 'bold', color: '#34d399' }}>${calculo.cuotaMensual.toLocaleString()}</div></div></div></div>)}
                <div style={{ marginTop: '24px' }}><button type="submit" disabled={formLoading} style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', border: 'none', borderRadius: '8px', cursor: formLoading ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '16px', opacity: formLoading ? 0.7 : 1 }}>{formLoading ? '⏳ Procesando...' : '💾 Registrar Préstamo'}</button></div>
              </form>
            </div>

            {/* ✅ FILTROS Y BÚSQUEDA */}
            <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                <div><label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block', fontWeight: '500' }}>🔍 Buscar por cliente</label><input type="text" placeholder="Escribe nombre o apellido..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }} style={{ width: '100%', padding: '12px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: '14px' }} /></div>
                <div><label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block', fontWeight: '500' }}>📊 Filtrar por estado</label><select value={filterEstado} onChange={(e) => { setFilterEstado(e.target.value); setCurrentPage(1) }} style={{ width: '100%', padding: '12px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: '14px', cursor: 'pointer' }}><option value="">Todos los estados</option><option value="activo">✅ Activos</option><option value="pagado">✅ Pagados</option><option value="vencido">⚠️ Vencidos</option><option value="cancelado">❌ Cancelados</option></select></div>
                {(searchTerm || filterEstado) && (<div style={{ display: 'flex', alignItems: 'flex-end' }}><button onClick={() => { setSearchTerm(''); setFilterEstado(''); setCurrentPage(1) }} style={{ padding: '12px 24px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>🔄 Limpiar</button></div>)}
              </div>
              <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#030712', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: '#9ca3af', fontSize: '14px' }}>Mostrando {prestamosPage.length} de {prestamosFiltrados.length} préstamos</span>{totalPages > 1 && <span style={{ color: '#60a5fa', fontSize: '14px', fontWeight: '600' }}>Página {currentPage} de {totalPages}</span>}</div>
            </div>

            {/* ✅ LISTA DE PRÉSTAMOS */}
            <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '24px' }}>
              <h2 style={{ margin: '0 0 24px', fontSize: '20px', fontWeight: '600', color: 'white' }}>Préstamos Registrados</h2>
              {prestamosPage.length === 0 ? (<div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}><div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div><div style={{ fontSize: '16px' }}>No se encontraron préstamos {searchTerm ? `para "${searchTerm}"` : ''}</div></div>) : (<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>{prestamosPage.map((p: any) => (<div key={p.id} style={{ backgroundColor: '#0b0f19', border: '1px solid #1f2937', borderRadius: '12px', padding: '24px' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}><div style={{ width: '48px', height: '48px', backgroundColor: '#1e40af', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>📄</div><div><div style={{ fontWeight: '600', fontSize: '16px', color: 'white', marginBottom: '4px' }}>{p.prestatario?.nombre} {p.prestatario?.apellido}</div><div style={{ fontSize: '13px', color: '#9ca3af' }}>📅 {new Date(p.fecha_inicio).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}</div></div></div>{getEstadoBadge(p.estado)}</div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', paddingTop: '20px', borderTop: '1px solid #1f2937' }}><div><div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Principal</div><div style={{ fontWeight: '600', fontSize: '18px', color: '#60a5fa' }}>${Number(p.monto_principal).toLocaleString()}</div></div><div><div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Total</div><div style={{ fontWeight: '600', fontSize: '18px', color: '#fbbf24' }}>${Number(p.monto_total).toLocaleString()}</div></div><div><div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Cuota</div><div style={{ fontWeight: '600', fontSize: '18px', color: '#34d399' }}>${Number(p.cuota_mensual).toLocaleString()}</div></div><div><div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Saldo</div><div style={{ fontWeight: '600', fontSize: '18px', color: p.saldo_pendiente > 0 ? '#f87171' : '#34d399' }}>${Number(p.saldo_pendiente).toLocaleString()}</div></div></div>{p.estado === 'activo' && <button onClick={() => handleRegistrarPago(p)} style={{ marginTop: '20px', width: '100%', padding: '14px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: '600' }}>💵 Registrar Pago</button>}</div>))}</div>)}
              {totalPages > 1 && (<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #1f2937' }}><button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: '10px 20px', backgroundColor: currentPage === 1 ? '#374151' : '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1, fontWeight: '600' }}>← Anterior</button><div style={{ display: 'flex', gap: '6px' }}>{Array.from({ length: Math.min(5, totalPages) }, (_, i) => { let pageNum; if (totalPages <= 5) pageNum = i + 1; else if (currentPage <= 3) pageNum = i + 1; else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i; else pageNum = currentPage - 2 + i; return <button key={pageNum} onClick={() => setCurrentPage(pageNum)} style={{ padding: '10px 16px', backgroundColor: currentPage === pageNum ? '#3b82f6' : '#1f2937', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: currentPage === pageNum ? '600' : '400', minWidth: '44px' }}>{pageNum}</button> })}</div><button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} style={{ padding: '10px 20px', backgroundColor: currentPage >= totalPages ? '#374151' : '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', opacity: currentPage >= totalPages ? 0.5 : 1, fontWeight: '600' }}>Siguiente →</button></div>)}
            </div>
          </div>
        </main>

        {/* MODAL DE PAGO */}
        {showPaymentModal && selectedPrestamo && (<div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', backdropFilter: 'blur(4px)' }}><div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '32px', maxWidth: '500px', width: '100%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}><h2 style={{ margin: '0 0 24px', fontSize: '24px', fontWeight: 'bold', color: 'white' }}>💵 Registrar Pago</h2><div style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#030712', borderRadius: '12px' }}><div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '8px' }}>Prestatario</div><div style={{ fontSize: '18px', fontWeight: '600', color: 'white' }}>{selectedPrestamo.prestatario?.nombre} {selectedPrestamo.prestatario?.apellido}</div></div><div style={{ marginBottom: '24px' }}><label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block', fontWeight: '500' }}>Monto del Pago *</label><input type="number" placeholder="0.00" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} style={{ width: '100%', padding: '14px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: '16px' }} /><div style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px' }}>Saldo pendiente: ${Number(selectedPrestamo.saldo_pendiente).toLocaleString()}</div></div><div style={{ marginBottom: '32px' }}><label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block', fontWeight: '500' }}>Notas</label><textarea placeholder="Notas adicionales..." value={paymentNotas} onChange={(e) => setPaymentNotas(e.target.value)} style={{ width: '100%', padding: '14px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: '14px', minHeight: '100px', resize: 'vertical' }} /></div><div style={{ display: 'flex', gap: '12px' }}><button onClick={() => setShowPaymentModal(false)} style={{ flex: 1, padding: '14px', backgroundColor: '#1f2937', color: '#9ca3af', border: '1px solid #374151', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: '600' }}>Cancelar</button><button onClick={confirmarPago} style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '15px' }}>💾 Confirmar Pago</button></div></div></div>)}
      </div>
    </ProtectedRoute>
  )
}
'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabaseClient'
import ProtectedRoute from '../lib/ProtectedRoute'
import NotificationsBell from '../components/NotificationsBell'

const INGRESOS_OPCIONES = [
  'Venta de producto',
  'Cobro de préstamo',
  'Inversión inicial',
  'Aporte de socios',
  'Intereses cobrados',
  'Servicios prestados',
  'Otro ingreso'
]

const EGRESOS_OPCIONES = [
  'Compra de insumos',
  'Compra de material',
  'Pago de servicios (luz/agua/internet)',
  'Salarios y comisiones',
  'Alquiler',
  'Publicidad y marketing',
  'Mantenimiento',
  'Impuestos',
  'Otro gasto'
]

export default function CapitalPage() {
  const { user, signOut, isAdmin, isDistributor } = useAuth()
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [tipo, setTipo] = useState<'Ingreso' | 'Egreso'>('Ingreso')
  const [descripcion, setDescripcion] = useState('')
  const [monto, setMonto] = useState('')
  const [categoria, setCategoria] = useState('capital')
  const [transacciones, setTransacciones] = useState<any[]>([])
  const [metrics, setMetrics] = useState({ saldo: 0, ingresos: 0, egresos: 0 })
  const [saving, setSaving] = useState(false)

  // ✅ Cargar transacciones desde Supabase
  useEffect(() => { 
    const initPage = async () => {
      try {
        if (user?.id) {
          // Cargar avatar
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('avatar_url')
            .eq('id', user.id)
            .single()
          if (profileData?.avatar_url) setAvatarUrl(profileData.avatar_url)

          // Cargar transacciones
          const { data: transData, error: transError } = await supabase
            .from('transacciones_capital')
            .select('*')
            .eq('user_id', user.id)
            .order('fecha', { ascending: false })

          if (transError) throw transError

          const trans = transData || []
          setTransacciones(trans)

          // Calcular métricas
          const ingresos = trans
            .filter(t => t.tipo === 'Ingreso')
            .reduce((sum, t) => sum + (t.monto || 0), 0)
          const egresos = trans
            .filter(t => t.tipo === 'Egreso')
            .reduce((sum, t) => sum + (t.monto || 0), 0)

          setMetrics({
            saldo: ingresos - egresos,
            ingresos,
            egresos
          })
        }
      } catch (error) {
        console.error('❌ Error cargando datos:', error)
      } finally {
        setLoading(false)
      }
    }
    initPage()
  }, [user?.id])

  const handleAvatarClick = () => fileInputRef.current?.click()
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return
    
    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true, cacheControl: '3600' })
      if (uploadError) throw uploadError
      
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
      await supabase.from('user_profiles').upsert({ 
        id: user.id, 
        avatar_url: data.publicUrl, 
        email: user?.email || null, 
        updated_at: new Date().toISOString() 
      })
      setAvatarUrl(data.publicUrl)
    } catch (err: any) {
      console.error('❌ Error avatar:', err)
      alert('Error al subir avatar: ' + err.message)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const getInitials = () => {
    if (user?.full_name) {
      const names = user.full_name.split(' ')
      return names.length >= 2 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : user.full_name[0].toUpperCase()
    }
    return user?.email?.[0]?.toUpperCase() || 'U'
  }

  // ✅ Guardar en Supabase
  const handleSubmit = async (e: React.FormEvent, tipoForzado?: 'Ingreso' | 'Egreso') => {
    e.preventDefault()
    if (!descripcion || !monto) return alert('Completa concepto y monto')
    if (!user?.id) return alert('Debes estar logueado')

    const tipoAUsar = tipoForzado || tipo
    setSaving(true)

    try {
      const nuevaTransaccion = {
        user_id: user.id,
        tipo: tipoAUsar,
        descripcion,
        monto: parseFloat(monto),
        categoria,
        fecha: new Date().toISOString()
      }

      const { error } = await supabase
        .from('transacciones_capital')
        .insert([nuevaTransaccion])

      if (error) throw error

      // Actualizar estado local inmediatamente
      const transaccionConId = { ...nuevaTransaccion, id: Date.now() }
      setTransacciones([transaccionConId, ...transacciones])

      setMetrics(prev => ({
        saldo: tipoAUsar === 'Ingreso' ? prev.saldo + parseFloat(monto) : prev.saldo - parseFloat(monto),
        ingresos: tipoAUsar === 'Ingreso' ? prev.ingresos + parseFloat(monto) : prev.ingresos,
        egresos: tipoAUsar === 'Egreso' ? prev.egresos + parseFloat(monto) : prev.egresos
      }))

      setDescripcion('')
      setMonto('')
      alert(`✅ ${tipoAUsar} registrado correctamente`)

      // Recargar datos desde Supabase para asegurar consistencia
      setTimeout(() => {
        window.location.reload()
      }, 1000)

    } catch (error: any) {
      console.error('❌ Error guardando transacción:', error)
      alert('Error al guardar: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handlePrint = () => window.print()

  const handleExportCSV = () => {
    if (transacciones.length === 0) return alert('No hay transacciones para exportar')
    try {
      const BOM = '\uFEFF'
      const headers = 'Fecha,Tipo,Categoría,Descripción,Monto,Usuario\n'
      const rows = transacciones.map(t => 
        `${new Date(t.fecha).toLocaleDateString('es-MX')},${t.tipo},${t.categoria},"${String(t.descripcion).replace(/"/g, '""')}",${t.monto},"${user?.email || 'Admin'}"`
      ).join('\n')
      const totalIngresos = transacciones.filter(t => t.tipo === 'Ingreso').reduce((sum, t) => sum + (t.monto || 0), 0)
      const totalEgresos = transacciones.filter(t => t.tipo === 'Egreso').reduce((sum, t) => sum + (t.monto || 0), 0)
      const saldoNeto = totalIngresos - totalEgresos
      const summary = `\n\n=== RESUMEN ===\nTotal Ingresos: $${totalIngresos.toFixed(2)}\nTotal Egresos: $${totalEgresos.toFixed(2)}\nSaldo Neto: $${saldoNeto.toFixed(2)}\nRegistros: ${transacciones.length}`
      const csvContent = BOM + headers + rows + summary
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Capital_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('❌ Error al exportar CSV:', err)
      alert('Hubo un error al generar el archivo')
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0b0f19', color: 'white' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'pulse 1.5s infinite' }}>⏳</div>
        <div>Cargando módulo de Capital...</div>
      </div>
    </div>
  )

  return (
    <ProtectedRoute>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
      
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0b0f19', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <style>{`
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
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
          @media print {
            .no-print { display: none !important; }
            .sidebar { display: none !important; }
            .main-content { margin-left: 0 !important; }
          }
        `}</style>

        <div className="overlay" onClick={() => setSidebarOpen(false)} style={{ display: 'none', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 40 }} />

        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} style={{ width: '280px', backgroundColor: '#111827', borderRight: '1px solid #1f2937', position: 'fixed', top: 0, left: 0, bottom: 0, display: 'flex', flexDirection: 'column', zIndex: 50 }}>
          <div style={{ padding: '24px 20px', borderBottom: '1px solid #1f2937' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>💼</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>PrestaLista</div>
            </div>
            <div onClick={handleAvatarClick} style={{ backgroundColor: '#1f2937', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'background 0.2s' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold', color: 'white', background: avatarUrl ? 'transparent' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)', position: 'relative', flexShrink: 0 }}>
                {uploading ? (<span style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⏳</span>) : avatarUrl ? (<img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />) : (getInitials())}
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
            <Link href="/prestamos" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}><span style={{ fontSize: '18px' }}>📄</span><span>Préstamos</span></Link>
            <Link href="/movimientos" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}><span style={{ fontSize: '18px' }}>📋</span><span>Movimientos</span></Link>
            <Link href="/prestatarios" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}><span style={{ fontSize: '18px' }}>👤</span><span>Prestatarios</span></Link>
            {isAdmin() && (<Link href="/distribuidores" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}><span style={{ fontSize: '18px' }}>🤝</span><span>Distribuidores</span></Link>)}
            <Link href="/capital" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none', fontWeight: '600' }}><span style={{ fontSize: '18px' }}>💰</span><span>Capital</span></Link>
          </nav>

          <div style={{ padding: '20px', borderTop: '1px solid #1f2937' }}>
            <button onClick={() => { signOut(); setSidebarOpen(false); }} style={{ width: '100%', padding: '12px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><span>🚪</span><span>Cerrar Sesión</span></button>
          </div>
        </aside>

        <main className="main-content" style={{ marginLeft: '280px', flex: 1, minHeight: '100vh', backgroundColor: '#0b0f19' }}>
          <header style={{ backgroundColor: '#111827', borderBottom: '1px solid #1f2937', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '16px', position: 'sticky', top: 0, zIndex: 30 }}>
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} style={{ display: 'none', padding: '8px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '20px', marginRight: 'auto' }}>☰</button>
            <NotificationsBell />
          </header>

          <div style={{ padding: '32px' }}>
            <div style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', borderRadius: '16px', padding: '32px', marginBottom: '32px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0', color: 'white' }}>💰 Gestión de Capital</h1>
              <p style={{ margin: '0 0 24px 0', opacity: 0.9, color: 'rgba(255,255,255,0.9)' }}>Controla ingresos, egresos y el balance de tu negocio</p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={handlePrint} className="no-print" style={{ flex: 1, padding: '12px 24px', backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', backdropFilter: 'blur(4px)' }}>🖨️ Imprimir</button>
                <button onClick={handleExportCSV} className="no-print" style={{ flex: 1, padding: '12px 24px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>📥 Exportar CSV (Excel)</button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '24px' }}>
                <div style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Saldo Actual</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#34d399' }}>${metrics.saldo.toLocaleString('es-MX')}</div>
              </div>
              <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '24px' }}>
                <div style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Ingresos</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#60a5fa' }}>${metrics.ingresos.toLocaleString('es-MX')}</div>
              </div>
              <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '24px' }}>
                <div style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Egresos</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f87171' }}>${metrics.egresos.toLocaleString('es-MX')}</div>
              </div>
            </div>

            <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '32px', marginBottom: '32px' }}>
              <h2 style={{ margin: '0 0 24px', fontSize: '20px', fontWeight: '600', color: 'white' }}>📝 Registrar Transacción</h2>
              <form onSubmit={(e) => handleSubmit(e)}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                  
                  <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px', marginBottom: '8px' }}>
                    <button type="button" onClick={() => setTipo('Ingreso')} style={{ flex: 1, padding: '12px', backgroundColor: tipo === 'Ingreso' ? '#059669' : '#030712', color: tipo === 'Ingreso' ? 'white' : '#9ca3af', border: `2px solid ${tipo === 'Ingreso' ? '#059669' : '#1f2937'}`, borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>INGRESO</button>
                    <button type="button" onClick={() => setTipo('Egreso')} style={{ flex: 1, padding: '12px', backgroundColor: tipo === 'Egreso' ? '#dc2626' : '#030712', color: tipo === 'Egreso' ? 'white' : '#9ca3af', border: `2px solid ${tipo === 'Egreso' ? '#dc2626' : '#1f2937'}`, borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>EGRESO</button>
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block', fontWeight: '500' }}>Concepto *</label>
                    <select value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required style={{ width: '100%', padding: '12px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: '14px', cursor: 'pointer' }}>
                      <option value="">-- Selecciona --</option>
                      {(tipo === 'Ingreso' ? INGRESOS_OPCIONES : EGRESOS_OPCIONES).map((op) => (<option key={op} value={op}>{op}</option>))}
                    </select>
                  </div>

                  <div>
                    <label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block', fontWeight: '500' }}>Monto *</label>
                    <input type="number" step="0.01" placeholder="0.00" value={monto} onChange={(e) => setMonto(e.target.value)} required style={{ width: '100%', padding: '12px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: '14px' }} />
                  </div>

                  <div>
                    <label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block', fontWeight: '500' }}>Categoría</label>
                    <input type="text" placeholder="capital" value={categoria} onChange={(e) => setCategoria(e.target.value)} style={{ width: '100%', padding: '12px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: '14px' }} />
                  </div>

                  <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '16px', marginTop: '16px' }}>
                    <button 
                      type="button" 
                      onClick={(e) => handleSubmit(e, 'Ingreso')} 
                      disabled={saving}
                      style={{ 
                        flex: 1, 
                        padding: '16px', 
                        backgroundColor: saving ? '#047857' : '#059669', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '8px', 
                        cursor: saving ? 'not-allowed' : 'pointer', 
                        fontWeight: '700', 
                        fontSize: '16px',
                        boxShadow: '0 4px 6px rgba(5,150,105,0.3)',
                        opacity: saving ? 0.7 : 1
                      }}
                    >
                      {saving ? '⏳ Guardando...' : '✅ REGISTRAR INGRESO'}
                    </button>
                    <button 
                      type="button" 
                      onClick={(e) => handleSubmit(e, 'Egreso')}
                      disabled={saving}
                      style={{ 
                        flex: 1, 
                        padding: '16px', 
                        backgroundColor: saving ? '#b91c1c' : '#dc2626', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '8px', 
                        cursor: saving ? 'not-allowed' : 'pointer', 
                        fontWeight: '700', 
                        fontSize: '16px',
                        boxShadow: '0 4px 6px rgba(220,38,38,0.3)',
                        opacity: saving ? 0.7 : 1
                      }}
                    >
                      {saving ? '⏳ Guardando...' : '📉 REGISTRAR EGRESO'}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '24px' }}>
              <h2 style={{ margin: '0 0 24px', fontSize: '20px', fontWeight: '600', color: 'white' }}>📊 Historial de Transacciones</h2>
              {transacciones.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📈</div>
                  <div style={{ fontSize: '16px' }}>Aún no hay transacciones registradas</div>
                  <div style={{ fontSize: '13px', marginTop: '8px' }}>Registra tu primera transacción arriba 👆</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {transacciones.map((t: any) => (
                    <div key={t.id} style={{ backgroundColor: '#0b0f19', border: '1px solid #1f2937', borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: '600', color: 'white' }}>{t.descripcion}</div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>{t.categoria} • {new Date(t.fecha).toLocaleDateString('es-MX')}</div>
                      </div>
                      <div style={{ fontWeight: 'bold', fontSize: '18px', color: t.tipo === 'Ingreso' ? '#34d399' : '#f87171' }}>
                        {t.tipo === 'Ingreso' ? '+' : '-'}${Number(t.monto).toLocaleString('es-MX')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
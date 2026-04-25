// app/dashboard/page.tsx - VERSIÓN FINAL CON NOTIFICACIONES
'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useGlobalContext } from '../lib/GlobalContext'
import { useAuth } from '../lib/AuthContext'
import ProtectedRoute from '../lib/ProtectedRoute'
import { createClient } from '@supabase/supabase-js'
// 🔔 Import del componente de notificaciones
import NotificationsBell from '../components/NotificationsBell'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function DashboardPage() {
  const { user, signOut, isAdmin, isDistributor, isCollector } = useAuth()
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { prestamosActualizados } = useGlobalContext()

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/dashboard')
        if (res.ok) {
          const json = await res.json()
          setMetrics(json.metrics)
        }
      } catch (e) { console.error('Error cargando dashboard', e) } finally { setLoading(false) }
    }
    fetchDashboard()
  }, [prestamosActualizados])

  const handleAvatarClick = () => { fileInputRef.current?.click() }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      const file = event.target.files?.[0]
      if (!file || !user) return
      if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) {
        alert('Imagen válida < 2MB')
        return
      }
      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}/${user.id}.${fileExt}`
      
      const uploadResult = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true })
      if (uploadResult.error) throw uploadResult.error
      
      const urlResult = supabase.storage.from('avatars').getPublicUrl(filePath)
      const publicUrl = urlResult.data?.publicUrl
      if (!publicUrl) throw new Error('No se pudo obtener la URL pública')
      
      const updateResult = await supabase.from('user_profiles').update({ avatar_url: publicUrl }).eq('id', user.id)
      if (updateResult.error) throw updateResult.error
      
      window.location.reload()
    } catch (error) { alert('Error: ' + (error as Error).message) } finally { setUploading(false) }
  }

  const exportarDashboard = () => {
    if (!metrics) return alert('Cargando datos...')
    const BOM = '\uFEFF'
    let csv = BOM
    
    const add = (titulo: string, filas: any[]) => {
      csv += `\n\n${titulo}\nConcepto;Valor\n`
      filas.forEach((fila: any) => {
        const [concepto, valor] = fila
        csv += `${concepto};${valor}\n`
      })
    }
    
    add('CAPITAL', [
      ['Saldo Actual', metrics.capital?.saldoActual?.toFixed(2) || '0'],
      ['Total Ingresos', metrics.capital?.totalIngresos?.toFixed(2) || '0'],
      ['Total Egresos', metrics.capital?.totalEgresos?.toFixed(2) || '0'],
      ['Distribuidores', metrics.distributors?.total?.toString() || '0']
    ])
    add('CLIENTES', [
      ['Total', metrics.clientes?.total?.toString() || '0'],
      ['Activos', metrics.clientes?.activos?.toString() || '0'],
      ['Morosos', metrics.clientes?.morosos?.toString() || '0']
    ])
    add('PRÉSTAMOS', [
      ['Total', metrics.prestamos?.total?.toString() || '0'],
      ['Activos', metrics.prestamos?.activos?.toString() || '0'],
      ['Prestado', metrics.prestamos?.totalPrestado?.toFixed(2) || '0'],
      ['Por Cobrar', metrics.prestamos?.totalPorCobrar?.toFixed(2) || '0']
    ])
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `dashboard_${new Date().toISOString().split('T')[0]}.csv`
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
              <div onClick={handleAvatarClick} style={{ width: 48, height: 48, borderRadius: '50%', background: user?.avatar_url ? 'transparent' : '#1e40af', border: '2px solid #3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer' }}>
                {user?.avatar_url ? <img src={user.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : <span style={{ fontSize: 18, fontWeight: 'bold', color: 'white', lineHeight: '48px' }}>{getInitials()}</span>}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} style={{ display: 'none' }} />
              <div>
                <div style={{ fontWeight: 'bold', fontSize: 14 }}>{user?.full_name || 'Usuario'}</div>
                <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' as const, ...getRoleColor() }}>{user?.role}</span>
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>{user?.email}</div>
          </div>
          
          <nav style={{ flex: 1, overflowY: 'auto' as const, padding: '16px 12px' }}>
            <Link href="/dashboard" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', gap: 12, padding: 12, background: 'rgba(59,130,246,0.15)', color: '#60a5fa', borderRadius: 8, marginBottom: 4, textDecoration: 'none', fontWeight: 600 }}>📊 Dashboard</Link>
            
            {(isAdmin() || isDistributor()) && (
              <Link href="/prestamos" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', gap: 12, padding: 10, color: '#9ca3af', borderRadius: 8, marginBottom: 4, textDecoration: 'none' }}>📄 Préstamos</Link>
            )}
            
            {(isAdmin() || isCollector()) && (
              <Link href="/movimientos" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', gap: 12, padding: 10, color: '#9ca3af', borderRadius: 8, marginBottom: 4, textDecoration: 'none' }}>📋 Movimientos</Link>
            )}
            
            {isAdmin() ? (
              <Link href="/prestatarios" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', gap: 12, padding: 10, color: '#9ca3af', borderRadius: 8, marginBottom: 4, textDecoration: 'none' }}>👤 Prestatarios</Link>
            ) : (
              <Link href="/prestatarios?mis-clientes=true" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', gap: 12, padding: 10, color: '#9ca3af', borderRadius: 8, marginBottom: 4, textDecoration: 'none' }}>👤 Mis Clientes</Link>
            )}
            
            {isAdmin() && (
              <>
                <Link href="/distribuidores" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', gap: 12, padding: 10, color: '#9ca3af', borderRadius: 8, marginBottom: 4, textDecoration: 'none' }}>🤝 Distribuidores</Link>
                <Link href="/capital" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', gap: 12, padding: 10, color: '#9ca3af', borderRadius: 8, marginBottom: 4, textDecoration: 'none' }}>💰 Capital</Link>
              </>
            )}
            
            {(isAdmin() || isDistributor()) && (
              <Link href="/leads" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', gap: 12, padding: 10, color: '#9ca3af', borderRadius: 8, marginBottom: 4, textDecoration: 'none' }}>🎯 Mis Leads</Link>
            )}
          </nav>

          <div style={{ padding: '16px', borderTop: '1px solid #1f2937', backgroundColor: '#111827', flexShrink: 0 }}>
            <button onClick={signOut} style={{ width: '100%', padding: 12, backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>🚪 Cerrar Sesión</button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main" style={{ marginLeft: '260px', flex: 1, padding: '24px' }}>
          
          {/* 🔴 BOTÓN HAMBURGUESA */}
          <button 
            className="mobile-menu-btn" 
            onClick={() => setSidebarOpen(true)} 
            style={{ 
              display: 'none',
              position: 'fixed', 
              top: '70px', 
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
              <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0 }}>Dashboard General</h1>
              <p style={{ margin: '6px 0 0', opacity: 0.9 }}>Vista ejecutiva de tu negocio de préstamos</p>
            </div>
            
            {/* 🔔 Header con botones + campana de notificaciones */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', width: '100%' }}>
              <button onClick={() => window.print()} className="no-print" style={{ flex: 1, padding: '12px 20px', backgroundColor: '#1e40af', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>🖨️ Imprimir</button>
              <button onClick={exportarDashboard} className="no-print" style={{ flex: 1, padding: '12px 20px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>📥 Exportar Excel</button>
              
              {/* 🔔 Campana de notificaciones */}
              <NotificationsBell />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 24 }}>
            <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 20 }}><div style={{color:'#9ca3af',fontSize:13,marginBottom:8}}>Saldo Actual</div><div style={{fontSize:28,fontWeight:'bold',color:'#34d399'}}>${(metrics?.capital?.saldoActual || 0).toLocaleString()}</div></div>
            <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 20 }}><div style={{color:'#9ca3af',fontSize:13,marginBottom:8}}>Ingresos</div><div style={{fontSize:28,fontWeight:'bold',color:'#60a5fa'}}>${(metrics?.capital?.totalIngresos || 0).toLocaleString()}</div></div>
            <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 20 }}><div style={{color:'#9ca3af',fontSize:13,marginBottom:8}}>Egresos</div><div style={{fontSize:28,fontWeight:'bold',color:'#ef4444'}}>${(metrics?.capital?.totalEgresos || 0).toLocaleString()}</div></div>
            <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 20 }}><div style={{color:'#9ca3af',fontSize:13,marginBottom:8}}>Distribuidores</div><div style={{fontSize:28,fontWeight:'bold',color:'#fbbf24'}}>{metrics?.distributors?.total || 0}</div></div>
          </div>

          {/* Clientes */}
          <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 600, color: '#34d399' }}>👥 Clientes</h2>
            <div className="grid-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
              <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 20 }}><div style={{color:'#9ca3af',fontSize:13,marginBottom:8}}>Total</div><div style={{fontSize:28,fontWeight:'bold',color:'#60a5fa'}}>{metrics?.clientes?.total || 0}</div></div>
              <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 20 }}><div style={{color:'#9ca3af',fontSize:13,marginBottom:8}}>Activos</div><div style={{fontSize:28,fontWeight:'bold',color:'#34d399'}}>{metrics?.clientes?.activos || 0}</div></div>
              <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 20 }}><div style={{color:'#9ca3af',fontSize:13,marginBottom:8}}>Morosos</div><div style={{fontSize:28,fontWeight:'bold',color:'#f87171'}}>{metrics?.clientes?.morosos || 0}</div></div>
              <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 20 }}><div style={{color:'#9ca3af',fontSize:13,marginBottom:8}}>Morosidad</div><div style={{fontSize:28,fontWeight:'bold',color:'#fbbf24'}}>{metrics?.clientes?.total > 0 ? ((metrics.clientes.morosos/metrics.clientes.total)*100).toFixed(1) : 0}%</div></div>
            </div>
          </div>

          {/* Préstamos */}
          <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 600, color: '#fbbf24' }}>📄 Préstamos</h2>
            <div className="grid-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
              <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 20 }}><div style={{color:'#9ca3af',fontSize:13,marginBottom:8}}>Total</div><div style={{fontSize:28,fontWeight:'bold',color:'#60a5fa'}}>{metrics?.prestamos?.total || 0}</div></div>
              <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 20 }}><div style={{color:'#9ca3af',fontSize:13,marginBottom:8}}>Activos</div><div style={{fontSize:28,fontWeight:'bold',color:'#34d399'}}>{metrics?.prestamos?.activos || 0}</div></div>
              <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 20 }}><div style={{color:'#9ca3af',fontSize:13,marginBottom:8}}>Prestado</div><div style={{fontSize:28,fontWeight:'bold',color:'#fbbf24'}}>${(metrics?.prestamos?.totalPrestado || 0).toLocaleString()}</div></div>
              <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 20 }}><div style={{color:'#9ca3af',fontSize:13,marginBottom:8}}>Por Cobrar</div><div style={{fontSize:28,fontWeight:'bold',color:'#f87171'}}>${(metrics?.prestamos?.totalPorCobrar || 0).toLocaleString()}</div></div>
            </div>
          </div>

          {/* Leads */}
          <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 600, color: '#a78bfa' }}>🎯 Leads</h2>
            <div className="grid-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
              <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 20 }}><div style={{color:'#9ca3af',fontSize:13,marginBottom:8}}>Total</div><div style={{fontSize:28,fontWeight:'bold',color:'#60a5fa'}}>{metrics?.leads?.total || 0}</div></div>
              <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 20 }}><div style={{color:'#9ca3af',fontSize:13,marginBottom:8}}>Nuevos</div><div style={{fontSize:28,fontWeight:'bold',color:'#fbbf24'}}>{metrics?.leads?.nuevos || 0}</div></div>
              <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 20 }}><div style={{color:'#9ca3af',fontSize:13,marginBottom:8}}>Convertidos</div><div style={{fontSize:28,fontWeight:'bold',color:'#34d399'}}>{metrics?.leads?.convertidos || 0}</div></div>
              <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 20 }}><div style={{color:'#9ca3af',fontSize:13,marginBottom:8}}>Monto Potencial</div><div style={{fontSize:28,fontWeight:'bold',color:'#f87171'}}>${(metrics?.leads?.montoPotencial || 0).toLocaleString()}</div></div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
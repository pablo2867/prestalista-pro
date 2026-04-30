// app/movimientos/page.tsx - VERSIÓN FINAL CON BOTONES Y NOTIFICACIONES
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabaseClient'
import ProtectedRoute from '../lib/ProtectedRoute'
import NotificationsBell from '../components/NotificationsBell'

export default function MovimientosPage() {
  const { user, signOut, isAdmin, isDistributor } = useAuth()
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [movimientos, setMovimientos] = useState<any[]>([])
  const [filterTipo, setFilterTipo] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10
  
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  // Cargar datos y Avatar
  useEffect(() => {
    loadMovimientos()
    if (user?.id) {
      supabase.from('user_profiles').select('avatar_url').eq('id', user.id).single().then(({ data }) => {
        if (data?.avatar_url) setAvatarUrl(data.avatar_url)
      })
    }
  }, [])

  // Recargar al cambiar filtro
  useEffect(() => {
    loadMovimientos()
  }, [filterTipo])

  const loadMovimientos = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('movimientos')
        .select(`
          *,
          prestamo:prestamos (
            prestatario:prestatarios (nombre, apellido)
          )
        `)
        .order('fecha', { ascending: false })
      
      if (filterTipo) {
        query = query.eq('tipo', filterTipo)
      }
      
      const { data, error } = await query
      if (error) throw error
      setMovimientos(data || [])
    } catch (err) {
      console.error('Error cargando movimientos:', err)
    } finally {
      setLoading(false)
    }
  }

  // ✅ FUNCIÓN EXPORTAR A CSV
  const exportarMovimientos = () => {
    const BOM = '\uFEFF'
    const headers = 'Tipo;Cliente;Monto;Fecha;Notas'
    const rows = movimientosFiltrados.map((m: any) => [
      m.tipo || '',
      m.prestamo?.prestatario ? `${m.prestamo.prestatario.nombre} ${m.prestamo.prestatario.apellido}` : 'N/A',
      Number(m.monto || 0).toFixed(2),
      new Date(m.fecha).toLocaleDateString('es-MX'),
      m.notas || ''
    ].join(';'))
    const csv = BOM + [headers, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `movimientos_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const getInitials = () => {
    if (user?.full_name) {
      const n = user.full_name.split(' ')
      return n.length >= 2 ? `${n[0][0]}${n[n.length-1][0]}`.toUpperCase() : user.full_name[0].toUpperCase()
    }
    return user?.email?.[0]?.toUpperCase() || 'U'
  }

  const getRoleColor = () => {
    if (isAdmin()) return { backgroundColor: '#7c3aed', color: '#fff' }
    if (isDistributor()) return { backgroundColor: '#2563eb', color: '#fff' }
    return { backgroundColor: '#059669', color: '#fff' }
  }

  const getTipoBadge = (tipo: string) => {
    const styles: Record<string, any> = {
      pago: { backgroundColor: '#065f46', color: '#34d399' },
      prestamo: { backgroundColor: '#1e40af', color: '#60a5fa' },
      egreso: { backgroundColor: '#7f1d1d', color: '#f87171' }
    }
    const icons: Record<string, string> = { pago: '💵', prestamo: '📄', egreso: '💸' }
    return (
      <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', ...styles[tipo] }}>
        {icons[tipo] || '📋'} {tipo?.toUpperCase()}
      </span>
    )
  }

  // Filtrar por búsqueda
  const movimientosFiltrados = movimientos.filter((m) => {
    const cliente = m.prestamo?.prestatario ? `${m.prestamo.prestatario.nombre} ${m.prestamo.prestatario.apellido}`.toLowerCase() : ''
    return searchTerm === '' || cliente.includes(searchTerm.toLowerCase())
  })

  // Paginación
  const totalPages = Math.ceil(movimientosFiltrados.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const movimientosPage = movimientosFiltrados.slice(startIndex, endIndex)

  const totalIngresos = movimientosFiltrados.filter(m => m.tipo === 'pago').reduce((sum, m) => sum + parseFloat(m.monto || 0), 0)
  const totalEgresos = movimientosFiltrados.filter(m => m.tipo === 'egreso').reduce((sum, m) => sum + parseFloat(m.monto || 0), 0)

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', backgroundColor:'#0b0f19', color:'white' }}>
      <div style={{ textAlign:'center' }}><div style={{ fontSize:'48px', marginBottom:'16px' }}>⏳</div><div>Cargando movimientos...</div></div>
    </div>
  )

  return (
    <ProtectedRoute>
      <div style={{ display:'flex', minHeight:'100vh', backgroundColor:'#0b0f19', fontFamily:'system-ui,-apple-system,sans-serif' }}>
        
        <style>{`
          @media (max-width:768px) {
            .sidebar { transform:translateX(-100%) !important; transition:transform .3s ease; }
            .sidebar.open { transform:translateX(0) !important; }
            .main-content { margin-left:0 !important; }
            .mobile-menu-btn { display:flex !important; }
            .overlay { display:block !important; }
          }
          @media (min-width:769px) {
            .overlay { display:none !important; }
            .mobile-menu-btn { display:none !important; }
          }
          @media print {
            aside, header, .no-print, .overlay { display:none !important; }
            main { margin-left:0 !important; padding:20px !important; }
            body { background:white !important; color:black !important; }
            * { color:black !important; background:white !important; }
          }
        `}</style>

        <div className="overlay" onClick={() => setSidebarOpen(false)} style={{ display:'none', position:'fixed', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,.5)', zIndex:40 }} />

        {/* ✅ SIDEBAR */}
        <aside className={`sidebar ${sidebarOpen?'open':''}`} style={{ width:'280px', backgroundColor:'#111827', borderRight:'1px solid #1f2937', position:'fixed', top:0, left:0, bottom:0, display:'flex', flexDirection:'column', zIndex:50 }}>
          <div style={{ padding:'24px 20px', borderBottom:'1px solid #1f2937' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'24px' }}>
              <div style={{ fontSize:'24px', fontWeight:'bold', color:'#3b82f6' }}>💼</div>
              <div style={{ fontSize:'20px', fontWeight:'bold', color:'white' }}>PrestaLista</div>
            </div>
            <div style={{ backgroundColor:'#1f2937', borderRadius:'12px', padding:'12px', display:'flex', alignItems:'center', gap:'12px' }}>
              <div style={{ width:'48px', height:'48px', borderRadius:'50%', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', fontWeight:'bold', color:'white', background:avatarUrl?'transparent':'linear-gradient(135deg,#3b82f6,#8b5cf6)', flexShrink:0 }}>
                {avatarUrl ? <img src={avatarUrl} alt="Avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : getInitials()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:'600', fontSize:'14px', color:'white', marginBottom:'2px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.full_name || 'Usuario'}</div>
                <div style={{ display:'inline-block', padding:'2px 8px', borderRadius:'4px', fontSize:'10px', fontWeight:'600', textTransform:'uppercase', backgroundColor:getRoleColor().backgroundColor, color:getRoleColor().color }}>{user?.role || 'ADMIN'}</div>
              </div>
            </div>
          </div>
          <nav style={{ flex:1, overflowY:'auto', padding:'16px 12px' }}>
            <Link href="/dashboard" onClick={() => setSidebarOpen(false)} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 16px', color:'#9ca3af', borderRadius:'8px', marginBottom:'4px', textDecoration:'none' }}><span style={{ fontSize:'18px' }}>📊</span><span style={{ fontWeight:'500' }}>Dashboard</span></Link>
            <Link href="/prestamos" onClick={() => setSidebarOpen(false)} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 16px', color:'#9ca3af', borderRadius:'8px', marginBottom:'4px', textDecoration:'none' }}><span style={{ fontSize:'18px' }}>📄</span><span>Préstamos</span></Link>
            <Link href="/movimientos" onClick={() => setSidebarOpen(false)} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 16px', background:'rgba(59,130,246,.15)', color:'#60a5fa', borderRadius:'8px', marginBottom:'4px', textDecoration:'none', fontWeight:'600' }}><span style={{ fontSize:'18px' }}>📋</span><span>Movimientos</span></Link>
            {isAdmin() && <Link href="/prestatarios" onClick={() => setSidebarOpen(false)} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 16px', color:'#9ca3af', borderRadius:'8px', marginBottom:'4px', textDecoration:'none' }}><span style={{ fontSize:'18px' }}>👤</span><span>Prestatarios</span></Link>}
            {isAdmin() && <Link href="/distribuidores" onClick={() => setSidebarOpen(false)} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 16px', color:'#9ca3af', borderRadius:'8px', marginBottom:'4px', textDecoration:'none' }}><span style={{ fontSize:'18px' }}>🤝</span><span>Distribuidores</span></Link>}
          </nav>
          <div style={{ padding:'20px', borderTop:'1px solid #1f2937' }}>
            <button onClick={() => { signOut(); setSidebarOpen(false); }} style={{ width:'100%', padding:'12px', backgroundColor:'#dc2626', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontSize:'14px', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}><span>🚪</span><span>Cerrar Sesión</span></button>
          </div>
        </aside>

        {/* ✅ MAIN CONTENT */}
        <main className="main-content" style={{ marginLeft:'280px', flex:1, minHeight:'100vh', backgroundColor:'#0b0f19' }}>
          <header style={{ backgroundColor:'#111827', borderBottom:'1px solid #1f2937', padding:'16px 32px', display:'flex', alignItems:'center', justifyContent:'flex-end', gap:'16px', position:'sticky', top:0, zIndex:30 }}>
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} style={{ display:'none', padding:'8px 12px', backgroundColor:'#3b82f6', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'20px', marginRight:'auto' }}>☰</button>
            <NotificationsBell />
          </header>

          <div style={{ padding:'32px' }}>
            
            {/* ✅ BANNER CON BOTONES IMPRIMIR Y EXPORTAR */}
            <div style={{ background:'linear-gradient(135deg,#3b82f6,#8b5cf6)', borderRadius:'16px', padding:'32px', marginBottom:'32px', boxShadow:'0 4px 6px rgba(0,0,0,.1)' }}>
              <h1 style={{ fontSize:'28px', fontWeight:'bold', margin:'0 0 8px 0', color:'white' }}>📋 Historial de Movimientos</h1>
              <p style={{ margin:'0 0 24px 0', opacity:0.9, color:'rgba(255,255,255,.9)' }}>Registro de pagos, préstamos y egresos</p>
              <div style={{ display:'flex', gap:'12px' }}>
                <button onClick={() => window.print()} className="no-print" style={{ flex:1, padding:'12px 24px', backgroundColor:'rgba(255,255,255,.2)', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'600', backdropFilter:'blur(4px)' }}>🖨️ Imprimir</button>
                <button onClick={exportarMovimientos} className="no-print" style={{ flex:1, padding:'12px 24px', backgroundColor:'#10b981', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'600' }}>📥 Exportar</button>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:'20px', marginBottom:'32px' }}>
              <div style={{ backgroundColor:'#111827', border:'1px solid #1f2937', borderRadius:'12px', padding:'24px' }}>
                <div style={{ color:'#9ca3af', fontSize:'14px', marginBottom:'8px' }}>Total Movimientos</div>
                <div style={{ fontSize:'32px', fontWeight:'bold', color:'#60a5fa' }}>{movimientosFiltrados.length}</div>
              </div>
              <div style={{ backgroundColor:'#111827', border:'1px solid #1f2937', borderRadius:'12px', padding:'24px' }}>
                <div style={{ color:'#9ca3af', fontSize:'14px', marginBottom:'8px' }}>Ingresos</div>
                <div style={{ fontSize:'32px', fontWeight:'bold', color:'#34d399' }}>${totalIngresos.toLocaleString()}</div>
              </div>
              <div style={{ backgroundColor:'#111827', border:'1px solid #1f2937', borderRadius:'12px', padding:'24px' }}>
                <div style={{ color:'#9ca3af', fontSize:'14px', marginBottom:'8px' }}>Egresos</div>
                <div style={{ fontSize:'32px', fontWeight:'bold', color:'#f87171' }}>${totalEgresos.toLocaleString()}</div>
              </div>
            </div>

            {/* Filtros */}
            <div style={{ backgroundColor:'#111827', border:'1px solid #1f2937', borderRadius:'12px', padding:'24px', marginBottom:'24px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))', gap:'16px' }}>
                <div>
                  <label style={{ color:'#9ca3af', fontSize:'13px', marginBottom:'8px', display:'block', fontWeight:'500' }}>🔍 Buscar por cliente</label>
                  <input type="text" placeholder="Escribe nombre o apellido..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }} style={{ width:'100%', padding:'12px', backgroundColor:'#030712', border:'1px solid #1f2937', borderRadius:'8px', color:'white', fontSize:'14px' }} />
                </div>
                <div>
                  <label style={{ color:'#9ca3af', fontSize:'13px', marginBottom:'8px', display:'block', fontWeight:'500' }}>📊 Filtrar por tipo</label>
                  <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)} style={{ width:'100%', padding:'12px', backgroundColor:'#030712', border:'1px solid #1f2937', borderRadius:'8px', color:'white', fontSize:'14px', cursor:'pointer' }}>
                    <option value="">Todos los tipos</option>
                    <option value="pago">💵 Pagos</option>
                    <option value="prestamo">📄 Préstamos</option>
                    <option value="egreso">💸 Egresos</option>
                  </select>
                </div>
                {(searchTerm || filterTipo) && (
                  <div style={{ display:'flex', alignItems:'flex-end' }}>
                    <button onClick={() => { setSearchTerm(''); setFilterTipo(''); setCurrentPage(1) }} style={{ padding:'12px 24px', backgroundColor:'#6b7280', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'600' }}>🔄 Limpiar</button>
                  </div>
                )}
              </div>
              <div style={{ marginTop:'16px', padding:'12px', backgroundColor:'#030712', borderRadius:'8px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ color:'#9ca3af', fontSize:'14px' }}>Mostrando {movimientosPage.length} de {movimientosFiltrados.length} movimientos</span>
                {totalPages>1 && <span style={{ color:'#60a5fa', fontSize:'14px', fontWeight:'600' }}>Página {currentPage} de {totalPages}</span>}
              </div>
            </div>

            {/* Lista */}
            <div style={{ backgroundColor:'#111827', border:'1px solid #1f2937', borderRadius:'12px', padding:'24px' }}>
              <h2 style={{ margin:'0 0 24px', fontSize:'20px', fontWeight:'600', color:'white' }}>Movimientos Registrados</h2>
              {movimientosPage.length===0 ? (
                <div style={{ textAlign:'center', padding:'60px 20px', color:'#6b7280' }}>
                  <div style={{ fontSize:'48px', marginBottom:'16px' }}>📭</div>
                  <div style={{ fontSize:'16px' }}>No hay movimientos {searchTerm || filterTipo ? 'que coincidan' : 'registrados aún'}</div>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                  {movimientosPage.map((m:any) => (
                    <div key={m.id} style={{ backgroundColor:'#0b0f19', border:'1px solid #1f2937', borderRadius:'12px', padding:'24px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', flexWrap:'wrap', gap:'16px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
                          <div style={{ width:'48px', height:'48px', backgroundColor:m.tipo==='pago'?'#065f46':m.tipo==='egreso'?'#7f1d1d':'#1e40af', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px' }}>
                            {m.tipo==='pago'?'💵':m.tipo==='egreso'?'💸':''}
                          </div>
                          <div>
                            <div style={{ fontWeight:'600', fontSize:'16px', color:'white', marginBottom:'4px' }}>{m.prestamo?.prestatario?`${m.prestamo.prestatario.nombre} ${m.prestamo.prestatario.apellido}`:'Sin cliente'}</div>
                            <div style={{ fontSize:'13px', color:'#9ca3af' }}>📅 {new Date(m.fecha).toLocaleDateString('es-MX', { year:'numeric', month:'short', day:'numeric' })}</div>
                          </div>
                        </div>
                        {getTipoBadge(m.tipo)}
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:'16px', paddingTop:'20px', borderTop:'1px solid #1f2937' }}>
                        <div>
                          <div style={{ fontSize:'12px', color:'#9ca3af', marginBottom:'4px' }}>Monto</div>
                          <div style={{ fontSize:'24px', fontWeight:'bold', color:m.tipo==='egreso'?'#f87171':'#34d399' }}>
                            {m.tipo==='egreso'?'-':'+'}${parseFloat(m.monto||0).toLocaleString()}
                          </div>
                        </div>
                        {m.notas && <div style={{ gridColumn:'1/-1' }}><div style={{ fontSize:'12px', color:'#9ca3af', marginBottom:'4px' }}>Notas</div><div style={{ fontSize:'14px', color:'#d1d5db', fontStyle:'italic' }}>{m.notas}</div></div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Paginación */}
              {totalPages>1 && (
                <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:'12px', marginTop:'32px', paddingTop:'24px', borderTop:'1px solid #1f2937' }}>
                  <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1} style={{ padding:'10px 20px', backgroundColor:currentPage===1?'#374151':'#3b82f6', color:'white', border:'none', borderRadius:'8px', cursor:currentPage===1?'not-allowed':'pointer', opacity:currentPage===1?0.5:1, fontWeight:'600' }}>← Anterior</button>
                  <div style={{ display:'flex', gap:'6px' }}>
                    {Array.from({ length:Math.min(5, totalPages) }, (_,i) => {
                      let pn; if(totalPages<=5) pn=i+1; else if(currentPage<=3) pn=i+1; else if(currentPage>=totalPages-2) pn=totalPages-4+i; else pn=currentPage-2+i;
                      return <button key={pn} onClick={() => setCurrentPage(pn)} style={{ padding:'10px 16px', backgroundColor:currentPage===pn?'#3b82f6':'#1f2937', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:currentPage===pn?'600':'400', minWidth:'44px' }}>{pn}</button>
                    })}
                  </div>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage>=totalPages} style={{ padding:'10px 20px', backgroundColor:currentPage>=totalPages?'#374151':'#3b82f6', color:'white', border:'none', borderRadius:'8px', cursor:currentPage>=totalPages?'not-allowed':'pointer', opacity:currentPage>=totalPages?0.5:1, fontWeight:'600' }}>Siguiente →</button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
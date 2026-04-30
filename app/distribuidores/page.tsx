// app/distribuidores/page.tsx - LAYOUT PROFESIONAL COMPLETO
'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabaseClient'
import ProtectedRoute from '../lib/ProtectedRoute'
import NotificationsBell from '../components/NotificationsBell'

export default function DistribuidoresPage() {
  const { user, signOut, isAdmin } = useAuth()
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [distribuidores, setDistribuidores] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10
  
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    nombre: '', email: '', telefono: '', comision_porcentaje: '10'
  })
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => { 
    loadDistribuidores()
    if (user?.id) loadAvatar()
  }, [user])

  const loadAvatar = async () => {
    try {
      const { data } = await supabase.from('user_profiles').select('avatar_url').eq('id', user.id).single()
      if (data?.avatar_url) setAvatarUrl(data.avatar_url)
    } catch (err) { console.error('Error avatar:', err) }
  }

  const loadDistribuidores = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from('distribuidores').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setDistribuidores(data || [])
    } catch (err) { console.error('Error:', err) } finally { setLoading(false) }
  }

  const handleAvatarClick = () => fileInputRef.current?.click()
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return
    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
      await supabase.from('user_profiles').upsert({ id: user.id, avatar_url: data.publicUrl, email: user?.email || null })
      setAvatarUrl(data.publicUrl)
      alert('✅ Avatar actualizado')
    } catch (err: any) { alert('Error: ' + err.message) } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // ✅ EXPORTAR A CSV
  const exportarDistribuidores = () => {
    const BOM = '\uFEFF'
    const headers = 'Nombre;Email;Teléfono;Comisión %;Fecha Registro'
    const rows = distribuidoresFiltrados.map((d: any) => [
      d.nombre || '', d.email || '', d.telefono || '', d.comision_porcentaje || '0',
      new Date(d.created_at).toLocaleDateString('es-MX')
    ].join(';'))
    const csv = BOM + [headers, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `distribuidores_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const getUserInitials = () => {
    if (user?.full_name) {
      const n = user.full_name.split(' ')
      return n.length >= 2 ? `${n[0][0]}${n[n.length-1][0]}`.toUpperCase() : user.full_name[0].toUpperCase()
    }
    return user?.email?.[0]?.toUpperCase() || 'U'
  }

  const getRoleColor = () => ({ backgroundColor: '#7c3aed', color: '#fff' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nombre || !formData.email) return alert('📋 Nombre y email son obligatorios')
    setFormLoading(true)
    try {
      const { data: insertedDist, error } = await supabase.from('distribuidores').insert({
        nombre: formData.nombre.trim(),
        email: formData.email.trim(),
        telefono: formData.telefono?.trim() || null,
        comision_porcentaje: parseFloat(formData.comision_porcentaje) || 10
      }).select().single()

      if (error) throw error

      // ✅ CREAR NOTIFICACIÓN (PARA QUE SUENE EL AUDIO)
      if (user?.id && insertedDist) {
        await supabase.from('notifications').insert({
          user_id: user.id,
          type: 'nuevo_lead',
          title: '🤝 Nuevo Distribuidor Registrado',
          message: formData.nombre,
          data: { distribuidor_id: insertedDist.id },
          read: false
        })
      }
      
      alert('✅ Distribuidor registrado exitosamente')
      setFormData({ nombre: '', email: '', telefono: '', comision_porcentaje: '10' })
      loadDistribuidores()
    } catch (err: any) { alert('Error: ' + err.message) } finally { setFormLoading(false) }
  }

  const handleEliminar = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar a ${nombre}?`)) return
    try {
      const { error } = await supabase.from('distribuidores').delete().eq('id', id)
      if (error) throw error
      alert('✅ Distribuidor eliminado')
      loadDistribuidores()
    } catch (err: any) { alert('Error: ' + err.message) }
  }

  const distribuidoresFiltrados = distribuidores.filter(d => {
    const nombre = d.nombre?.toLowerCase() || ''
    const email = d.email?.toLowerCase() || ''
    return searchTerm === '' || nombre.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase())
  })

  const totalPages = Math.ceil(distribuidoresFiltrados.length / ITEMS_PER_PAGE)
  const start = (currentPage - 1) * ITEMS_PER_PAGE
  const end = start + ITEMS_PER_PAGE
  const pageItems = distribuidoresFiltrados.slice(start, end)

  if (loading) return <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', backgroundColor:'#0b0f19', color:'white' }}><div style={{ textAlign:'center' }}><div style={{ fontSize:'48px', marginBottom:'16px' }}>⏳</div><div>Cargando...</div></div></div>

  return (
    <ProtectedRoute>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display:'none' }} />
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

        {/* SIDEBAR */}
        <aside className={`sidebar ${sidebarOpen?'open':''}`} style={{ width:'280px', backgroundColor:'#111827', borderRight:'1px solid #1f2937', position:'fixed', top:0, left:0, bottom:0, display:'flex', flexDirection:'column', zIndex:50 }}>
          <div style={{ padding:'24px 20px', borderBottom:'1px solid #1f2937' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'24px' }}>
              <div style={{ fontSize:'24px', fontWeight:'bold', color:'#3b82f6' }}>💼</div>
              <div style={{ fontSize:'20px', fontWeight:'bold', color:'white' }}>PrestaLista</div>
            </div>
            <div onClick={handleAvatarClick} style={{ backgroundColor:'#1f2937', borderRadius:'12px', padding:'12px', display:'flex', alignItems:'center', gap:'12px', cursor:'pointer' }}>
              <div style={{ width:'48px', height:'48px', borderRadius:'50%', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', fontWeight:'bold', color:'white', background:avatarUrl?'transparent':'linear-gradient(135deg,#3b82f6,#8b5cf6)', flexShrink:0, position:'relative' }}>
                {uploading ? <span style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.6)', display:'flex', alignItems:'center', justifyContent:'center' }}>⏳</span> : avatarUrl ? <img src={avatarUrl} alt="Avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : getUserInitials()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:'600', fontSize:'14px', color:'white', marginBottom:'2px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.full_name || 'Usuario'}</div>
                <div style={{ display:'inline-block', padding:'2px 8px', borderRadius:'4px', fontSize:'10px', fontWeight:'600', textTransform:'uppercase', backgroundColor:getRoleColor().backgroundColor, color:getRoleColor().color }}>{user?.role || 'ADMIN'}</div>
              </div>
              <span style={{ fontSize:'16px', color:'#6b7280' }}>📷</span>
            </div>
          </div>
          <nav style={{ flex:1, overflowY:'auto', padding:'16px 12px' }}>
            <Link href="/dashboard" onClick={() => setSidebarOpen(false)} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 16px', color:'#9ca3af', borderRadius:'8px', marginBottom:'4px', textDecoration:'none' }}><span style={{ fontSize:'18px' }}>📊</span><span style={{ fontWeight:'500' }}>Dashboard</span></Link>
            <Link href="/prestamos" onClick={() => setSidebarOpen(false)} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 16px', color:'#9ca3af', borderRadius:'8px', marginBottom:'4px', textDecoration:'none' }}><span style={{ fontSize:'18px' }}>📄</span><span>Préstamos</span></Link>
            <Link href="/movimientos" onClick={() => setSidebarOpen(false)} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 16px', color:'#9ca3af', borderRadius:'8px', marginBottom:'4px', textDecoration:'none' }}><span style={{ fontSize:'18px' }}>📋</span><span>Movimientos</span></Link>
            <Link href="/prestatarios" onClick={() => setSidebarOpen(false)} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 16px', color:'#9ca3af', borderRadius:'8px', marginBottom:'4px', textDecoration:'none' }}><span style={{ fontSize:'18px' }}>👤</span><span>Prestatarios</span></Link>
            <Link href="/distribuidores" onClick={() => setSidebarOpen(false)} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 16px', background:'rgba(59,130,246,.15)', color:'#60a5fa', borderRadius:'8px', marginBottom:'4px', textDecoration:'none', fontWeight:'600' }}><span style={{ fontSize:'18px' }}>🤝</span><span>Distribuidores</span></Link>
          </nav>
          <div style={{ padding:'20px', borderTop:'1px solid #1f2937' }}>
            <button onClick={() => { signOut(); setSidebarOpen(false); }} style={{ width:'100%', padding:'12px', backgroundColor:'#dc2626', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontSize:'14px', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}><span>🚪</span><span>Cerrar Sesión</span></button>
          </div>
        </aside>

        {/* MAIN */}
        <main className="main-content" style={{ marginLeft:'280px', flex:1, minHeight:'100vh', backgroundColor:'#0b0f19' }}>
          <header style={{ backgroundColor:'#111827', borderBottom:'1px solid #1f2937', padding:'16px 32px', display:'flex', alignItems:'center', justifyContent:'flex-end', gap:'16px', position:'sticky', top:0, zIndex:30 }}>
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} style={{ display:'none', padding:'8px 12px', backgroundColor:'#3b82f6', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'20px', marginRight:'auto' }}>☰</button>
            <NotificationsBell />
          </header>

          <div style={{ padding:'32px' }}>
            
            {/* BANNER CON BOTONES */}
            <div style={{ background:'linear-gradient(135deg,#f59e0b,#8b5cf6)', borderRadius:'16px', padding:'32px', marginBottom:'32px', boxShadow:'0 4px 6px rgba(0,0,0,.1)' }}>
              <h1 style={{ fontSize:'28px', fontWeight:'bold', margin:'0 0 8px 0', color:'white' }}>🤝 Gestión de Distribuidores</h1>
              <p style={{ margin:'0 0 24px 0', opacity:0.9, color:'rgba(255,255,255,.9)' }}>Administra tus socios distribuidores y sus comisiones</p>
              <div style={{ display:'flex', gap:'12px' }}>
                <button onClick={() => window.print()} className="no-print" style={{ flex:1, padding:'12px 24px', backgroundColor:'rgba(255,255,255,.2)', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'600', backdropFilter:'blur(4px)' }}>🖨️ Imprimir</button>
                <button onClick={exportarDistribuidores} className="no-print" style={{ flex:1, padding:'12px 24px', backgroundColor:'#10b981', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'600' }}>📥 Exportar</button>
              </div>
            </div>

            {/* Formulario */}
            <div style={{ backgroundColor:'#111827', border:'1px solid #1f2937', borderRadius:'12px', padding:'32px', marginBottom:'32px' }}>
              <h2 style={{ margin:'0 0 24px', fontSize:'20px', fontWeight:'600', color:'white' }}>📝 Nuevo Distribuidor</h2>
              <form onSubmit={handleSubmit}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))', gap:'16px' }}>
                  <div><label style={{ color:'#9ca3af', fontSize:'13px', marginBottom:'8px', display:'block', fontWeight:'500' }}>Nombre *</label><input type="text" placeholder="Nombre completo" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre:e.target.value})} required style={{ width:'100%', padding:'12px', backgroundColor:'#030712', border:'1px solid #1f2937', borderRadius:'8px', color:'white', fontSize:'14px' }} /></div>
                  <div><label style={{ color:'#9ca3af', fontSize:'13px', marginBottom:'8px', display:'block', fontWeight:'500' }}>Email *</label><input type="email" placeholder="correo@email.com" value={formData.email} onChange={(e) => setFormData({...formData, email:e.target.value})} required style={{ width:'100%', padding:'12px', backgroundColor:'#030712', border:'1px solid #1f2937', borderRadius:'8px', color:'white', fontSize:'14px' }} /></div>
                  <div><label style={{ color:'#9ca3af', fontSize:'13px', marginBottom:'8px', display:'block', fontWeight:'500' }}>Teléfono</label><input type="tel" placeholder="+52 555 123 4567" value={formData.telefono} onChange={(e) => setFormData({...formData, telefono:e.target.value})} style={{ width:'100%', padding:'12px', backgroundColor:'#030712', border:'1px solid #1f2937', borderRadius:'8px', color:'white', fontSize:'14px' }} /></div>
                  <div><label style={{ color:'#9ca3af', fontSize:'13px', marginBottom:'8px', display:'block', fontWeight:'500' }}>Comisión %</label><input type="number" step="0.01" placeholder="10" value={formData.comision_porcentaje} onChange={(e) => setFormData({...formData, comision_porcentaje:e.target.value})} style={{ width:'100%', padding:'12px', backgroundColor:'#030712', border:'1px solid #1f2937', borderRadius:'8px', color:'white', fontSize:'14px' }} /></div>
                </div>
                <div style={{ marginTop:'24px' }}><button type="submit" disabled={formLoading} style={{ width:'100%', padding:'16px', background:'linear-gradient(135deg,#3b82f6,#2563eb)', color:'white', border:'none', borderRadius:'8px', cursor:formLoading?'not-allowed':'pointer', fontWeight:'600', fontSize:'16px', opacity:formLoading?0.7:1 }}>{formLoading?'⏳ Registrando...':'💾 Registrar'}</button></div>
              </form>
            </div>

            {/* Búsqueda */}
            <div style={{ backgroundColor:'#111827', border:'1px solid #1f2937', borderRadius:'12px', padding:'24px', marginBottom:'24px' }}>
              <div style={{ display:'flex', gap:'16px', alignItems:'flex-end' }}>
                <div style={{ flex:1 }}><label style={{ color:'#9ca3af', fontSize:'13px', marginBottom:'8px', display:'block', fontWeight:'500' }}>🔍 Buscar distribuidor</label><input type="text" placeholder="Nombre o email..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }} style={{ width:'100%', padding:'12px', backgroundColor:'#030712', border:'1px solid #1f2937', borderRadius:'8px', color:'white', fontSize:'14px' }} /></div>
                {searchTerm && <button onClick={() => { setSearchTerm(''); setCurrentPage(1) }} style={{ padding:'12px 24px', backgroundColor:'#6b7280', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'600' }}>🔄 Limpiar</button>}
              </div>
              <div style={{ marginTop:'16px', padding:'12px', backgroundColor:'#030712', borderRadius:'8px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ color:'#9ca3af', fontSize:'14px' }}>Mostrando {pageItems.length} de {distribuidoresFiltrados.length} distribuidores</span>
                {totalPages>1 && <span style={{ color:'#60a5fa', fontSize:'14px', fontWeight:'600' }}>Página {currentPage} de {totalPages}</span>}
              </div>
            </div>

            {/* Lista */}
            <div style={{ backgroundColor:'#111827', border:'1px solid #1f2937', borderRadius:'12px', padding:'24px' }}>
              <h2 style={{ margin:'0 0 24px', fontSize:'20px', fontWeight:'600', color:'white' }}>Distribuidores Registrados ({distribuidoresFiltrados.length})</h2>
              {pageItems.length===0 ? (
                <div style={{ textAlign:'center', padding:'60px 20px', color:'#6b7280' }}><div style={{ fontSize:'48px', marginBottom:'16px' }}>🤝</div><div style={{ fontSize:'16px' }}>No hay distribuidores {searchTerm?'que coincidan':'registrados'}</div></div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                  {pageItems.map((d:any) => (
                    <div key={d.id} style={{ backgroundColor:'#0b0f19', border:'1px solid #1f2937', borderRadius:'12px', padding:'20px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px', flexWrap:'wrap', gap:'12px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
                          <div style={{ width:'56px', height:'56px', backgroundColor:'#7c3aed', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', fontWeight:'bold', color:'white', flexShrink:0 }}>
                            {d.nombre?.[0]?.toUpperCase() || 'D'}
                          </div>
                          <div>
                            <div style={{ fontWeight:'600', fontSize:'16px', color:'white', marginBottom:'4px' }}>{d.nombre}</div>
                            <div style={{ fontSize:'13px', color:'#9ca3af' }}>📧 {d.email}</div>
                            {d.telefono && <div style={{ fontSize:'13px', color:'#9ca3af' }}>📞 {d.telefono}</div>}
                          </div>
                        </div>
                        <div style={{ padding:'6px 12px', backgroundColor:'#065f46', color:'#34d399', borderRadius:'9999px', fontSize:'12px', fontWeight:'600' }}>
                          {d.comision_porcentaje}% comisión
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:'12px' }}>
                        <button onClick={() => alert('Función de editar en desarrollo')} style={{ flex:1, padding:'10px', backgroundColor:'#2563eb', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'600' }}>✏️ Editar</button>
                        <button onClick={() => handleEliminar(d.id, d.nombre)} style={{ flex:1, padding:'10px', backgroundColor:'#dc2626', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'600' }}>🗑️ Eliminar</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
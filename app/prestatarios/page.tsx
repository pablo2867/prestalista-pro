// app/prestatarios/page.tsx - LAYOUT PROFESIONAL CON AVATAR FUNCIONAL
'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabaseClient'
import ProtectedRoute from '../lib/ProtectedRoute'
import NotificationsBell from '../components/NotificationsBell'

export default function PrestatariosPage() {
  const { user, signOut, isAdmin, isDistributor } = useAuth()
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [prestatarios, setPrestatarios] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10
  
  // ✅ Estados para el avatar
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
    direccion: ''
  })
  const [formLoading, setFormLoading] = useState(false)

  // ✅ Cargar datos y Avatar al inicio
  useEffect(() => {
    loadPrestatarios()
    if (user?.id) {
      loadAvatar()
    }
  }, [user])

  const loadAvatar = async () => {
    try {
      const { data } = await supabase.from('user_profiles').select('avatar_url').eq('id', user.id).single()
      if (data?.avatar_url) setAvatarUrl(data.avatar_url)
    } catch (err) {
      console.error('Error cargando avatar:', err)
    }
  }

  const loadPrestatarios = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('prestatarios')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setPrestatarios(data || [])
    } catch (err) {
      console.error('Error cargando prestatarios:', err)
    } finally {
      setLoading(false)
    }
  }

  // ✅ LÓGICA DE SUBIDA DE AVATAR
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
      const publicUrl = data.publicUrl
      
      await supabase.from('user_profiles').upsert({ 
        id: user.id, 
        avatar_url: publicUrl,
        email: user?.email || null,
        updated_at: new Date().toISOString()
      })
      
      setAvatarUrl(publicUrl)
      alert('✅ Avatar actualizado')
      
    } catch (err: any) {
      console.error('Error:', err)
      alert('Error: ' + err.message)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const getInitials = (nombre?: string, apellido?: string) => {
    if (nombre && apellido) {
      return `${nombre[0]}${apellido[0]}`.toUpperCase()
    }
    if (user?.full_name) {
      const names = user.full_name.split(' ')
      return names.length >= 2 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : user.full_name[0].toUpperCase()
    }
    return user?.email?.[0]?.toUpperCase() || 'U'
  }

  const getUserInitials = () => {
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

  const getStatusBadge = (estado: string) => {
    const styles: Record<string, any> = {
      activo: { backgroundColor: '#065f46', color: '#34d399' },
      moroso: { backgroundColor: '#7f1d1d', color: '#f87171' },
      cancelado: { backgroundColor: '#374151', color: '#9ca3af' }
    }
    return <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: '600', ...styles[estado] }}>{estado?.toUpperCase()}</span>
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nombre || !formData.apellido) return alert('👤 Nombre y apellido son obligatorios')

    setFormLoading(true)
    try {
      const { error } = await supabase
        .from('prestatarios')
        .insert({
          nombre: formData.nombre.trim(),
          apellido: formData.apellido.trim(),
          telefono: formData.telefono?.trim() || null,
          email: formData.email?.trim() || null,
          direccion: formData.direccion?.trim() || null
        })
      
      if (error) throw error
      
      alert('✅ Cliente registrado exitosamente')
      setFormData({ nombre: '', apellido: '', telefono: '', email: '', direccion: '' })
      loadPrestatarios()
      
    } catch (err: any) {
      console.error('Error:', err)
      alert('Error: ' + err.message)
    } finally {
      setFormLoading(false)
    }
  }

  const prestatariosFiltrados = prestatarios.filter((p) => {
    const nombreCompleto = `${p.nombre} ${p.apellido}`.toLowerCase()
    return searchTerm === '' || nombreCompleto.includes(searchTerm.toLowerCase())
  })

  const totalPages = Math.ceil(prestatariosFiltrados.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const prestatariosPage = prestatariosFiltrados.slice(startIndex, endIndex)

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0b0f19', color: 'white' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
        <div>Cargando clientes...</div>
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
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold', color: 'white', background: avatarUrl ? 'transparent' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)', flexShrink: 0, position: 'relative' }}>
                {uploading ? (
                  <span style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⏳</span>
                ) : avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  getUserInitials()
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: '600', fontSize: '14px', color: 'white', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.full_name || 'Usuario'}</div>
                <div style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', backgroundColor: getRoleColor().backgroundColor, color: getRoleColor().color }}>{user?.role || 'ADMIN'}</div>
              </div>
              <span style={{ fontSize: '16px', color: '#6b7280' }}>📷</span>
            </div>
          </div>
          <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
            <Link href="/dashboard" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}><span style={{ fontSize: '18px' }}>📊</span><span style={{ fontWeight: '500' }}>Dashboard</span></Link>
            <Link href="/prestamos" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}><span style={{ fontSize: '18px' }}>📄</span><span>Préstamos</span></Link>
            <Link href="/movimientos" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}><span style={{ fontSize: '18px' }}>📋</span><span>Movimientos</span></Link>
            <Link href="/prestatarios" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none', fontWeight: '600' }}><span style={{ fontSize: '18px' }}>👤</span><span>Prestatarios</span></Link>
            {isAdmin() && <Link href="/distribuidores" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}><span style={{ fontSize: '18px' }}>🤝</span><span>Distribuidores</span></Link>}
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
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0', color: 'white' }}>👤 Gestión de Clientes</h1>
              <p style={{ margin: '0 0 24px 0', opacity: 0.9, color: 'rgba(255,255,255,0.9)' }}>Administra todos los prestatarios</p>
            </div>

            {/* Formulario Nuevo Cliente */}
            <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '32px', marginBottom: '32px' }}>
              <h2 style={{ margin: '0 0 24px', fontSize: '20px', fontWeight: '600', color: 'white' }}>📝 Nuevo Cliente</h2>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block', fontWeight: '500' }}>Nombre *</label>
                    <input type="text" placeholder="Nombre" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} required style={{ width: '100%', padding: '12px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: '14px' }} />
                  </div>
                  <div>
                    <label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block', fontWeight: '500' }}>Apellido *</label>
                    <input type="text" placeholder="Apellido" value={formData.apellido} onChange={(e) => setFormData({...formData, apellido: e.target.value})} required style={{ width: '100%', padding: '12px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: '14px' }} />
                  </div>
                  <div>
                    <label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block', fontWeight: '500' }}>Teléfono</label>
                    <input type="tel" placeholder="555-9999" value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})} style={{ width: '100%', padding: '12px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: '14px' }} />
                  </div>
                  <div>
                    <label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block', fontWeight: '500' }}>Email</label>
                    <input type="email" placeholder="correo@email.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} style={{ width: '100%', padding: '12px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: '14px' }} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block', fontWeight: '500' }}>Dirección</label>
                    <input type="text" placeholder="Dirección completa" value={formData.direccion} onChange={(e) => setFormData({...formData, direccion: e.target.value})} style={{ width: '100%', padding: '12px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: '14px' }} />
                  </div>
                </div>
                <div style={{ marginTop: '24px' }}>
                  <button type="submit" disabled={formLoading} style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', border: 'none', borderRadius: '8px', cursor: formLoading ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '16px', opacity: formLoading ? 0.7 : 1 }}>
                    {formLoading ? '⏳ Registrando...' : '💾 Registrar Cliente'}
                  </button>
                </div>
              </form>
            </div>

            {/* Búsqueda */}
            <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block', fontWeight: '500' }}>🔍 Buscar cliente</label>
                  <input type="text" placeholder="Nombre o apellido..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }} style={{ width: '100%', padding: '12px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: '14px' }} />
                </div>
                {searchTerm && (
                  <button onClick={() => { setSearchTerm(''); setCurrentPage(1) }} style={{ padding: '12px 24px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>🔄 Limpiar</button>
                )}
              </div>
              <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#030712', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#9ca3af', fontSize: '14px' }}>Mostrando {prestatariosPage.length} de {prestatariosFiltrados.length} clientes</span>
                {totalPages > 1 && <span style={{ color: '#60a5fa', fontSize: '14px', fontWeight: '600' }}>Página {currentPage} de {totalPages}</span>}
              </div>
            </div>

            {/* Lista de Clientes */}
            <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '24px' }}>
              <h2 style={{ margin: '0 0 24px', fontSize: '20px', fontWeight: '600', color: 'white' }}>Clientes Registrados ({prestatariosFiltrados.length})</h2>
              {prestatariosPage.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
                  <div style={{ fontSize: '16px' }}>No hay clientes {searchTerm ? 'que coincidan' : 'registrados'}</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {prestatariosPage.map((p: any) => (
                    <div key={p.id} style={{ backgroundColor: '#0b0f19', border: '1px solid #1f2937', borderRadius: '12px', padding: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: '56px', height: '56px', backgroundColor: '#1e40af', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', color: 'white', flexShrink: 0 }}>
                            {getInitials(p.nombre, p.apellido)}
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '18px', color: 'white', marginBottom: '4px' }}>{p.nombre} {p.apellido}</div>
                            <div>{getStatusBadge(p.estado || 'activo')}</div>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', paddingTop: '16px', borderTop: '1px solid #1f2937' }}>
                        {p.telefono && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#9ca3af' }}>
                            <span>📞</span>
                            <span>{p.telefono}</span>
                          </div>
                        )}
                        {p.email && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#9ca3af' }}>
                            <span>✉️</span>
                            <span>{p.email}</span>
                          </div>
                        )}
                        {p.direccion && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#9ca3af', gridColumn: '1 / -1' }}>
                            <span>📍</span>
                            <span>{p.direccion}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #1f2937' }}>
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: '10px 20px', backgroundColor: currentPage === 1 ? '#374151' : '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1, fontWeight: '600' }}>← Anterior</button>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) pageNum = i + 1
                      else if (currentPage <= 3) pageNum = i + 1
                      else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i
                      else pageNum = currentPage - 2 + i
                      return <button key={pageNum} onClick={() => setCurrentPage(pageNum)} style={{ padding: '10px 16px', backgroundColor: currentPage === pageNum ? '#3b82f6' : '#1f2937', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: currentPage === pageNum ? '600' : '400', minWidth: '44px' }}>{pageNum}</button>
                    })}
                  </div>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} style={{ padding: '10px 20px', backgroundColor: currentPage >= totalPages ? '#374151' : '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', opacity: currentPage >= totalPages ? 0.5 : 1, fontWeight: '600' }}>Siguiente →</button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
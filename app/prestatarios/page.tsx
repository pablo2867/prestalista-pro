'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const GOOGLE_SHEETS_WEBHOOK = 'https://script.google.com/macros/s/AKfycbwG1NOvxloQyn-g1widdBX0exHo0HE_2TpDC9tXUnzxDsM480tMVnce356tHZ-xkGeMDA/exec'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

type Prestatario = {
  id: string
  nombre_completo: string | null
  documento: string | null
  telefono: string | null
  email: string | null
  direccion: string | null
  estado: 'activo' | 'inactivo' | 'moroso'
  notas: string | null
  created_at: string
}

export default function PrestatariosPage() {
  const [data, setData] = useState<Prestatario[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [form, setForm] = useState({ nombre_completo: '', documento: '', telefono: '', email: '', direccion: '', estado: 'activo' as Prestatario['estado'], notas: '' })

  useEffect(() => { if (!supabase) { setToast({ msg: 'Error de configuración', type: 'error' }); setLoading(false); return } fetchPrestatarios() }, [])

  const fetchPrestatarios = async () => {
    if (!supabase) return
    setLoading(true)
    try {
      const { data, error } = await supabase.from('prestatarios').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setData(data || [])
    } catch (err: any) { setToast({ msg: 'Error: ' + err.message, type: 'error' }) }
    setLoading(false)
  }

  const showToast = (msg: string, type: 'success' | 'error') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000) }

  const handleSave = async () => {
    if (!form.nombre_completo.trim()) return showToast('Nombre obligatorio', 'error')
    setLoading(true)
    // ✅ CORRECCIÓN DEFINITIVA: Sintaxis correcta con "data:"
    const {  { user } } = await supabase.auth.getUser()
    if (!user) { showToast('Error de autenticación', 'error'); setLoading(false); return }
    const { error } = editingId ? await supabase.from('prestatarios').update({ ...form, user_id: user.id }).eq('id', editingId) : await supabase.from('prestatarios').insert([{ ...form, user_id: user.id }])
    if (error) { showToast('Error: ' + error.message, 'error') }
    else { showToast(editingId ? 'Actualizado' : 'Creado correctamente', 'success'); await fetchPrestatarios(); resetForm() }
    setLoading(false)
  }

  const handleDelete = async (id: string) => { if (!confirm('¿Desactivar?')) return; const { error } = await supabase.from('prestatarios').update({ estado: 'inactivo' }).eq('id', id); if (error) showToast('Error', 'error'); else { showToast('Desactivado', 'success'); fetchPrestatarios() } }
  const openEdit = (p: Prestatario) => { setEditingId(p.id); setForm({ nombre_completo: p.nombre_completo || '', documento: p.documento || '', telefono: p.telefono || '', email: p.email || '', direccion: p.direccion || '', estado: p.estado, notas: p.notas || '' }); setModalOpen(true) }
  const resetForm = () => { setEditingId(null); setForm({ nombre_completo: '', documento: '', telefono: '', email: '', direccion: '', estado: 'activo', notas: '' }); setModalOpen(false) }

  const syncToSheets = async () => {
    setSyncing(true)
    const payload = data.map(p => ({ ID: p.id, Nombre: p.nombre_completo || '', Documento: p.documento || '', Telefono: p.telefono || '', Email: p.email || '', Direccion: p.direccion || '', Estado: p.estado, Notas: p.notas || '', Creado: new Date(p.created_at).toLocaleString('es-MX') }))
    try { 
      await fetch(GOOGLE_SHEETS_WEBHOOK, { 
        method: 'POST', 
        mode: 'no-cors', 
        keepalive: true, 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ tipo: 'Prestatario', datos: payload, fecha: new Date().toISOString() }) 
      }); 
      showToast('✅ Sincronizado en hoja "Prestatarios"', 'success') 
    }
    catch { showToast('❌ Error de conexión', 'error') }
    setSyncing(false)
  }

  const exportarCSV = () => {
    if (data.length === 0) return showToast('No hay datos para exportar', 'error')
    const BOM = '\uFEFF'
    const headers = 'ID;Nombre;Documento;Telefono;Email;Direccion;Estado;Notas;Creado'
    const rows = data.map(p => [
      p.id,
      `"${(p.nombre_completo || '').replace(/"/g, '""')}"`,
      p.documento || '',
      p.telefono || '',
      p.email || '',
      `"${(p.direccion || '').replace(/"/g, '""')}"`,
      p.estado,
      `"${(p.notas || '').replace(/"/g, '""')}"`,
      new Date(p.created_at).toLocaleString('es-MX')
    ].join(';'))
    const csvContent = BOM + [headers, ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a'); link.href = url; link.download = `Prestatarios_${new Date().toISOString().split('T')[0]}.csv`; document.body.appendChild(link); link.click(); document.body.removeChild(link)
    URL.revokeObjectURL(url)
    showToast('📥 CSV descargado', 'success')
  }

  const imprimir = () => { window.print() }

  const filtered = data.filter(p => { const term = search.toLowerCase(); return String(p.nombre_completo ?? '').toLowerCase().includes(term) || String(p.documento ?? '').toLowerCase().includes(term) })

  return (
    <div className="no-print" style={{ minHeight: '100vh', backgroundColor: '#0b0f19', color: 'white', padding: '32px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {toast && <div style={{ position: 'fixed', top: '20px', right: '20px', padding: '12px 24px', borderRadius: '8px', backgroundColor: toast.type === 'success' ? '#059669' : '#dc2626', color: 'white', fontWeight: '600', zIndex: 1000 }}>{toast.msg}</div>}
      
      <div style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', borderRadius: '16px', padding: '32px', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0', color: 'white' }}>Gestión de Prestatarios</h1>
        <p style={{ margin: '0 0 24px 0', opacity: 0.9, color: 'rgba(255,255,255,0.9)' }}>Administra clientes y su información</p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button onClick={imprimir} style={{ flex: 1, minWidth: '150px', padding: '12px 24px', backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', backdropFilter: 'blur(4px)' }}>🖨️ Imprimir</button>
          <button onClick={exportarCSV} style={{ flex: 1, minWidth: '150px', padding: '12px 24px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>📥 Exportar CSV</button>
          <button onClick={syncToSheets} disabled={syncing} style={{ flex: 1, minWidth: '150px', padding: '12px 24px', backgroundColor: syncing ? '#6b7280' : '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: syncing ? 'not-allowed' : 'pointer', fontWeight: '600' }}>{syncing ? '🔄 Sincronizando...' : '🔄 Sheets'}</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '24px' }}><div style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Total</div><div style={{ fontSize: '32px', fontWeight: 'bold', color: '#60a5fa' }}>{data.length}</div></div>
        <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '24px' }}><div style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Activos</div><div style={{ fontSize: '32px', fontWeight: 'bold', color: '#34d399' }}>{data.filter(p => p.estado === 'activo').length}</div></div>
        <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '24px' }}><div style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Morosos</div><div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f87171' }}>{data.filter(p => p.estado === 'moroso').length}</div></div>
      </div>

      <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <input type="text" placeholder="🔍 Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, minWidth: '250px', padding: '12px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: '14px' }} />
          <button onClick={() => { resetForm(); setModalOpen(true) }} style={{ padding: '12px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>+ Nuevo</button>
        </div>
      </div>

      <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '24px' }}>
        <h2 style={{ margin: '0 0 24px', fontSize: '20px', fontWeight: '600', color: 'white' }}>Prestatarios Registrados</h2>
        {loading ? <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}><div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div><div>Cargando...</div></div> : filtered.length === 0 ? <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}><div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div><div>No se encontraron prestatarios</div></div> : <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>{filtered.map((p) => (<div key={p.id} style={{ backgroundColor: '#0b0f19', border: '1px solid #1f2937', borderRadius: '12px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}><div style={{ width: '48px', height: '48px', backgroundColor: '#1e40af', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>👤</div><div><div style={{ fontWeight: '600', fontSize: '16px', color: 'white', marginBottom: '4px' }}>{p.nombre_completo || 'Sin nombre'}</div><div style={{ fontSize: '13px', color: '#9ca3af' }}>📄 {p.documento || 'Sin documento'} • 📞 {p.telefono || 'Sin teléfono'}</div></div></div><div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><span style={{ padding: '6px 16px', borderRadius: '9999px', fontSize: '12px', fontWeight: '600', backgroundColor: p.estado === 'activo' ? '#065f46' : p.estado === 'moroso' ? '#7f1d1d' : '#374151', color: p.estado === 'activo' ? '#34d399' : p.estado === 'moroso' ? '#f87171' : '#9ca3af' }}>{p.estado?.toUpperCase() || 'ACTIVO'}</span><button onClick={() => openEdit(p)} style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Editar</button><button onClick={() => handleDelete(p.id)} style={{ padding: '8px 16px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Eliminar</button></div></div>))}</div>}
      </div>

      {modalOpen && <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', backdropFilter: 'blur(4px)' }}><div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '32px', maxWidth: '500px', width: '100%' }}><h2 style={{ margin: '0 0 24px', fontSize: '24px', fontWeight: 'bold', color: 'white' }}>{editingId ? 'Editar' : 'Nuevo Prestatario'}</h2><div style={{ marginBottom: '16px' }}><label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block', fontWeight: '500' }}>Nombre completo *</label><input value={form.nombre_completo} onChange={(e) => setForm({...form, nombre_completo: e.target.value})} style={{ width: '100%', padding: '12px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: '14px' }} /></div><div style={{ marginBottom: '16px' }}><label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block', fontWeight: '500' }}>Documento</label><input value={form.documento} onChange={(e) => setForm({...form, documento: e.target.value})} style={{ width: '100%', padding: '12px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: '14px' }} /></div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}><div><label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block', fontWeight: '500' }}>Teléfono</label><input value={form.telefono} onChange={(e) => setForm({...form, telefono: e.target.value})} style={{ width: '100%', padding: '12px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: '14px' }} /></div><div><label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block', fontWeight: '500' }}>Email</label><input value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} style={{ width: '100%', padding: '12px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: '14px' }} /></div></div><div style={{ marginBottom: '16px' }}><label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block', fontWeight: '500' }}>Dirección</label><input value={form.direccion} onChange={(e) => setForm({...form, direccion: e.target.value})} style={{ width: '100%', padding: '12px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: '14px' }} /></div><div style={{ marginBottom: '24px' }}><label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', display: 'block', fontWeight: '500' }}>Estado</label><select value={form.estado} onChange={(e) => setForm({...form, estado: e.target.value as any})} style={{ width: '100%', padding: '12px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: '14px' }}><option value="activo">Activo</option><option value="moroso">Moroso</option><option value="inactivo">Inactivo</option></select></div><div style={{ display: 'flex', gap: '12px' }}><button onClick={resetForm} style={{ flex: 1, padding: '14px', backgroundColor: '#1f2937', color: '#9ca3af', border: '1px solid #374151', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: '600' }}>Cancelar</button><button onClick={handleSave} disabled={loading} style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '15px' }}>{loading ? 'Guardando...' : (editingId ? 'Actualizar' : 'Guardar')}</button></div></div></div>}
    </div>
  )
}
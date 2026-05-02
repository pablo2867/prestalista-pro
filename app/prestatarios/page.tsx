'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

// Validar variables de entorno al inicio
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('❌ Faltan variables de entorno de Supabase')
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

type Prestatario = {
  id: string
  nombre_completo: string
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
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const [form, setForm] = useState({
    nombre_completo: '', documento: '', telefono: '', email: '', direccion: '', estado: 'activo' as Prestatario['estado'], notas: ''
  })

  useEffect(() => {
    // Verificar variables críticas al montar
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      setError('Configuración incompleta: NEXT_PUBLIC_SUPABASE_URL no definida')
      setLoading(false)
      return
    }
    fetchPrestatarios()
  }, [])

  const fetchPrestatarios = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('prestatarios')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setData(data || [])
      setError(null)
    } catch (err: any) {
      console.error('Error fetching:', err)
      setError('No se pudieron cargar los datos: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const handleSave = async () => {
    if (!form.nombre_completo.trim()) return showToast('El nombre es obligatorio', 'error')
    
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      showToast('Debes estar autenticado', 'error')
      setLoading(false)
      return
    }

    const payload = { ...form, user_id: user.id }

    const { error } = editingId
      ? await supabase.from('prestatarios').update(payload).eq('id', editingId)
      : await supabase.from('prestatarios').insert([payload])

    if (error) {
      showToast('Error: ' + error.message, 'error')
    } else {
      showToast(editingId ? 'Actualizado' : 'Creado correctamente', 'success')
      await fetchPrestatarios()
      resetForm()
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Desactivar?')) return
    const { error } = await supabase.from('prestatarios').update({ estado: 'inactivo' }).eq('id', id)
    if (error) showToast('Error al eliminar', 'error')
    else { showToast('Desactivado', 'success'); fetchPrestatarios() }
  }

  const openEdit = (p: Prestatario) => {
    setEditingId(p.id)
    setForm({
      nombre_completo: p.nombre_completo,
      documento: p.documento || '',
      telefono: p.telefono || '',
      email: p.email || '',
      direccion: p.direccion || '',
      estado: p.estado,
      notas: p.notas || ''
    })
    setModalOpen(true)
  }

  const resetForm = () => {
    setEditingId(null)
    setForm({ nombre_completo: '', documento: '', telefono: '', email: '', direccion: '', estado: 'activo', notas: '' })
    setModalOpen(false)
  }

  const syncToSheets = async () => {
    const webhook = process.env.NEXT_PUBLIC_GAS_WEBHOOK_URL
    if (!webhook) {
      showToast('⚠️ Webhook no configurado en Vercel', 'error')
      return
    }

    setSyncing(true)
    showToast('📤 Sincronizando...', 'success')

    const payload = data.map(p => ({
      ID: p.id,
      Nombre: p.nombre_completo,
      Documento: p.documento || '',
      Telefono: p.telefono || '',
      Email: p.email || '',
      Direccion: p.direccion || '',
      Estado: p.estado,
      Notas: p.notas || '',
      Creado: new Date(p.created_at).toLocaleString('es-MX')
    }))

    try {
      const res = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheet: 'Prestatarios', payload })
      })

      if (res.ok) {
        showToast('✅ Sincronizado con Sheets', 'success')
      } else {
        const text = await res.text()
        console.error('Error Sheets:', res.status, text)
        showToast(`❌ Error: ${res.status}`, 'error')
      }
    } catch (err: any) {
      console.error('Error de conexión:', err)
      showToast('❌ Error de conexión', 'error')
    }
    setSyncing(false)
  }

  // Pantalla de error por configuración
  if (error && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return (
      <main className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="bg-white p-6 rounded-xl shadow-lg max-w-md text-center">
          <h2 className="text-xl font-bold text-red-600 mb-3">⚙️ Configuración pendiente</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">
            Ve a Vercel → Settings → Environment Variables y agrega las variables de Supabase.
          </p>
        </div>
      </main>
    )
  }

  const filtered = data.filter(p =>
    p.nombre_completo.toLowerCase().includes(search.toLowerCase()) ||
    (p.documento && p.documento.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <main className="p-6 bg-gray-50 min-h-screen">
      {toast && (
        <div className={`fixed top-4 right-4 px-4 py-2 rounded shadow-lg text-white text-sm z-50 ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Prestatarios</h1>
        <div className="flex gap-3 w-full sm:w-auto">
          <input
            type="text" placeholder="Buscar por nombre o documento..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-64"
          />
          <button onClick={() => { resetForm(); setModalOpen(true) }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">+ Nuevo</button>
          <button onClick={syncToSheets} disabled={syncing} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50">
            {syncing ? '🔄...' : '🔄 Sheets'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          ⚠️ {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando...</div>
        ) : error ? (
          <div className="p-8 text-center text-gray-500">No se pudieron cargar los datos</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No hay prestatarios registrados</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-700 uppercase">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Documento</th>
                  <th className="px-4 py-3">Contacto</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{p.nombre_completo}</td>
                    <td className="px-4 py-3 text-gray-600">{p.documento || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{p.telefono || p.email || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        p.estado === 'activo' ? 'bg-green-100 text-green-700' :
                        p.estado === 'moroso' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                      }`}>{p.estado.toUpperCase()}</span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={() => openEdit(p)} className="text-blue-600 hover:underline">Editar</button>
                      <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:underline">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">{editingId ? 'Editar Prestatario' : 'Nuevo Prestatario'}</h2>
            <div className="space-y-3">
              <input placeholder="Nombre completo *" value={form.nombre_completo} onChange={e => setForm({...form, nombre_completo: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              <input placeholder="Documento" value={form.documento} onChange={e => setForm({...form, documento: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Teléfono" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} className="px-3 py-2 border rounded-lg" />
                <input placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="px-3 py-2 border rounded-lg" />
              </div>
              <input placeholder="Dirección" value={form.direccion} onChange={e => setForm({...form, direccion: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              <select value={form.estado} onChange={e => setForm({...form, estado: e.target.value as any})} className="w-full px-3 py-2 border rounded-lg">
                <option value="activo">Activo</option>
                <option value="moroso">Moroso</option>
                <option value="inactivo">Inactivo</option>
              </select>
              <textarea placeholder="Notas" value={form.notas} onChange={e => setForm({...form, notas: e.target.value})} className="w-full px-3 py-2 border rounded-lg h-20" />
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={resetForm} className="px-4 py-2 border rounded-lg hover:bg-gray-100">Cancelar</button>
              <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {loading ? 'Guardando...' : (editingId ? 'Actualizar' : 'Guardar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
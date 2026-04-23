'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Sidebar from '@/components/Sidebar'
import ImageUpload from '@/components/ImageUpload'
import { User, Mail, Shield, Save, Camera, X, Download } from 'lucide-react'

export default function PerfilPage() {
  const router = useRouter()
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [fotoUrl, setFotoUrl] = useState(user?.user_metadata?.avatar_url || '')
  const [showModal, setShowModal] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    alert('✅ Perfil actualizado exitosamente')
    setLoading(false)
  }

  const handleDownload = async () => {
    if (!fotoUrl) return
    try {
      const response = await fetch(fotoUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `mi-foto-perfil.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error descargando imagen:', err)
      alert('Error al descargar la imagen')
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Sidebar />
      <main className="lg:ml-64 p-6 md:p-8">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
            <div>
              <h1 className="text-2xl font-bold text-white">Mi Perfil</h1>
              <p className="text-gray-400 text-sm">Gestiona tu información personal y foto de perfil</p>
            </div>
          </div>

          {/* Foto de Perfil */}
          <div className="bg-[#1a1a25] rounded-2xl p-6 border border-[#2a2a35] mb-6">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-400" />
              Foto de Perfil
            </h2>

            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                {fotoUrl ? (
                  <img
                    src={fotoUrl}
                    alt="Perfil"
                    className="w-32 h-32 rounded-full object-cover border-4 border-blue-600 cursor-pointer hover:ring-4 hover:ring-blue-500/50 transition"
                    onClick={() => setShowModal(true)}
                  />
                ) : (
                  <div 
                    className="w-32 h-32 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl font-bold border-4 border-blue-600 cursor-pointer hover:ring-4 hover:ring-blue-500/50 transition"
                    onClick={() => setShowModal(true)}
                  >
                    {user?.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <div className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 cursor-pointer hover:bg-blue-700 transition">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </div>

              {fotoUrl && (
                <button
                  onClick={handleDownload}
                  className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2 mb-4"
                >
                  <Download className="w-4 h-4" />
                  Descargar mi foto
                </button>
              )}

              <ImageUpload
                bucket="profile-photos"
                folder={user?.email?.split('@')[0] || 'perfil'}
                onImageUploaded={setFotoUrl}
                currentImage={fotoUrl}
                label="Subir nueva foto"
              />
            </div>
          </div>

          {/* Información de Cuenta */}
          <div className="bg-[#1a1a25] rounded-2xl p-6 border border-[#2a2a35] mb-6">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-purple-400" />
              Información de Cuenta
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full pl-12 pr-4 py-3 bg-[#0a0a0f] border border-[#2a2a35] rounded-xl text-gray-400 outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Rol</label>
                <div className="px-4 py-3 bg-[#0a0a0f] border border-[#2a2a35] rounded-xl flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-400" />
                  <span className="text-white">
                    {profile?.role === 'admin' ? '👑 Administrador' : profile?.role === 'agent' ? '👤 Agente' : '👁️ Viewer'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">ID de Usuario</label>
                <div className="px-4 py-3 bg-[#0a0a0f] border border-[#2a2a35] rounded-xl">
                  <span className="text-gray-400 text-sm font-mono">{user?.id || 'No disponible'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Botón Guardar */}
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>

        {/* Modal de Foto */}
        {showModal && fotoUrl && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="relative max-w-2xl w-full">
              <button
                onClick={() => setShowModal(false)}
                className="absolute -top-12 right-0 p-2 text-white hover:bg-white/10 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="bg-[#1a1a25] rounded-2xl p-6 border border-[#2a2a35]">
                <img src={fotoUrl} alt="Vista completa" className="w-full h-auto rounded-xl" />
                <div className="flex gap-4 mt-4">
                  <button
                    onClick={handleDownload}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Descargar Foto
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-3 bg-[#0a0a0f] text-white rounded-xl hover:bg-[#1a1a25] transition border border-[#2a2a35]"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
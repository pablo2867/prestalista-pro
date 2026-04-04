'use client'

import { useState, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Camera, X, Loader2 } from 'lucide-react'

interface AvatarUploaderProps {
  size?: 'sm' | 'md' | 'lg'
  editable?: boolean
}

export default function AvatarUploader({ size = 'md', editable = false }: AvatarUploaderProps) {
  const { user, updateAvatar } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-24 h-24 text-3xl'
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida')
      return
    }

    // Validar tamaño (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar los 5MB')
      return
    }

    setUploading(true)
    
    // Crear preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Subir avatar
    const { error, url } = await updateAvatar(file)
    
    if (error) {
      alert('Error al subir la imagen: ' + error.message)
      setPreview(null)
    }
    
    setUploading(false)
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getUserInitials = () => {
    if (!user) return '?'
    const name = user.user_metadata?.nombre || user.email?.split('@')[0] || 'U'
    return name.charAt(0).toUpperCase()
  }

  const getAvatarUrl = () => {
    if (preview) return preview
    if (user?.user_metadata?.avatar_url) return user.user_metadata.avatar_url
    return null
  }

  if (!editable) {
    // Solo mostrar avatar sin editar
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold overflow-hidden`}>
        {getAvatarUrl() ? (
          <img 
            src={getAvatarUrl()} 
            alt={getUserInitials()}
            className="w-full h-full object-cover"
          />
        ) : (
          getUserInitials()
        )}
      </div>
    )
  }

  // Avatar editable con botón de subida
  return (
    <div className="relative">
      <div 
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold overflow-hidden cursor-pointer hover:opacity-80 transition-opacity`}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        {getAvatarUrl() ? (
          <img 
            src={getAvatarUrl()} 
            alt={getUserInitials()}
            className="w-full h-full object-cover"
          />
        ) : (
          getUserInitials()
        )}
        
        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full">
            <Loader2 className="w-1/2 h-1/2 animate-spin text-white" />
          </div>
        )}
      </div>

      {editable && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
          
          {getAvatarUrl() && !uploading && (
            <button
              onClick={() => setPreview(null)}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
              title="Quitar foto"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          
          {!uploading && (
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center cursor-pointer transition-colors shadow-md">
              <Camera className="w-3 h-3" />
            </div>
          )}
        </>
      )}
    </div>
  )
}
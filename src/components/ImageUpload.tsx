'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Upload, X, Loader2, Trash2 } from 'lucide-react'

interface ImageUploadProps {
  bucket: string
  folder: string
  onImageUploaded: (imageUrl: string) => void
  currentImage?: string
  label?: string
  accept?: string
  maxSizeMB?: number
}

export default function ImageUpload({
  bucket,
  folder,
  onImageUploaded,
  currentImage,
  label = 'Subir foto',
  accept = 'image/*',
  maxSizeMB = 5
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > maxSizeMB) {
      setError(`La imagen es muy grande. Máximo ${maxSizeMB}MB`)
      return
    }

    if (!file.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName)

      onImageUploaded(publicUrl)
      
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err: any) {
      console.error('Error subiendo imagen:', err)
      setError(err.message || 'Error al subir la imagen')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = async () => {
    if (!currentImage) return
    
    try {
      const urlParts = currentImage.split(`/${bucket}/`)
      if (urlParts.length > 1) {
        const filePath = urlParts[1]
        
        const { error } = await supabase.storage
          .from(bucket)
          .remove([filePath])
        
        if (error) throw error
      }
      
      onImageUploaded('')
    } catch (err: any) {
      console.error('Error eliminando imagen:', err)
      setError('Error al eliminar la imagen')
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-400">
        {label}
      </label>
      
      {currentImage ? (
        <div className="relative">
          <div className="relative w-full h-48 bg-[#0a0a0f] rounded-xl overflow-hidden border border-[#2a2a35]">
            <img src={currentImage} alt="Preview" className="w-full h-full object-cover" />
          </div>
          <button
            type="button"
            onClick={handleRemoveImage}
            disabled={uploading}
            className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-48 bg-[#0a0a0f] border-2 border-dashed border-[#2a2a35] rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-600/50 transition group"
        >
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-2" />
              <p className="text-sm text-gray-400">Subiendo imagen...</p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 bg-blue-900/30 rounded-full flex items-center justify-center mb-2 group-hover:bg-blue-900/50 transition">
                <Upload className="w-6 h-6 text-blue-400" />
              </div>
              <p className="text-sm text-gray-400 text-center px-4">Click para subir foto</p>
              <p className="text-xs text-gray-600 mt-1">PNG, JPG hasta {maxSizeMB}MB</p>
            </>
          )}
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleImageUpload}
        disabled={uploading}
        className="hidden"
      />
      
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  )
}
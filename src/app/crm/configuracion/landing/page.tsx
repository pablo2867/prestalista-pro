'use client'

import { useState, useEffect, useRef } from 'react'
import { useTenant } from '@/context/TenantContext'
import { createClient } from '@/utils/supabase/client'
import { 
  Save, Eye, Upload, Trash2, Palette, Type, Image as ImageIcon,
  Link as LinkIcon, Zap, Loader2
} from 'lucide-react'

const defaultFeatures = [
  { id: 'leads', titulo: 'Gestión de Leads', descripcion: 'Organiza, filtra y da seguimiento a cada lead. Nunca pierdas una oportunidad de venta.', visible: true, imagenUrl: '' },
  { id: 'whatsapp', titulo: 'WhatsApp Integrado', descripcion: 'Contacta leads directamente desde el CRM. Mensajes prellenados y formato automático.', visible: true, imagenUrl: '' },
  { id: 'analytics', titulo: 'Analytics en Tiempo Real', descripcion: 'Métricas de conversión, rendimiento de agentes y ROI de tus campañas.', visible: true, imagenUrl: '' },
  { id: 'seguridad', titulo: 'Seguridad Empresarial', descripcion: 'Tus datos protegidos con encriptación de grado bancario y políticas de acceso granular.', visible: true, imagenUrl: '' },
  { id: 'mobile', titulo: 'Mobile First', descripcion: 'Trabaja desde cualquier dispositivo. Interfaz optimizada para móvil y tablet.', visible: true, imagenUrl: '' },
  { id: 'soporte', titulo: 'Soporte 24/7', descripcion: 'Equipo de soporte especializado en el sector financiero. Respuestas en minutos.', visible: true, imagenUrl: '' },
]

export default function LandingEditorPage() {
  const { tenant } = useTenant()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState<string | null>(null)
  const [preview, setPreview] = useState(false)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  
  const [heroData, setHeroData] = useState({
    badgeText: 'Nuevo: Integración con WhatsApp Business',
    badgeEnabled: true,
    tituloPrincipal: 'El CRM Inteligente que Transforma Tu Negocio de Préstamos',
    subtitulo: 'Gestiona leads, automatiza WhatsApp y cierra más ventas en menos tiempo. Todo en una plataforma diseñada específicamente para casas de préstamo y financieros.',
    cta1Texto: 'Prueba Gratis 14 Días',
    cta1Enabled: true,
    cta2Texto: 'Ver Demo de 2 Min',
    cta2Enabled: true
  })
  
  const [featuresData, setFeaturesData] = useState(defaultFeatures)

  useEffect(() => {
    async function cargarDatos() {
      if (!tenant?.id) return
      
      const { data, error } = await supabase
        .from('tenant_branding')
        .select('landing_hero_data, landing_features_data, landing_enabled')
        .eq('tenant_id', tenant.id)
        .single()
      
      if (data && !error) {
        if (data.landing_hero_data) {
          setHeroData({ ...heroData, ...data.landing_hero_data })
        }
        if (data.landing_features_data?.features) {
          setFeaturesData(data.landing_features_data.features)
        }
      }
    }
    cargarDatos()
  }, [tenant?.id])

  const handleImageUpload = async (featureId: string, file: File) => {
    setUploadingImage(featureId)
    
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${tenant?.id}/${featureId}-${Date.now()}.${fileExt}`
      
      const { data, error } = await supabase.storage
        .from('tenant-landing-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: true })
      
      if (error) throw error
      
      // ✅ CORREGIDO: Agregar 'data:' antes del segundo {
      const { data: { publicUrl } } = supabase.storage
        .from('tenant-landing-images')
        .getPublicUrl(fileName)
      
      setFeaturesData(featuresData.map(f => 
        f.id === featureId ? { ...f, imagenUrl: publicUrl } : f
      ))
      
      alert('✅ Imagen subida exitosamente')
    } catch (err: any) {
      alert('❌ Error: ' + err.message)
    } finally {
      setUploadingImage(null)
    }
  }

  const handleRemoveImage = async (featureId: string, imageUrl: string) => {
    try {
      const urlParts = imageUrl.split('/tenant-landing-images/')
      if (urlParts.length > 1) {
        await supabase.storage.from('tenant-landing-images').remove([urlParts[1]])
      }
      setFeaturesData(featuresData.map(f => 
        f.id === featureId ? { ...f, imagenUrl: '' } : f
      ))
      alert('✅ Imagen eliminada')
    } catch (err: any) {
      alert('❌ Error: ' + err.message)
    }
  }

  const handleSave = async () => {
    if (!tenant?.id) {
      alert('❌ No hay tenant seleccionado')
      return
    }
    
    setLoading(true)
    try {
      const { error } = await supabase
        .from('tenant_branding')
        .upsert({
          tenant_id: tenant.id,
          landing_hero_data: heroData,
          landing_features_data: { features: featuresData },
          landing_enabled: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'tenant_id' })

      if (error) throw error
      alert('✅ Landing guardada exitosamente')
    } catch (err: any) {
      alert('❌ Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleFeature = (id: string) => {
    setFeaturesData(featuresData.map(f => 
      f.id === id ? { ...f, visible: !f.visible } : f
    ))
  }

  const updateFeature = (id: string, field: string, value: string) => {
    setFeaturesData(featuresData.map(f => 
      f.id === id ? { ...f, [field]: value } : f
    ))
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">🎨 Editor de Landing Page</h1>
          <p className="text-gray-600 mt-1">Personaliza Hero y Features con TUS fotos reales</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setPreview(!preview)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            {preview ? 'Ocultar' : 'Vista Previa'}
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      {/* HERO SECTION */}
      <section className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
            <Palette className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Hero Section</h2>
            <p className="text-sm text-gray-600">Lo primero que ven tus visitantes</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                Badge/Banner Superior
              </label>
              <input
                type="checkbox"
                checked={heroData.badgeEnabled}
                onChange={(e) => setHeroData({ ...heroData, badgeEnabled: e.target.checked })}
                className="w-4 h-4 text-green-600 rounded"
              />
            </div>
            {heroData.badgeEnabled && (
              <input
                type="text"
                value={heroData.badgeText}
                onChange={(e) => setHeroData({ ...heroData, badgeText: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Título Principal</label>
            <textarea
              value={heroData.tituloPrincipal}
              onChange={(e) => setHeroData({ ...heroData, tituloPrincipal: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subtítulo</label>
            <textarea
              value={heroData.subtitulo}
              onChange={(e) => setHeroData({ ...heroData, subtitulo: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none resize-none"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-green-800">Botón Principal</label>
                <input
                  type="checkbox"
                  checked={heroData.cta1Enabled}
                  onChange={(e) => setHeroData({ ...heroData, cta1Enabled: e.target.checked })}
                  className="w-4 h-4 text-green-600 rounded"
                />
              </div>
              {heroData.cta1Enabled && (
                <input
                  type="text"
                  value={heroData.cta1Texto}
                  onChange={(e) => setHeroData({ ...heroData, cta1Texto: e.target.value })}
                  className="w-full px-4 py-2 border border-green-200 rounded-lg"
                />
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">Botón Secundario</label>
                <input
                  type="checkbox"
                  checked={heroData.cta2Enabled}
                  onChange={(e) => setHeroData({ ...heroData, cta2Enabled: e.target.checked })}
                  className="w-4 h-4 text-green-600 rounded"
                />
              </div>
              {heroData.cta2Enabled && (
                <input
                  type="text"
                  value={heroData.cta2Texto}
                  onChange={(e) => setHeroData({ ...heroData, cta2Texto: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Features con Fotos Reales</h2>
              <p className="text-sm text-gray-600">Sube fotos de tu oficina, equipo, productos</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {featuresData.map((feature) => (
            <div
              key={feature.id}
              className={`border rounded-lg p-4 ${
                feature.visible ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={feature.visible}
                    onChange={() => toggleFeature(feature.id)}
                    className="w-5 h-5 text-green-600 rounded"
                  />
                  <span className="font-semibold">{feature.titulo}</span>
                </div>
              </div>

              {feature.visible && (
                <div className="ml-8 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Foto</label>
                    {feature.imagenUrl ? (
                      <div className="relative">
                        <img src={feature.imagenUrl} alt={feature.titulo} className="w-full h-48 object-cover rounded-lg" />
                        <button
                          onClick={() => handleRemoveImage(feature.id, feature.imagenUrl)}
                          className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                          title="Eliminar imagen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <input
                          type="file"
                          ref={(el) => (fileInputRefs.current[feature.id] = el)}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleImageUpload(feature.id, file)
                          }}
                          accept="image/*"
                          className="hidden"
                          id={`file-${feature.id}`}
                        />
                        <label htmlFor={`file-${feature.id}`} className="cursor-pointer">
                          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Click para subir tu foto</p>
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Título</label>
                      <input
                        type="text"
                        value={feature.titulo}
                        onChange={(e) => updateFeature(feature.id, 'titulo', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Descripción</label>
                      <input
                        type="text"
                        value={feature.descripcion}
                        onChange={(e) => updateFeature(feature.id, 'descripcion', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* PREVIEW */}
      {preview && (
        <section className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Vista Previa</h2>
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gradient-to-br from-green-50 via-white to-emerald-50 p-8">
              {heroData.badgeEnabled && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-4">
                  <Zap className="w-4 h-4" />
                  {heroData.badgeText}
                </div>
              )}
              <h3 className="text-3xl font-bold text-gray-900 mb-3">{heroData.tituloPrincipal}</h3>
              <p className="text-gray-600 mb-6">{heroData.subtitulo}</p>
              <div className="flex gap-3">
                {heroData.cta1Enabled && (
                  <button className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition">
                    {heroData.cta1Texto}
                  </button>
                )}
                {heroData.cta2Enabled && (
                  <button className="px-6 py-3 bg-white border-2 border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition">
                    {heroData.cta2Texto}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
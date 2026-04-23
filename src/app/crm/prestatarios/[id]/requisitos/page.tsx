'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Sidebar from '@/components/Sidebar'
import { 
  FileText, Upload, CheckCircle, XCircle, Clock, Download, 
  Eye, Trash2, AlertTriangle, FolderOpen, Save, ArrowLeft,
  Shield, Loader2, RefreshCw, UserCheck
} from 'lucide-react'

const REQUISITOS_ESTANDAR = [
  { id: 'ine', nombre: 'INE / Identificación Oficial', tipo: 'image', obligatorio: true, descripcion: 'Foto frontal y trasera' },
  { id: 'comprobante_domicilio', nombre: 'Comprobante de Domicilio', tipo: 'pdf', obligatorio: true, descripcion: 'Recibo de luz, agua o teléfono (menos de 3 meses)' },
  { id: 'comprobante_ingresos', nombre: 'Comprobante de Ingresos', tipo: 'pdf', obligatorio: true, descripcion: 'Recibos de nómina o estados de cuenta' },
  { id: 'rfc', nombre: 'RFC con Homoclave', tipo: 'pdf', obligatorio: false, descripcion: 'Documento oficial del SAT' },
  { id: 'curp', nombre: 'CURP', tipo: 'text', obligatorio: false, descripcion: 'Clave Única de Registro de Población', validable: true },
  { id: 'referencia_personal', nombre: 'Referencia Personal', tipo: 'text', obligatorio: true, descripcion: 'Nombre y teléfono de una referencia' },
  { id: 'referencia_laboral', nombre: 'Referencia Laboral', tipo: 'text', obligatorio: false, descripcion: 'Nombre y teléfono de jefe o RRHH' },
  { id: 'foto_firma', nombre: 'Foto de Firma', tipo: 'image', obligatorio: true, descripcion: 'Firma en hoja blanca con nombre completo' }
]

export default function RequisitosPrestatarioPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  
  const prestatarioId = params?.id as string
  
  const [requisitos, setRequisitos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [validatingCurp, setValidatingCurp] = useState(false)
  const [curpResult, setCurpResult] = useState<any>(null)
  const [viewDocUrl, setViewDocUrl] = useState<string | null>(null)
  const [prestatarioInfo, setPrestatarioInfo] = useState({
    nombre: 'Juan Pérez',
    email: 'juan@email.com',
    telefono: '5512345678',
    curp: ''
  })

  useEffect(() => {
    setTimeout(() => {
      const requisitosConEstado = REQUISITOS_ESTANDAR.map(req => ({
        ...req,
        estado: Math.random() > 0.5 ? 'verificado' : Math.random() > 0.3 ? 'recibido' : 'pendiente',
        documentoUrl: Math.random() > 0.5 ? `https://via.placeholder.com/400x300?text=${req.id}` : null,
        fechaRecepcion: Math.random() > 0.5 ? '2026-04-05' : null,
        verificadoPor: Math.random() > 0.5 ? 'admin@prestalista.com' : null,
        fechaVerificacion: Math.random() > 0.5 ? '2026-04-06' : null,
        notas: '',
        valorTexto: req.id === 'curp' ? 'PEPJ850101HDFRNN09' : ''
      }))
      setRequisitos(requisitosConEstado)
      setLoading(false)
    }, 1000)
  }, [prestatarioId])

  const validarCURP = async (curp: string) => {
    if (!curp || curp.length !== 18) {
      alert('⚠️ La CURP debe tener 18 caracteres')
      return
    }

    setValidatingCurp(true)
    setCurpResult(null)

    try {
      const response = await fetch(`https://api.curp.mx/validar/${curp.toUpperCase()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        const data = await response.json()
        
        setCurpResult({
          valido: data.valido || data.status === 'success',
          nombre: data.nombre || data.data?.nombre,
          apellidoPaterno: data.apellidoPaterno || data.data?.apellido_paterno,
          apellidoMaterno: data.apellidoMaterno || data.data?.apellido_materno,
          fechaNacimiento: data.fechaNacimiento || data.data?.fecha_nacimiento,
          sexo: data.sexo || data.data?.sexo,
          entidadNacimiento: data.entidadNacimiento || data.data?.entidad_nacimiento,
          mensaje: data.mensaje || 'CURP válido'
        })

        if (data.valido || data.status === 'success') {
          setRequisitos(prev => prev.map(req => {
            if (req.id !== 'curp') return req
            return {
              ...req,
              estado: 'verificado',
              fechaVerificacion: new Date().toISOString().split('T')[0],
              verificadoPor: user?.email || 'sistema',
              notas: `Validado automáticamente con RENAPO. Nombre: ${data.nombre || 'N/A'}`
            }
          }))
          alert('✅ CURP válido y verificado automáticamente')
        } else {
          alert('⚠️ CURP inválido o no encontrado en RENAPO')
        }
      } else {
        const validacionLocal = validarCURPFormato(curp)
        setCurpResult(validacionLocal)
        
        if (validacionLocal.valido) {
          alert('✅ CURP con formato válido (validación local)')
        } else {
          alert('❌ CURP con formato inválido')
        }
      }
    } catch (err) {
      console.error('Error validando CURP:', err)
      const validacionLocal = validarCURPFormato(curp)
      setCurpResult(validacionLocal)
      alert('⚠️ No se pudo conectar al servicio de validación. Se realizó validación de formato.')
    } finally {
      setValidatingCurp(false)
    }
  }

  const validarCURPFormato = (curp: string) => {
    const curpRegex = /^[A-Z]{4}\d{6}[H|M][A-Z]{2}[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9]\d$/
    const valido = curpRegex.test(curp.toUpperCase())
    
    return {
      valido,
      mensaje: valido ? 'Formato de CURP correcto' : 'Formato de CURP inválido',
      curp: curp.toUpperCase()
    }
  }

  const handleCurpChange = (value: string) => {
    setRequisitos(prev => prev.map(req => {
      if (req.id !== 'curp') return req
      return { ...req, valorTexto: value.toUpperCase() }
    }))
    setCurpResult(null)
  }

  const getEstadoConfig = (estado: string) => {
    switch (estado) {
      case 'verificado': return { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-900/30', border: 'border-green-700/50', label: 'Verificado' }
      case 'recibido': return { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-900/30', border: 'border-amber-700/50', label: 'Recibido' }
      default: return { icon: XCircle, color: 'text-red-400', bg: 'bg-red-900/30', border: 'border-red-700/50', label: 'Pendiente' }
    }
  }

  const formatFecha = (fecha: string | null) => {
    if (!fecha) return '-'
    return new Date(fecha).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const handleEstadoChange = async (requisitoId: string, nuevoEstado: 'recibido' | 'verificado' | 'pendiente') => {
    setRequisitos(prev => prev.map(req => {
      if (req.id !== requisitoId) return req
      return {
        ...req,
        estado: nuevoEstado,
        fechaRecepcion: nuevoEstado !== 'pendiente' ? new Date().toISOString().split('T')[0] : null,
        verificadoPor: nuevoEstado === 'verificado' ? user?.email : null,
        fechaVerificacion: nuevoEstado === 'verificado' ? new Date().toISOString().split('T')[0] : null
      }
    }))
  }

  const handleUpload = async (requisitoId: string, file: File) => {
    setUploadingId(requisitoId)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      const fakeUrl = `https://via.placeholder.com/400x300?text=${requisitoId}`
      setRequisitos(prev => prev.map(req => {
        if (req.id !== requisitoId) return req
        return { ...req, documentoUrl: fakeUrl, estado: 'recibido', fechaRecepcion: new Date().toISOString().split('T')[0] }
      }))
      alert(`✅ Documento subido exitosamente`)
    } catch (err) {
      console.error('Error subiendo documento:', err)
      alert('❌ Error al subir el documento')
    } finally {
      setUploadingId(null)
    }
  }

  const handleFileSelect = (requisitoId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const requisito = requisitos.find(r => r.id === requisitoId)
    if (requisito?.tipo === 'image' && !file.type.startsWith('image/')) {
      alert('❌ Este requisito requiere una imagen (JPG, PNG)')
      return
    }
    if (requisito?.tipo === 'pdf' && file.type !== 'application/pdf') {
      alert('❌ Este requisito requiere un archivo PDF')
      return
    }
    handleUpload(requisitoId, file)
  }

  const downloadDocument = async (url: string, filename: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (err) {
      console.error('Error descargando:', err)
      alert('Error al descargar el documento')
    }
  }

  const downloadAllDocuments = async () => {
    const docs = requisitos.filter(r => r.documentoUrl)
    if (docs.length === 0) {
      alert('⚠️ No hay documentos para descargar')
      return
    }
    alert(`📦 Descargando ${docs.length} documento(s) en ZIP...`)
  }

  const pendientesCount = requisitos.filter(r => r.estado === 'pendiente' && r.obligatorio).length

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando requisitos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Sidebar />
      <main className="lg:ml-64 p-6 md:p-8">
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-[#1a1a25] rounded-lg transition">
              <ArrowLeft className="w-6 h-6 text-gray-400" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
              <div>
                <h1 className="text-2xl font-bold text-white">Requisitos - {prestatarioInfo.nombre}</h1>
                <p className="text-gray-400 text-sm">Gestiona los documentos requeridos</p>
              </div>
            </div>
          </div>
          <button
            onClick={downloadAllDocuments}
            disabled={requisitos.filter(r => r.documentoUrl).length === 0}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition flex items-center gap-2 disabled:opacity-50"
          >
            <FolderOpen className="w-4 h-4" />
            Descargar Todo (ZIP)
          </button>
        </div>

        <div className="bg-[#1a1a25] rounded-2xl p-4 border border-[#2a2a35] mb-6">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="text-gray-400">📧 {prestatarioInfo.email}</span>
            <span className="text-gray-400">📱 {prestatarioInfo.telefono}</span>
            <span className={`px-2 py-1 rounded-full text-xs ${
              pendientesCount === 0 ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
            }`}>
              {pendientesCount} requisito(s) pendiente(s)
            </span>
          </div>
        </div>

        {pendientesCount > 0 && (
          <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-300 text-sm font-medium">Requisitos pendientes</p>
              <p className="text-red-400/80 text-xs mt-1">
                {pendientesCount} requisito(s) obligatorio(s) aún no han sido recibidos.
              </p>
            </div>
          </div>
        )}

        {curpResult && (
          <div className={`rounded-2xl p-4 mb-6 border ${
            curpResult.valido 
              ? 'bg-green-900/20 border-green-700/50' 
              : 'bg-red-900/20 border-red-700/50'
          }`}>
            <div className="flex items-start gap-3">
              {curpResult.valido ? (
                <UserCheck className="w-6 h-6 text-green-400 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
              )}
              <div className="flex-1">
                <h3 className={`font-bold mb-2 ${curpResult.valido ? 'text-green-300' : 'text-red-300'}`}>
                  {curpResult.valido ? '✅ CURP Válido' : '❌ CURP Inválido'}
                </h3>
                {curpResult.valido && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-green-400/80">
                    {curpResult.nombre && <p>👤 {curpResult.nombre}</p>}
                    {curpResult.fechaNacimiento && <p>📅 {curpResult.fechaNacimiento}</p>}
                    {curpResult.sexo && <p>⚧ {curpResult.sexo === 'H' ? 'Hombre' : 'Mujer'}</p>}
                    {curpResult.entidadNacimiento && <p>📍 {curpResult.entidadNacimiento}</p>}
                  </div>
                )}
                {!curpResult.valido && <p className="text-red-400 text-sm">{curpResult.mensaje}</p>}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {requisitos.map((req) => {
            const estadoConfig = getEstadoConfig(req.estado)
            const EstadoIcon = estadoConfig.icon
            
            return (
              <div key={req.id} className="bg-[#1a1a25] rounded-2xl p-5 border border-[#2a2a35]">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <FileText className={`w-5 h-5 ${req.obligatorio ? 'text-red-400' : 'text-gray-500'}`} />
                        <div>
                          <h3 className="text-white font-medium flex items-center gap-2">
                            {req.nombre}
                            {req.obligatorio && (
                              <span className="text-xs px-2 py-0.5 bg-red-900/30 text-red-400 rounded-full">Obligatorio</span>
                            )}
                            {req.validable && (
                              <span className="text-xs px-2 py-0.5 bg-blue-900/30 text-blue-400 rounded-full flex items-center gap-1">
                                <Shield className="w-3 h-3" />
                                Validable
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-400">{req.descripcion}</p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${estadoConfig.bg} ${estadoConfig.color} ${estadoConfig.border}`}>
                        <EstadoIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">{estadoConfig.label}</span>
                      </div>
                    </div>

                    {req.tipo === 'text' && (
                      <div className="mt-3 flex items-center gap-2">
                        <input
                          type="text"
                          value={req.valorTexto || ''}
                          onChange={(e) => req.id === 'curp' ? handleCurpChange(e.target.value) : null}
                          placeholder={req.id === 'curp' ? 'Ingresa la CURP (18 caracteres)' : 'Ingresa la información'}
                          className="flex-1 px-4 py-2 bg-[#0a0a0f] border border-[#2a2a35] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none"
                          maxLength={req.id === 'curp' ? 18 : undefined}
                        />
                        {req.id === 'curp' && (
                          <button
                            onClick={() => validarCURP(req.valorTexto)}
                            disabled={validatingCurp || !req.valorTexto}
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition flex items-center gap-2 disabled:opacity-50"
                          >
                            {validatingCurp ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Validando...
                              </>
                            ) : (
                              <>
                                <Shield className="w-4 h-4" />
                                Validar
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}

                    {(req.fechaRecepcion || req.verificadoPor) && (
                      <div className="mt-3 text-xs text-gray-500 space-y-1">
                        {req.fechaRecepcion && <p>📥 Recibido: {formatFecha(req.fechaRecepcion)}</p>}
                        {req.verificadoPor && <p>✅ Verificado por: {req.verificadoPor} el {formatFecha(req.fechaVerificacion)}</p>}
                        {req.notas && <p className="text-blue-400">📝 {req.notas}</p>}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={req.estado}
                      onChange={(e) => handleEstadoChange(req.id, e.target.value as any)}
                      className="px-3 py-2 bg-[#0a0a0f] border border-[#2a2a35] rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="pendiente">⏳ Pendiente</option>
                      <option value="recibido">📥 Recibido</option>
                      <option value="verificado">✅ Verificado</option>
                    </select>

                    {req.estado !== 'pendiente' && req.documentoUrl ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => setViewDocUrl(req.documentoUrl)} className="p-2 text-blue-400 hover:bg-blue-900/30 rounded-lg transition">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => downloadDocument(req.documentoUrl, `${req.nombre}.pdf`)} className="p-2 text-green-400 hover:bg-green-900/30 rounded-lg transition">
                          <Download className="w-4 h-4" />
                        </button>
                        <button onClick={() => setRequisitos(prev => prev.map(r => r.id === req.id ? { ...r, documentoUrl: null, estado: 'pendiente' } : r))} className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : req.tipo !== 'text' ? (
                      <label className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition flex items-center gap-2 ${
                        uploadingId === req.id ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}>
                        {uploadingId === req.id ? (
                          <><Loader2 className="w-4 h-4 animate-spin" />Subiendo...</>
                        ) : (
                          <><Upload className="w-4 h-4" />Subir {req.tipo === 'image' ? 'Foto' : 'PDF'}</>
                        )}
                        <input type="file" accept={req.tipo === 'image' ? 'image/*' : 'application/pdf'} onChange={(e) => handleFileSelect(req.id, e)} disabled={uploadingId === req.id} className="hidden" />
                      </label>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {viewDocUrl && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="relative max-w-4xl w-full">
              <button onClick={() => setViewDocUrl(null)} className="absolute -top-12 right-0 p-2 text-white hover:bg-white/10 rounded-lg transition">
                <XCircle className="w-6 h-6" />
              </button>
              <div className="bg-[#1a1a25] rounded-2xl p-6 border border-[#2a2a35]">
                <img src={viewDocUrl} alt="Documento" className="w-full h-auto rounded-xl" />
                <div className="flex gap-4 mt-4">
                  <button onClick={() => downloadDocument(viewDocUrl, 'documento.pdf')} className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition flex items-center justify-center gap-2">
                    <Download className="w-5 h-5" /> Descargar
                  </button>
                  <button onClick={() => setViewDocUrl(null)} className="flex-1 px-4 py-3 bg-[#0a0a0f] text-white rounded-xl hover:bg-[#1a1a25] transition border border-[#2a2a35]">
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
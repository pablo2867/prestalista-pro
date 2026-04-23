'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/utils/supabase/client'
import { 
  Bell, Check, X, AlertTriangle, AlertCircle, Info, CheckCircle,
  DollarSign, Users, Calendar, Phone, MessageCircle, Mail,
  Filter, Trash2, Printer, Download, Volume2, VolumeX, Play, Clock,
  TestTube
} from 'lucide-react'

interface Notificacion {
  id: string
  titulo: string
  mensaje: string
  tipo: 'urgente' | 'advertencia' | 'info' | 'exito'
  categoria: 'pago_vencido' | 'pago_proximo' | 'nuevo_lead' | 'prestamo_aprobado' | 'seguimiento' | 'sistema'
  leida: boolean
  fecha: string
  clienteId?: string
  clienteNombre?: string
  prestamoId?: string
  monto?: number
  accionUrl?: string
  accionLabel?: string
}

interface StatsNotificaciones {
  total: number
  noLeidas: number
  urgentes: number
  hoy: number
  nuevosLeads: number
}

export default function NotificacionesPage() {
  const router = useRouter()
  const { user, profile, profileLoading } = useAuth()
  const supabase = createClient()
  
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [stats, setStats] = useState<StatsNotificaciones>({
    total: 0,
    noLeidas: 0,
    urgentes: 0,
    hoy: 0,
    nuevosLeads: 0
  })
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'urgente' | 'advertencia' | 'info' | 'exito'>('todos')
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'leidas' | 'noLeidas'>('todos')
  const [mostrarSoloHoy, setMostrarSoloHoy] = useState(false)
  
  // Estado para audio
  const [audioActivado, setAudioActivado] = useState(true)
  const [audioReproduciendo, setAudioReproduciendo] = useState(false)
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const ultimosLeadsRef = useRef<Set<string>>(new Set())

  // Inicializar AudioContext después de interacción del usuario
  const inicializarAudio = () => {
    if (audioContext) return audioContext
    
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      if (AudioContext) {
        const ctx = new AudioContext()
        setAudioContext(ctx)
        return ctx
      }
    } catch (e) {
      console.log('⚠️ Web Audio API no soportada')
    }
    return null
  }

  // 🔊 Reproducir sonido con Web Audio API
  const reproducirSonido = () => {
    if (!audioActivado || audioReproduciendo) return
    
    try {
      setAudioReproduciendo(true)
      
      // Inicializar o reanudar contexto de audio
      let ctx = audioContext
      if (!ctx) {
        ctx = inicializarAudio()
      }
      
      if (!ctx) {
        setAudioReproduciendo(false)
        return
      }
      
      // Reanudar si está suspendido (política del navegador)
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {})
      }
      
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      
      // Sonido tipo "ding" profesional: frecuencia descendente
      const now = ctx.currentTime
      oscillator.frequency.setValueAtTime(880, now) // A5
      oscillator.frequency.exponentialRampToValueAtTime(440, now + 0.15) // A4
      gainNode.gain.setValueAtTime(0.3, now)
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2)
      
      oscillator.start(now)
      oscillator.stop(now + 0.2)
      
      setTimeout(() => setAudioReproduciendo(false), 250)
      
    } catch (e) {
      console.log('⚠️ No se pudo reproducir sonido:', e)
      setAudioReproduciendo(false)
    }
  }

  // 🔔 Test manual de sonido (para verificar que funciona)
  const testSonido = () => {
    setAudioActivado(true)
    reproducirSonido()
    alert('🔊 Si escuchaste un "ding", ¡el audio funciona!')
  }

  // Configuración de notificaciones por tipo
  const getConfigNotificacion = (tipo: string) => {
    const tipos: Record<string, { icon: any; bg: string; text: string; border: string; label: string }> = {
      urgente: { icon: AlertCircle, bg: 'bg-red-50', text: 'text-red-700', border: 'border-l-4 border-red-500', label: '🔴 Urgente' },
      advertencia: { icon: AlertTriangle, bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-l-4 border-yellow-500', label: '🟡 Advertencia' },
      info: { icon: Info, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-l-4 border-blue-500', label: '🔵 Info' },
      exito: { icon: CheckCircle, bg: 'bg-green-50', text: 'text-green-700', border: 'border-l-4 border-green-500', label: '🟢 Éxito' }
    }
    return tipos[tipo] || tipos.info
  }

  // Icono por categoría
  const getCategoriaIcon = (categoria: string) => {
    const icons: Record<string, any> = {
      pago_vencido: DollarSign,
      pago_proximo: Calendar,
      nuevo_lead: Users,
      prestamo_aprobado: CheckCircle,
      seguimiento: Clock,
      sistema: Bell
    }
    return icons[categoria] || Bell
  }

  // Cargar notificaciones
  useEffect(() => {
    async function cargarNotificaciones() {
      if (!user) return

      try {
        const notifsData: Notificacion[] = []

        // 1. Intentar cargar desde tabla 'notificaciones'
        try {
          const {  data } = await supabase
            .from('notificaciones')
            .select('*')
            .order('fecha', { ascending: false })
            .limit(50)
          if (data) notifsData.push(...data)
        } catch (e) {
          console.log('⚠️ Tabla notificaciones no existe')
        }

        // 2. Generar notificaciones dinámicas desde otros módulos
        try {
          // Pagos vencidos
          const {  pagosVencidos } = await supabase
            .from('pagos')
            .select('id, monto, fecha_pago, estado, referencia')
            .eq('estado', 'fallido')
            .or('estado.eq.pendiente,fecha_pago.lt.' + new Date(Date.now() - 3*24*60*60*1000).toISOString())
          
          if (pagosVencidos) {
            pagosVencidos.forEach(pago => {
              const diasAtraso = Math.floor((Date.now() - new Date(pago.fecha_pago).getTime()) / (1000*60*60*24))
              notifsData.push({
                id: `pago-vencido-${pago.id}`,
                titulo: diasAtraso > 7 ? '⚠️ Pago muy vencido' : '💰 Pago vencido',
                mensaje: `El pago ${pago.referencia} de $${pago.monto} tiene ${diasAtraso} días de atraso`,
                tipo: diasAtraso > 7 ? 'urgente' : 'advertencia',
                categoria: 'pago_vencido',
                leida: false,
                fecha: pago.fecha_pago,
                monto: pago.monto,
                accionUrl: '/crm/pagos',
                accionLabel: 'Gestionar pago'
              })
            })
          }

          // Próximos vencimientos
          const {  pagosProximos } = await supabase
            .from('pagos')
            .select('id, monto, fecha_pago, referencia')
            .gte('fecha_pago', new Date().toISOString())
            .lte('fecha_pago', new Date(Date.now() + 3*24*60*60*1000).toISOString())
            .eq('estado', 'pendiente')
          
          if (pagosProximos) {
            pagosProximos.forEach(pago => {
              notifsData.push({
                id: `pago-proximo-${pago.id}`,
                titulo: '📅 Pago próximo',
                mensaje: `El pago ${pago.referencia} de $${pago.monto} vence en pocos días`,
                tipo: 'info',
                categoria: 'pago_proximo',
                leida: false,
                fecha: pago.fecha_pago,
                monto: pago.monto,
                accionUrl: '/crm/calendario',
                accionLabel: 'Ver en calendario'
              })
            })
          }

          // Nuevos leads (últimas 24h) - CON AUDIO 🔔
          const {  nuevosLeads } = await supabase
            .from('leads')
            .select('id, nombre, email, estado, creado_en')
            .eq('estado', 'nuevo')
            .gte('creado_en', new Date(Date.now() - 24*60*60*1000).toISOString())
          
          if (nuevosLeads) {
            nuevosLeads.forEach(lead => {
              // Verificar si es un lead nuevo que no hemos procesado
              const key = `${lead.id}-${lead.email}`
              if (!ultimosLeadsRef.current.has(key)) {
                ultimosLeadsRef.current.add(key)
                // 🔊 Reproducir sonido para nuevo lead
                reproducirSonido()
              }
              
              notifsData.push({
                id: `nuevo-lead-${lead.id}`,
                titulo: '🔔 ¡NUEVO LEAD!',
                mensaje: `${lead.nombre} se registró como nuevo lead. ¡Contactar ahora!`,
                tipo: 'info',
                categoria: 'nuevo_lead',
                leida: false,
                fecha: lead.creado_en,
                clienteId: lead.id,
                clienteNombre: lead.nombre,
                accionUrl: `/crm/leads/${lead.id}/edit`,
                accionLabel: 'Contactar lead'
              })
            })
          }
        } catch (e) {
          console.log('⚠️ No se pudieron generar notificaciones dinámicas')
        }

        // 3. Datos de ejemplo si está vacío
        if (notifsData.length === 0) {
          const hoy = new Date()
          notifsData.push(
            {
              id: '1',
              titulo: '🔴 Pago muy vencido',
              mensaje: 'El pago REF-003 de Pedro Sánchez tiene 45 días de atraso. Contactar urgentemente.',
              tipo: 'urgente',
              categoria: 'pago_vencido',
              leida: false,
              fecha: new Date(hoy.setDate(hoy.getDate() - 45)).toISOString(),
              clienteNombre: 'Pedro Sánchez',
              monto: 3000,
              accionUrl: '/crm/pagos',
              accionLabel: 'Gestionar pago'
            },
            {
              id: '2',
              titulo: '🔔 ¡NUEVO LEAD!',
              mensaje: 'Juan Pérez se registró como nuevo lead. ¡Contactar ahora para calificar!',
              tipo: 'info',
              categoria: 'nuevo_lead',
              leida: false,
              fecha: new Date().toISOString(),
              clienteNombre: 'Juan Pérez',
              accionUrl: '/crm/leads',
              accionLabel: 'Contactar lead'
            },
            {
              id: '3',
              titulo: '🟡 Pago vencido',
              mensaje: 'El pago REF-005 de Carlos Ruiz tiene 20 días de atraso. Enviar recordatorio.',
              tipo: 'advertencia',
              categoria: 'pago_vencido',
              leida: false,
              fecha: new Date(hoy.setDate(hoy.getDate() - 20)).toISOString(),
              clienteNombre: 'Carlos Ruiz',
              monto: 5000,
              accionUrl: '/crm/pagos',
              accionLabel: 'Enviar recordatorio'
            },
            {
              id: '4',
              titulo: '✅ Préstamo aprobado',
              mensaje: 'El préstamo de Laura Martínez fue aprobado. Generar contrato.',
              tipo: 'exito',
              categoria: 'prestamo_aprobado',
              leida: true,
              fecha: new Date().toISOString(),
              clienteNombre: 'Laura Martínez',
              accionUrl: '/crm/prestamos',
              accionLabel: 'Generar contrato'
            }
          )
        }

        // Ordenar por fecha (más reciente primero)
        notifsData.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
        setNotificaciones(notifsData)

        // Calcular estadísticas
        const ahora = new Date()
        const hoyInicio = new Date(ahora.setHours(0, 0, 0, 0))
        
        setStats({
          total: notifsData.length,
          noLeidas: notifsData.filter(n => !n.leida).length,
          urgentes: notifsData.filter(n => n.tipo === 'urgente' && !n.leida).length,
          hoy: notifsData.filter(n => new Date(n.fecha) >= hoyInicio).length,
          nuevosLeads: notifsData.filter(n => n.categoria === 'nuevo_lead' && !n.leida).length
        })

      } catch (err) {
        console.error('❌ Error cargando notificaciones:', err)
      } finally {
        setLoading(false)
      }
    }

    cargarNotificaciones()
    
    // Polling para nuevos leads cada 30 segundos
    const intervalo = setInterval(() => {
      cargarNotificaciones()
    }, 30000)
    
    return () => clearInterval(intervalo)
  }, [user, supabase])

  // Filtrar notificaciones
  const notificacionesFiltradas = useMemo(() => {
    return notificaciones.filter(n => {
      const matchTipo = filtroTipo === 'todos' || n.tipo === filtroTipo
      const matchEstado = filtroEstado === 'todos' || 
        (filtroEstado === 'leidas' && n.leida) || 
        (filtroEstado === 'noLeidas' && !n.leida)
      const matchHoy = !mostrarSoloHoy || 
        new Date(n.fecha).toDateString() === new Date().toDateString()
      return matchTipo && matchEstado && matchHoy
    })
  }, [notificaciones, filtroTipo, filtroEstado, mostrarSoloHoy])

  // Marcar como leída/no leída
  const toggleLeida = async (id: string) => {
    const notif = notificaciones.find(n => n.id === id)
    if (!notif) return
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: !n.leida } : n))
    try {
      await supabase.from('notificaciones').update({ leida: !notif.leida }).eq('id', id.replace(/^[a-z]+-/, ''))
    } catch (e) { console.log('⚠️ No se pudo actualizar en Supabase') }
  }

  const marcarTodasLeidas = () => {
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })))
  }

  const eliminarNotificacion = async (id: string) => {
    if (!confirm('¿Eliminar esta notificación?')) return
    setNotificaciones(prev => prev.filter(n => n.id !== id))
    try {
      await supabase.from('notificaciones').delete().eq('id', id.replace(/^[a-z]+-/, ''))
    } catch (e) { console.log('⚠️ No se pudo eliminar de Supabase') }
  }

  const ejecutarAccion = (notif: Notificacion) => {
    if (notif.accionUrl) router.push(notif.accionUrl)
    if (!notif.leida) toggleLeida(notif.id)
  }

  const contactarCliente = (notif: Notificacion, medio: 'whatsapp' | 'llamar' | 'email') => {
    if (!notif.clienteNombre) return
    const mensajes: Record<string, string> = {
      whatsapp: `Hola ${notif.clienteNombre}, te contactamos desde PrestaLista Pro`,
      llamar: '',
      email: `Asunto: Recordatorio de PrestaLista Pro\n\nHola ${notif.clienteNombre},`
    }
    switch (medio) {
      case 'whatsapp': window.open(`https://wa.me/?text=${encodeURIComponent(mensajes.whatsapp)}`, '_blank'); break
      case 'llamar': window.open('tel:', '_self'); break
      case 'email': window.open(`mailto:?subject=${encodeURIComponent('Recordatorio')}&body=${encodeURIComponent(mensajes.email)}`, '_blank'); break
    }
    if (!notif.leida) toggleLeida(notif.id)
  }

  // 📥 Exportar a CSV
  const exportarCSV = () => {
    const headers = ['Fecha,Tipo,Categoría,Título,Mensaje,Cliente,Monto,Estado\n']
    const rows = notificacionesFiltradas.map(n => {
      return `${new Date(n.fecha).toLocaleDateString('es-MX')},${n.tipo},${n.categoria},"${n.titulo}","${n.mensaje}",${n.clienteNombre || ''},${n.monto || ''},${n.leida ? 'Leída' : 'No leída'}`
    })
    const csv = headers.join('') + rows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `notificaciones-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
  }

  // 🖨️ Imprimir
  const imprimirNotificaciones = () => {
    window.print()
  }

  // Formatear fecha
  const formatFecha = (fechaString: string) => {
    const fecha = new Date(fechaString)
    const hoy = new Date(), ayer = new Date(hoy); ayer.setDate(ayer.getDate() - 1)
    if (fecha.toDateString() === hoy.toDateString()) return 'Hoy'
    if (fecha.toDateString() === ayer.toDateString()) return 'Ayer'
    return fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
  }

  // Formatear moneda
  const formatMoney = (amount?: number) => {
    if (!amount) return ''
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(amount)
  }

  if (loading || profileLoading) {
    return <div className="p-8"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div></div>
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto print:p-4">
      {/* Header - No imprimir */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 print:hidden">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
            🔔 Notificaciones
            {stats.noLeidas > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                {stats.noLeidas} nuevas
              </span>
            )}
          </h1>
          <p className="text-gray-600 mt-1">Alertas y recordatorios importantes</p>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {/* Toggle Audio */}
          <button
            onClick={() => {
              setAudioActivado(!audioActivado)
              if (!audioActivado) inicializarAudio()
            }}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg transition text-sm ${
              audioActivado ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
            } text-white`}
            title={audioActivado ? 'Sonido activado' : 'Sonido desactivado'}
          >
            {audioActivado ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            {audioActivado ? '🔊 Sonido ON' : '🔇 Sonido OFF'}
          </button>
          
          {/* 🔔 Botón de Test de Sonido */}
          <button
            onClick={testSonido}
            className="inline-flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm"
            title="Probar sonido de notificación"
          >
            <TestTube className="w-4 h-4" /> Test Sonido
          </button>
          
          {/* Indicador de reproducción */}
          {audioReproduciendo && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs animate-pulse">
              <Play className="w-3 h-3" /> Sonando...
            </span>
          )}
          
          {/* Exportar/Imprimir */}
          <button onClick={exportarCSV} className="inline-flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm">
            <Download className="w-4 h-4" /> CSV
          </button>
          <button onClick={imprimirNotificaciones} className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
            <Printer className="w-4 h-4" /> Imprimir
          </button>
          
          {stats.noLeidas > 0 && (
            <button onClick={marcarTodasLeidas} className="inline-flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm">
              <Check className="w-4 h-4" /> Marcar todas
            </button>
          )}
        </div>
      </div>

      {/* Stats - No imprimir */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 print:hidden">
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-blue-500">
          <p className="text-xs text-gray-600">Total</p>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-red-500">
          <p className="text-xs text-gray-600">No Leídas</p>
          <p className="text-2xl font-bold text-red-600">{stats.noLeidas}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-orange-500">
          <p className="text-xs text-gray-600">Urgentes</p>
          <p className="text-2xl font-bold text-orange-600">{stats.urgentes}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-green-500">
          <p className="text-xs text-gray-600">Hoy</p>
          <p className="text-2xl font-bold text-green-600">{stats.hoy}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-purple-500">
          <p className="text-xs text-gray-600">🔔 Nuevos Leads</p>
          <p className="text-2xl font-bold text-purple-600">{stats.nuevosLeads}</p>
        </div>
      </div>

      {/* Filtros - No imprimir */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6 space-y-4 print:hidden">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <label className="text-sm text-gray-600">Tipo:</label>
            <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value as typeof filtroTipo)} className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm">
              <option value="todos">📋 Todos</option>
              <option value="urgente">🔴 Urgentes</option>
              <option value="advertencia">🟡 Advertencias</option>
              <option value="info">🔵 Info</option>
              <option value="exito">🟢 Éxitos</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Estado:</label>
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value as typeof filtroEstado)} className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm">
              <option value="todos">📋 Todas</option>
              <option value="noLeidas">🔴 No leídas</option>
              <option value="leidas">✅ Leídas</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={mostrarSoloHoy} onChange={(e) => setMostrarSoloHoy(e.target.checked)} className="rounded border-gray-300" />
            Solo de hoy
          </label>
        </div>
      </div>

      {/* Lista de Notificaciones */}
      <div className="space-y-3">
        {notificacionesFiltradas.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center print:shadow-none">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">¡No hay notificaciones!</p>
            <p className="text-gray-400 text-sm mt-1">{filtroEstado !== 'todos' || filtroTipo !== 'todos' ? 'Intenta ajustar los filtros' : 'Todo está al corriente 🎉'}</p>
          </div>
        ) : (
          notificacionesFiltradas.map((notif) => {
            const config = getConfigNotificacion(notif.tipo)
            const CategoriaIcon = getCategoriaIcon(notif.categoria)
            const esNuevoLead = notif.categoria === 'nuevo_lead' && !notif.leida
            
            return (
              <div key={notif.id} className={`bg-white rounded-xl shadow-md p-4 ${config.border} transition-all ${!notif.leida ? 'ring-2 ring-blue-200' : 'opacity-90'} print:shadow-none print:ring-0 print:opacity-100`}>
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <button onClick={() => toggleLeida(notif.id)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${notif.leida ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-blue-500'}`} title={notif.leida ? 'Marcar como no leída' : 'Marcar como leída'}>
                      {notif.leida && <Check className="w-4 h-4" />}
                    </button>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.bg} ${esNuevoLead ? 'animate-pulse' : ''}`}>
                      <CategoriaIcon className={`w-5 h-5 ${config.text}`} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={`font-semibold ${config.text} ${!notif.leida ? '' : 'opacity-70'} ${esNuevoLead ? 'animate-pulse text-lg' : ''}`}>
                            {notif.titulo}
                          </h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${config.bg} ${config.text}`}>{config.label}</span>
                          {notif.monto && <span className="text-xs font-bold text-gray-700">{formatMoney(notif.monto)}</span>}
                          {esNuevoLead && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold animate-pulse">🔔 ¡NUEVO!</span>}
                        </div>
                        <p className={`text-sm text-gray-600 mt-1 ${!notif.leida ? 'font-medium' : ''}`}>{notif.mensaje}</p>
                        {notif.clienteNombre && <p className="text-xs text-gray-400 mt-1">👤 {notif.clienteNombre}</p>}
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" />{formatFecha(notif.fecha)}</p>
                      </div>

                      <div className="flex flex-col items-end gap-2 print:hidden">
                        {notif.accionUrl && (
                          <button onClick={() => ejecutarAccion(notif)} className="text-xs px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition whitespace-nowrap">{notif.accionLabel || 'Ver'}</button>
                        )}
                        {notif.clienteNombre && (
                          <div className="flex items-center gap-1">
                            <button onClick={() => contactarCliente(notif, 'whatsapp')} className="p-1.5 text-green-600 hover:bg-green-100 rounded transition" title="WhatsApp"><MessageCircle className="w-4 h-4" /></button>
                            <button onClick={() => contactarCliente(notif, 'llamar')} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition" title="Llamar"><Phone className="w-4 h-4" /></button>
                            <button onClick={() => contactarCliente(notif, 'email')} className="p-1.5 text-purple-600 hover:bg-purple-100 rounded transition" title="Email"><Mail className="w-4 h-4" /></button>
                          </div>
                        )}
                        <button onClick={() => eliminarNotificacion(notif.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer para impresión */}
      <div className="hidden print:block mt-8 pt-8 border-t border-gray-300">
        <div className="flex justify-between items-center text-sm text-gray-500">
          <p>Reporte de Notificaciones - {new Date().toLocaleDateString('es-MX')}</p>
          <p>PrestaLista Pro</p>
        </div>
        <div className="mt-2 text-xs text-gray-400">
          <p>Total: {stats.total} • No leídas: {stats.noLeidas} • Urgentes: {stats.urgentes}</p>
        </div>
      </div>

      {notificacionesFiltradas.length > 0 && (
        <div className="mt-6 text-center text-sm text-gray-500 print:hidden">
          Mostrando {notificacionesFiltradas.length} de {notificaciones.length} notificaciones
        </div>
      )}
    </div>
  )
}
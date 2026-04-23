'use client'

import { useState, useEffect } from 'react'
import { useTenant } from '@/context/TenantContext'
import { useUserRole } from '@/hooks/useUserRole'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  UserPlus, Mail, Send, Trash2, Shield, Loader2, 
  Users, CheckCircle, AlertCircle, TrendingUp, DollarSign,
  Target, Award, Briefcase, Phone, Calendar, BarChart3,
  PieChart, Activity, ArrowUpRight, ArrowDownRight
} from 'lucide-react'

interface TeamMember {
  id: string
  email: string
  nombre: string
  role: 'admin' | 'agent' | 'viewer'
  avatar_url: string | null
  created_at: string
  stats?: {
    leadsAsignados: number
    leadsConvertidos: number
    prestamosCerrados: number
    montoTotalGestionado: number
    pagosCobrados: number
    tasaConversion: number
  }
}

interface ActividadReciente {
  id: string
  usuario: string
  accion: string
  tipo: 'lead' | 'prestamo' | 'pago'
  fecha: string
  monto?: number
}

export default function TeamManagementPage() {
  const { tenant } = useTenant()
  const { isAdmin } = useUserRole()
  const router = useRouter()
  const supabase = createClient()
  
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'agent' | 'viewer'>('agent')
  const [loading, setLoading] = useState(false)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [actividad, setActividad] = useState<ActividadReciente[]>([])
  const [error, setError] = useState<string | null>(null)
  const [statsEquipo, setStatsEquipo] = useState({
    totalLeads: 0,
    totalPrestamos: 0,
    totalIngresos: 0,
    promedioConversion: 0
  })

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard')
    }
  }, [isAdmin, router])

  const cargarMiembros = async () => {
    if (!tenant?.id) return
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, nombre, role, avatar_url, created_at')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error cargando miembros:', error)
      setError('No se pudieron cargar los miembros del equipo')
    } else {
      setMembers(data || [])
      // Cargar estadísticas de cada miembro
      await cargarEstadisticas(data || [])
    }
  }

  const cargarEstadisticas = async (miembros: any[]) => {
    const statsPromesas = miembros.map(async (member) => {
      // Leads asignados
      const { count: leadsAsignados } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant!.id)
        .eq('assigned_to', member.id)
      
      // Leads convertidos (aprobados)
      const { count: leadsConvertidos } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant!.id)
        .eq('assigned_to', member.id)
        .eq('estado', 'aprobado')
      
      // Préstamos cerrados
      const { count: prestamosCerrados } = await supabase
        .from('prestamos')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant!.id)
        .eq('agente_id', member.id)
        .eq('estado', 'activo')
      
      // Monto total gestionado
      const { data: prestamosData } = await supabase
        .from('prestamos')
        .select('monto')
        .eq('tenant_id', tenant!.id)
        .eq('agente_id', member.id)
      
      const montoTotalGestionado = prestamosData?.reduce((sum, p) => sum + (p.monto || 0), 0) || 0
      
      // Pagos cobrados
      const { data: pagosData } = await supabase
        .from('pagos')
        .select('monto')
        .eq('tenant_id', tenant!.id)
        .eq('agente_id', member.id)
        .eq('estado', 'completado')
      
      const pagosCobrados = pagosData?.reduce((sum, p) => sum + (p.monto || 0), 0) || 0
      
      const tasaConversion = leadsAsignados && leadsAsignados > 0 
        ? ((leadsConvertidos || 0) / leadsAsignados) * 100 
        : 0
      
      return {
        ...member,
        stats: {
          leadsAsignados: leadsAsignados || 0,
          leadsConvertidos: leadsConvertidos || 0,
          prestamosCerrados: prestamosCerrados || 0,
          montoTotalGestionado,
          pagosCobrados,
          tasaConversion
        }
      }
    })
    
    const miembrosConStats = await Promise.all(statsPromesas)
    setMembers(miembrosConStats)
    
    // Calcular stats del equipo
    const totalLeads = miembrosConStats.reduce((sum, m) => sum + (m.stats?.leadsAsignados || 0), 0)
    const totalPrestamos = miembrosConStats.reduce((sum, m) => sum + (m.stats?.prestamosCerrados || 0), 0)
    const totalIngresos = miembrosConStats.reduce((sum, m) => sum + (m.stats?.pagosCobrados || 0), 0)
    const promedioConversion = miembrosConStats.length > 0
      ? miembrosConStats.reduce((sum, m) => sum + (m.stats?.tasaConversion || 0), 0) / miembrosConStats.length
      : 0
    
    setStatsEquipo({ totalLeads, totalPrestamos, totalIngresos, promedioConversion })
  }

  const cargarActividad = async () => {
    if (!tenant?.id) return
    
    const { data, error } = await supabase
      .from('interactions')
      .select(`
        id,
        tipo,
        descripcion,
        created_at,
        metadata,
        profiles(nombre)
      `)
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (data) {
      setActividad(data.map(item => ({
        id: item.id,
        usuario: item.profiles?.nombre || 'Usuario',
        accion: item.descripcion || 'Actividad registrada',
        tipo: item.tipo as 'lead' | 'prestamo' | 'pago',
        fecha: item.created_at,
        monto: item.metadata?.monto
      })))
    }
  }

  useEffect(() => {
    if (tenant?.id && isAdmin) {
      cargarMiembros()
      cargarActividad()
    }
  }, [tenant?.id, isAdmin])

  const invitarMiembro = async () => {
    if (!email) {
      setError('Ingresa un email válido')
      return
    }

    if (!tenant?.id) {
      setError('No hay tenant seleccionado')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const tempPassword = Math.random().toString(36).slice(-10)
      
      const { data: { user }, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { 
          nombre: email.split('@')[0],
          role,
          tenant_id: tenant.id,
        }
      })
      
      if (authError) throw authError
      
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user?.id,
          tenant_id: tenant.id,
          email,
          nombre: email.split('@')[0],
          role,
          avatar_url: null
        })
      
      if (profileError) throw profileError
      
      alert(`✅ Miembro invitado exitosamente\n\nEmail: ${email}\nRol: ${role === 'agent' ? '👤 Agente' : '👁️ Viewer'}`)
      
      setEmail('')
      cargarMiembros()
    } catch (err: any) {
      console.error('Error invitando miembro:', err)
      setError(err.message || 'No se pudo invitar al miembro')
    } finally {
      setLoading(false)
    }
  }

  const eliminarMiembro = async (userId: string, memberEmail: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar a ${memberEmail}?`)) return
    
    setLoading(true)
    setError(null)
    
    try {
      const { error: authError } = await supabase.auth.admin.deleteUser(userId)
      if (authError) throw authError
      
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)
      
      if (profileError) throw profileError
      
      alert('✅ Miembro eliminado del equipo')
      cargarMiembros()
    } catch (err: any) {
      console.error('Error eliminando miembro:', err)
      setError(err.message || 'No se pudo eliminar al miembro')
    } finally {
      setLoading(false)
    }
  }

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600">Solo los administradores pueden gestionar el equipo</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">👥 Gestión de Equipo</h1>
          <p className="text-gray-600 mt-1">Administra tu equipo de ventas y monitorea el rendimiento</p>
        </div>
        <div className="text-sm px-3 py-1 bg-purple-100 text-purple-700 rounded-full flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Panel de Administrador
        </div>
      </div>

      {/* Stats del Equipo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Total Leads</p>
              <p className="text-2xl font-bold text-gray-800">{statsEquipo.totalLeads}</p>
              <p className="text-xs text-gray-400 mt-1">Asignados al equipo</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Préstamos Activos</p>
              <p className="text-2xl font-bold text-gray-800">{statsEquipo.totalPrestamos}</p>
              <p className="text-xs text-gray-400 mt-1">Cerrados este mes</p>
            </div>
            <Briefcase className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Ingresos Totales</p>
              <p className="text-2xl font-bold text-gray-800">{formatMoney(statsEquipo.totalIngresos)}</p>
              <p className="text-xs text-gray-400 mt-1">Pagos cobrados</p>
            </div>
            <DollarSign className="w-8 h-8 text-emerald-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Tasa Promedio</p>
              <p className="text-2xl font-bold text-gray-800">{statsEquipo.promedioConversion.toFixed(1)}%</p>
              <p className="text-xs text-gray-400 mt-1">Conversión de leads</p>
            </div>
            <Target className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Descripción de Roles */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-blue-600" />
          Roles y Funciones del Equipo
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-purple-600" />
              <h4 className="font-bold text-gray-800">👑 ADMIN (Tú)</h4>
            </div>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>✓ Acceso completo al sistema</li>
              <li>✓ Gestionar equipo y permisos</li>
              <li>✓ Ver todos los leads y préstamos</li>
              <li>✓ Configurar landing page</li>
              <li>✓ Reportes y analytics completos</li>
            </ul>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h4 className="font-bold text-gray-800">👤 AGENTE</h4>
            </div>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>✓ Crear y gestionar leads asignados</li>
              <li>✓ Registrar préstamos y pagos</li>
              <li>✓ Usar WhatsApp integrado</li>
              <li>✓ Ver SUS métricas y rendimiento</li>
              <li>✓ Contactar clientes directamente</li>
            </ul>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-gray-600" />
              <h4 className="font-bold text-gray-800">👁️ VIEWER</h4>
            </div>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>✓ Solo lectura del sistema</li>
              <li>✓ Ver reportes y estadísticas</li>
              <li>✓ No puede crear ni editar</li>
              <li>✓ Ideal para supervisores</li>
              <li>✓ Auditoría y control</li>
            </ul>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      
      {/* Formulario para invitar */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-green-600" />
          Invitar Nuevo Miembro al Equipo
        </h2>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4 inline mr-1" />
              Email del Trabajador
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="trabajador@empresa.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rol a Asignar</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white"
            >
              <option value="agent">👤 Agente de Ventas</option>
              <option value="viewer">👁️ Viewer (Solo Lectura)</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>¿Cómo funciona?</strong><br/>
            El trabajador recibirá un email con enlace de acceso y password temporal. 
            Podrá empezar a trabajar inmediatamente y tú verás su rendimiento en tiempo real.
          </p>
        </div>
        
        <button
          onClick={invitarMiembro}
          disabled={loading || !email}
          className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {loading ? 'Enviando...' : 'Enviar Invitación'}
        </button>
      </div>
      
      {/* Rendimiento del Equipo */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Rendimiento Individual del Equipo
          </h2>
          <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            {members.length} {members.length === 1 ? 'miembro' : 'miembros'}
          </span>
        </div>
        
        {members.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">Aún no hay miembros en el equipo</p>
            <p className="text-gray-400 text-sm">Invita a tu primer trabajador para ver su rendimiento</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member) => (
              <div key={member.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {member.avatar_url ? (
                      <img src={member.avatar_url} alt={member.nombre} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {member.nombre?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-800">{member.nombre || 'Sin nombre'}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        member.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                        member.role === 'agent' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {member.role === 'admin' ? '👑 Admin' : 
                         member.role === 'agent' ? '👤 Agente' : '👁️ Viewer'}
                      </span>
                    </div>
                  </div>
                  {member.role !== 'admin' && (
                    <button
                      onClick={() => eliminarMiembro(member.id, member.email)}
                      disabled={loading}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {member.stats && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Leads asignados:</span>
                      <span className="font-semibold">{member.stats.leadsAsignados}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Convertidos:</span>
                      <span className="font-semibold text-green-600">{member.stats.leadsConvertidos}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Préstamos:</span>
                      <span className="font-semibold">{member.stats.prestamosCerrados}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monto gestionado:</span>
                      <span className="font-semibold text-blue-600">{formatMoney(member.stats.montoTotalGestionado)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cobrado:</span>
                      <span className="font-semibold text-emerald-600">{formatMoney(member.stats.pagosCobrados)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-gray-600">Tasa conversión:</span>
                      <span className={`font-bold ${
                        member.stats.tasaConversion >= 20 ? 'text-green-600' :
                        member.stats.tasaConversion >= 10 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {member.stats.tasaConversion.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actividad Reciente */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-600" />
          Actividad Reciente del Equipo
        </h2>
        
        {actividad.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No hay actividad reciente</p>
        ) : (
          <div className="space-y-3">
            {actividad.map((act) => (
              <div key={act.id} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  act.tipo === 'lead' ? 'bg-blue-100' :
                  act.tipo === 'prestamo' ? 'bg-green-100' :
                  'bg-emerald-100'
                }`}>
                  {act.tipo === 'lead' ? <Users className="w-5 h-5 text-blue-600" /> :
                   act.tipo === 'prestamo' ? <Briefcase className="w-5 h-5 text-green-600" /> :
                   <DollarSign className="w-5 h-5 text-emerald-600" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{act.accion}</p>
                  <p className="text-sm text-gray-600">Por: {act.usuario}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(act.fecha).toLocaleDateString('es-MX', { 
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
                    })}
                    {act.monto && ` • ${formatMoney(act.monto)}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
// app/components/NotificationsBell.tsx - VERSIÓN FINAL CON AUDIO ROBUSTO
'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthContext'
import { useNotificationSound } from '../lib/useNotificationSound'

interface Notification {
  id: string
  type: 'vencimiento' | 'nuevo_lead' | 'pago_recibido' | 'nuevo_prestamo'
  title: string
  message: string
  created_at: string
  read: boolean
  data?: any
}

export default function NotificationsBell() {
  const { user, isAdmin, isDistributor } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const channelRef = useRef<any>(null)
  
  // ✅ Hook de audio blindado
  const { play, vibrate, unlocked } = useNotificationSound()

  useEffect(() => {
    if (user) {
      fetchNotifications()
      setupRealtimeSubscription()
    }
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [user])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (!isAdmin() && isDistributor() && user?.id) {
        query = query.eq('distribuidor_id', user.id)
      }

      const {  data, error } = await query
      if (error) throw error
      
      setNotifications(data || [])
      setUnreadCount(data?.filter((n: any) => !n.read).length || 0)
    } catch (err) {
      console.error('Error fetching notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    console.log('🔧 [Bell] Configurando suscripción para user_id:', user?.id)
    
    channelRef.current = supabase
      .channel(`notifications_${user?.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user?.id}`
        },
        async (payload) => {
          console.log('🔔 [Bell] ¡EVENTO RECIBIDO!', payload.new)
          const newNotification = payload.new as Notification
          
          // ✅ CRÍTICO: Reproducir audio/vibración INMEDIATAMENTE
          console.log('🔊 [Bell] Audio unlocked:', unlocked, '- Llamando a play()')
          play()
          
          console.log('📳 [Bell] Llamando a vibrate()')
          vibrate()
          
          // Mostrar toast visual
          showToast(newNotification.title, newNotification.message)
          
          // Actualizar estado
          setNotifications(prev => [newNotification, ...prev])
          setUnreadCount(prev => prev + 1)
          
          console.log('✅ [Bell] Notificación procesada')
        }
      )
      .subscribe((status) => {
        console.log('📡 [Bell] Estado de suscripción:', status)
      })
  }

  const showToast = (title: string, message: string) => {
    // Eliminar toasts anteriores para evitar acumulación
    const existing = document.querySelector('[data-notification-toast]')
    if (existing) existing.remove()
    
    const toast = document.createElement('div')
    toast.setAttribute('data-notification-toast', 'true')
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #2563eb, #7c3aed);
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      z-index: 10000;
      max-width: 320px;
      animation: slideIn 0.3s ease;
      font-family: system-ui;
      cursor: pointer;
    `
    toast.innerHTML = `
      <div style="display: flex; gap: 12px; align-items: flex-start;">
        <div style="font-size: 20px;">🔔</div>
        <div style="flex: 1;">
          <div style="font-weight: 600; margin-bottom: 4px;">${title}</div>
          <div style="font-size: 14px; opacity: 0.9;">${message}</div>
        </div>
        <button onclick="this.closest('[data-notification-toast]').remove()" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer; padding: 0 4px;">&times;</button>
      </div>
      <style>
        @keyframes slideIn {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      </style>
    `
    
    // Cerrar al hacer clic en el toast
    toast.onclick = () => toast.remove()
    
    document.body.appendChild(toast)
    
    // Auto-eliminar después de 5 segundos
    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.animation = 'slideIn 0.3s ease reverse'
        setTimeout(() => toast.remove(), 300)
      }
    }, 5000)
  }

  const markAsRead = async (id: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
      
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Error marking as read:', err)
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', id)
      
      setNotifications(prev => prev.filter(n => n.id !== id))
      if (notifications.find(n => n.id === id && !n.read)) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error('Error deleting notification:', err)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'vencimiento': return '⏰'
      case 'nuevo_lead': return '🎯'
      case 'pago_recibido': return '💰'
      case 'nuevo_prestamo': return '📄'
      default: return '🔔'
    }
  }

  const getColor = (type: string) => {
    switch (type) {
      case 'vencimiento': return '#f87171'
      case 'nuevo_lead': return '#fbbf24'
      case 'pago_recibido': return '#34d399'
      case 'nuevo_prestamo': return '#60a5fa'
      default: return '#60a5fa'
    }
  }

  if (!user) return null

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          padding: '10px',
          background: 'rgba(255,255,255,0.1)',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '20px',
          color: 'white'
        }}
        aria-label="Notificaciones"
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            backgroundColor: '#ef4444',
            color: 'white',
            fontSize: '10px',
            fontWeight: 'bold',
            padding: '2px 6px',
            borderRadius: '9999px',
            minWidth: '18px',
            textAlign: 'center'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999
            }}
          />
          
          <div style={{
            position: 'absolute',
            top: '50px',
            right: '0',
            width: '320px',
            maxWidth: '90vw',
            backgroundColor: '#111827',
            border: '1px solid #1f2937',
            borderRadius: '12px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            zIndex: 1000,
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px',
              borderBottom: '1px solid #1f2937',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontWeight: 600, fontSize: '14px' }}>Notificaciones</span>
              {unreadCount > 0 && (
                <button
                  onClick={async () => {
                    await supabase
                      .from('notifications')
                      .update({ read: true })
                      .eq('user_id', user.id)
                    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
                    setUnreadCount(0)
                  }}
                  style={{
                    fontSize: '12px',
                    color: '#60a5fa',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Marcar todas como leídas
                </button>
              )}
            </div>

            <div style={{
              maxHeight: '400px',
              overflowY: 'auto',
              padding: '8px 0'
            }}>
              {loading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>
                  Cargando...
                </div>
              ) : notifications.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#6b7280' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>✨</div>
                  <div style={{ fontSize: '14px' }}>Sin notificaciones</div>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #1f2937',
                      backgroundColor: notif.read ? 'transparent' : 'rgba(59,130,246,0.1)',
                      borderLeft: `4px solid ${getColor(notif.type)}`,
                      cursor: 'pointer'
                    }}
                    onClick={() => markAsRead(notif.id)}
                  >
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '18px' }}>{getIcon(notif.type)}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                          {notif.title}
                        </div>
                        <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '8px' }}>
                          {notif.message}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>
                          {new Date(notif.created_at).toLocaleDateString('es-MX', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNotification(notif.id)
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#6b7280',
                          fontSize: '16px',
                          cursor: 'pointer',
                          padding: '4px'
                        }}
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
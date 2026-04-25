// app/lib/ProtectedRoute.tsx
'use client'

import { useEffect } from 'react'
import { useAuth } from './AuthContext'
import { useRouter, usePathname } from 'next/navigation'

export default function ProtectedRoute({ 
  children,
  requireAdmin = false 
}: { 
  children: React.ReactNode
  requireAdmin?: boolean 
}) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // ⛔ Si estamos en la página de login, no hacer nada (permitir acceso anónimo)
    if (pathname === '/login') return

    if (!loading && !user) {
      // No hay usuario -> Redirigir a Login
      router.push('/login')
    } else if (!loading && requireAdmin && user?.role !== 'admin') {
      // Requiere admin y no lo es -> Redirigir al Dashboard
      router.push('/')
    }
  }, [user, loading, router, requireAdmin, pathname])

  // ⏳ Pantalla de carga mientras verifica sesión
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        minHeight: '100vh', 
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundColor: '#0b0f19', 
        color: 'white',
        fontSize: '20px'
      }}>
        🔒 Verificando seguridad...
      </div>
    )
  }

  // 🚫 No renderizar nada si no está autenticado (para evitar parpadeo)
  if (!user && pathname !== '/login') return null

  return <>{children}</>
}
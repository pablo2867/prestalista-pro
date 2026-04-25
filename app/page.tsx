// app/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './lib/AuthContext'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        // ✅ Usuario logueado -> ir al dashboard
        router.push('/dashboard')
      } else {
        // ❌ No logueado -> ir al login
        router.push('/login')
      }
    }
  }, [user, loading, router])

  // 🌀 Pantalla de carga mientras decide
  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: '#0b0f19', 
      color: 'white',
      fontSize: '18px'
    }}>
      ⏳ Redirigiendo...
    </div>
  )
}
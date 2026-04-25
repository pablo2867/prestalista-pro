// app/lib/AuthContext.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type UserRole = 'admin' | 'distribuidor' | 'cobrador'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  distributor_id?: string
}

interface AuthContextType {
  user: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<{ error: any }>
  signOut: () => Promise<void>
  isAdmin: () => boolean
  isDistributor: () => boolean
  isCollector: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const loadProfile = async (userId: string) => {
      try {
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single()
        if (error) throw error
        setUser(profile)
      } catch (error) {
        console.error('Error cargando perfil:', error)
        await supabase.auth.signOut()
      } finally {
        setLoading(false)
      }
    }

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await loadProfile(session.user.id)
      } else {
        setLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signUp = async (email: string, password: string, fullName: string, role: UserRole) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role }
      }
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isAdmin = () => user?.role === 'admin'
  const isDistributor = () => user?.role === 'distribuidor'
  const isCollector = () => user?.role === 'cobrador'

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, isAdmin, isDistributor, isCollector }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}
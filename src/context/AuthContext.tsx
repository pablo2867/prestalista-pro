'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase'
import { User, Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { Profile } from '@/types/roles'

// ✅ 1. Definir el contexto
export const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  profileLoading: boolean
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, nombre: string) => Promise<{ error: any; needsConfirmation?: boolean }>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<Profile>) => Promise<{ error: any }>
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  
  // ✅ 2. Cliente singleton importado
  const supabase = createClient()
  const router = useRouter()

  // ✅ 3. useEffect con sintaxis CORRECTA
  useEffect(() => {
    let mounted = true

    const getSession = async () => {
      try {
        // ✅ CORRECTO: destructuring con "data:"
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        setSession(session)
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('❌ Error getting session:', error)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (!mounted) return
        setSession(newSession)
        setUser(newSession?.user ?? null)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Fetch profile
  useEffect(() => {
    async function fetchProfile() {
      if (!user) {
        setProfile(null)
        setProfileLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) throw error
        setProfile(data)
      } catch (err) {
        console.error('❌ Error fetching profile:', err)
      } finally {
        setProfileLoading(false)
      }
    }

    fetchProfile()
  }, [user])

  // Funciones
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signUp = async (email: string, password: string, nombre: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre } }
    })
    
    if (!error) {
      return { error: null, needsConfirmation: true }
    }
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') }
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', user.id)

      if (error) throw error

      const { data: updated } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(updated)
      return { error: null }
    } catch (err: any) {
      return { error: err }
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      profile,
      profileLoading,
      loading, 
      signIn, 
      signUp, 
      signOut, 
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { User, Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { uploadAvatar } from '@/utils/supabase/storage'
import { Profile } from '@/types/roles'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  profileLoading: boolean
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, nombre: string) => Promise<{ error: any; needsConfirmation?: boolean }>
  signOut: () => Promise<void>
  updateAvatar: (file: File) => Promise<{ error: any; url?: string }>
  updateProfile: (data: Partial<Profile>) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        router.refresh()
      }
    )

    return () => subscription.unsubscribe()
  }, [router, supabase])

  // Fetch profile when user changes
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
      }

      setProfileLoading(false)
    }

    fetchProfile()
  }, [user, supabase])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string, nombre: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre,
        },
      },
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

  const updateAvatar = async (file: File) => {
    if (!user) return { error: new Error('No user logged in') }
    
    try {
      const publicUrl = await uploadAvatar(file, user.id)
      
      // Actualizar metadata del usuario
      const { error } = await supabase.auth.updateUser({
        data: { 
          avatar_url: publicUrl 
        }
      })
      
      if (error) throw error
      
      // Refrescar user context
      const { data: { user: updatedUser } } = await supabase.auth.getUser()
      setUser(updatedUser)
      
      return { error: null, url: publicUrl }
    } catch (err: any) {
      console.error('❌ Error updating avatar:', err)
      return { error: err }
    }
  }

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') }
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', user.id)

      if (error) throw error

      // Refrescar perfil
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
      updateAvatar,
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
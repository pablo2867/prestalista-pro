'use client'

import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { UserRole, Profile, ROLE_PERMISSIONS } from '@/types/roles'

export function useRole() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchProfile() {
      if (!user) {
        setLoading(false)
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

      setLoading(false)
    }

    fetchProfile()
  }, [user, supabase])

  const role: UserRole = profile?.role || 'viewer'

  const hasPermission = (permission: keyof typeof ROLE_PERMISSIONS['admin']) => {
    return ROLE_PERMISSIONS[role][permission]
  }

  const isAdmin = role === 'admin'
  const isVendedor = role === 'vendedor'
  const isViewer = role === 'viewer'

  return {
    profile,
    role,
    loading,
    hasPermission,
    isAdmin,
    isVendedor,
    isViewer,
  }
}
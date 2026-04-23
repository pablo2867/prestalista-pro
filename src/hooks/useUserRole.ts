'use client'

import { useAuth } from '@/context/AuthContext'

export function useUserRole() {
  const { user, profile } = useAuth()
  
  const role = profile?.role || 'agent'
  const isAdmin = role === 'admin'
  const isAgent = role === 'agent'
  const isViewer = role === 'viewer'
  
  const canAccess = (feature: string) => {
    const permissions: Record<string, string[]> = {
      'landing-editor': ['admin'],
      'team-management': ['admin'],
      'billing': ['admin'],
      'leads-all': ['admin'],
      'leads-own': ['admin', 'agent'],
      'prestamos-create': ['admin', 'agent'],
      'prestamos-edit-own': ['agent'],
      'prestamos-edit-all': ['admin'],
      'reports': ['admin', 'agent'],
      'configuracion': ['admin'],
    }
    return permissions[feature]?.includes(role) || false
  }
  
  return { 
    role, 
    isAdmin, 
    isAgent, 
    isViewer, 
    canAccess,
    userId: user?.id 
  }
}
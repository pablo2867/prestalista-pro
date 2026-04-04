'use client'

import { useAuth } from '@/context/AuthContext'
import { UserRole } from '@/types/roles'

export function UserRoleBadge() {
  const { profile, profileLoading } = useAuth()

  if (profileLoading || !profile) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
        Cargando...
      </span>
    )
  }

  const roleColors: Record<UserRole, string> = {
    admin: 'bg-red-100 text-red-700 border-red-200',
    vendedor: 'bg-blue-100 text-blue-700 border-blue-200',
    viewer: 'bg-gray-100 text-gray-700 border-gray-200',
  }

  const roleLabels: Record<UserRole, string> = {
    admin: 'Admin',
    vendedor: 'Vendedor',
    viewer: 'Viewer',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleColors[profile.role]}`}>
      {roleLabels[profile.role]}
    </span>
  )
}
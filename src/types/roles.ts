export type UserRole = 'admin' | 'vendedor' | 'viewer'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export const ROLE_PERMISSIONS = {
  admin: {
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canManageUsers: true,
  },
  vendedor: {
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canManageUsers: false,
  },
  viewer: {
    canView: true,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canManageUsers: false,
  },
}

export function hasPermission(role: UserRole, permission: keyof typeof ROLE_PERMISSIONS['admin']) {
  return ROLE_PERMISSIONS[role][permission]
}




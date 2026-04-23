'use client'

import { AuthProvider } from '@/context/AuthContext'

export default function CrmLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}

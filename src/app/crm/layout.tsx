'use client'

import Sidebar from '@/components/Sidebar'
import ChatButton from '@/components/WhatsappButton'

export default function CRMLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-64">
        {children}
        <ChatButton />
      </main>
    </div>
  )
}
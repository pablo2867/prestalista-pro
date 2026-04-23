// Root Layout con AuthProvider + TenantProvider
import { AuthProvider } from '@/context/AuthContext'
import { TenantProvider } from '@/context/TenantContext'
import './globals.css'

export const metadata = {
  title: 'PrestaLista Pro',
  description: 'Sistema de Gestión de Préstamos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="bg-[#0a0a0f] text-white antialiased">
        <AuthProvider>
          <TenantProvider>
            {children}
          </TenantProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
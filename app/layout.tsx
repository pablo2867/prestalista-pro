// app/layout.tsx
import './globals.css'
import { GlobalProvider } from './lib/GlobalContext'
import { AuthProvider } from './lib/AuthContext'
import SearchBar from './components/SearchBar'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PrestaLista Pro',
  description: 'Sistema de gestión de préstamos seguro',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <GlobalProvider>
            {/* 🔍 Header Fijo (Visible en toda la app menos en login si se desea, aquí es global) */}
            <div style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              right: 0, 
              height: '60px', 
              backgroundColor: 'rgba(17, 24, 39, 0.95)', 
              backdropFilter: 'blur(10px)',
              borderBottom: '1px solid #1f2937',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              padding: '0 24px'
            }}>
              <SearchBar />
            </div>
            
            {/* Espacio para que el header no tape el contenido */}
            <div style={{ height: '60px' }}></div>
            
            {children}
          </GlobalProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
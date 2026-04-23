// app/layout.tsx
import './globals.css'
import { GlobalProvider } from './lib/GlobalContext'
import SearchBar from './components/SearchBar' // 🔍 Importar búsqueda
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PrestaLista Pro',
  description: 'Sistema de gestión de préstamos y distribuidores',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <GlobalProvider>
          {/* 🔍 Header Global con Búsqueda */}
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
          
          {/* Espacio para el header fijo */}
          <div style={{ height: '60px' }}></div>
          
          {children}
        </GlobalProvider>
      </body>
    </html>
  )
}
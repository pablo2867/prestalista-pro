import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import TidioChat from '@/app/components/chatbot/TidioChat'  // 👈 Import del chatbot

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PrestaLista Pro - CRM Inteligente para Préstamos',
  description: 'Gestiona tus leads de préstamos, contacta por WhatsApp y automatiza tu negocio financiero.',
  keywords: 'préstamos, CRM, leads, WhatsApp, finanzas, México',
  authors: [{ name: 'PrestaLista Pro' }],
  openGraph: {
    title: 'PrestaLista Pro - CRM Inteligente para Préstamos',
    description: 'Gestiona tus leads de préstamos, contacta por WhatsApp y automatiza tu negocio financiero.',
    type: 'website',
    locale: 'es_MX',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <TidioChat />  {/* 👈 Chatbot de Tidio - Se carga en todas las páginas */}
        </AuthProvider>
      </body>
    </html>
  )
}

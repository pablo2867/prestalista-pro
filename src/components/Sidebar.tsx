'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

// import LanguageSwitcher from './LanguageSwitcher'  // ← DESACTIVADO TEMPORALMENTE

const navItems = [
  { href: '/crm/dashboard', label: '📊 Dashboard', icon: '📊' },
  { href: '/crm/capital', label: '💰 Capital', icon: '💰' },
  { href: '/crm/prestamos', label: '💳 Préstamos', icon: '💳' },
  { href: '/crm/distribuidores', label: '👥 Distribuidores', icon: '👥' },
  { href: '/crm/reportes', label: '📈 Reportes', icon: '📈' },
  { href: '/crm/ajustes', label: '⚙️ Ajustes', icon: '⚙️' },
]

export default function Sidebar() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <aside className="w-64 bg-[#1a1a25] border-r border-[#2a2a35] flex flex-col min-h-screen fixed left-0 top-0">
      {/* Logo / Brand */}
      <div className="p-6 border-b border-[#2a2a35]">
        <Link href="/crm/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-xl">
            💰
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">PrestaLista</h1>
            <p className="text-gray-400 text-xs">Pro</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'text-gray-300 hover:bg-[#2a2a35] hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-[#2a2a35]">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm truncate">
              {user?.email?.split('@')[0] || 'Usuario'}
            </p>
            <p className="text-gray-400 text-xs truncate">
              {user?.email || 'sin@email.com'}
            </p>
          </div>
        </div>
      </div>

      {/* Language Switcher - DESACTIVADO TEMPORALMENTE */}
      {/*
      <div className="px-4 pb-4">
        <LanguageSwitcher />
      </div>
      */}

      {/* Logout Button */}
      <div className="p-4 border-t border-[#2a2a35]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-all duration-200"
        >
          <span className="text-lg">🔐</span>
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  )
}
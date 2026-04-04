'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  DollarSign,
  TrendingUp,
  Calendar,
  Bell
} from 'lucide-react'
import AvatarUploader from './AvatarUploader'

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/crm' },
    { icon: Users, label: 'Clientes', href: '/crm/clientes' },
    { icon: FileText, label: 'Préstamos', href: '/crm/prestamos' },
    { icon: DollarSign, label: 'Pagos', href: '/crm/pagos' },
    { icon: TrendingUp, label: 'Reportes', href: '/crm/reportes' },
    { icon: Calendar, label: 'Calendario', href: '/crm/calendario' },
    { icon: Bell, label: 'Notificaciones', href: '/crm/notificaciones' },
    { icon: Settings, label: 'Configuración', href: '/crm/configuracion' },
  ]

  const handleSignOut = async () => {
    await signOut()
  }

  const getUserInitials = () => {
    if (!user) return '?'
    const name = user.user_metadata?.nombre || user.email?.split('@')[0] || 'U'
    return name.charAt(0).toUpperCase()
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">PrestaLista Pro</h1>
                <p className="text-xs text-gray-500">CRM de Préstamos</p>
              </div>
            </div>
          </div>

          {/* User Profile */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <AvatarUploader size="md" editable={true} />
              <div className="text-left flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {user?.user_metadata?.nombre || user?.email?.split('@')[0]}
                </p>
                <p className="text-xs text-gray-600 truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                
                return (
                  <li key={item.href}>
                    <button
                      onClick={() => {
                        router.push(item.href)
                        setIsOpen(false)
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area Spacer */}
      <div className="lg:ml-64" />
    </>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/utils/supabase/client'

interface Cliente {
  id: string
  nombre: string
  email: string
  telefono: string
  empresa: string
  estado: string
  creado_en: string
}

export default function ClientesPage() {
  const { user, profileLoading } = useAuth()
  const supabase = createClient()
  
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchClientes() {
      if (!user) return

      try {
        // Nota: Por ahora usamos la tabla 'leads' con estado 'aprobado'
        // Cuando creemos la tabla 'clientes', cambiaremos esto
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .eq('estado', 'aprobado')
          .order('creado_en', { ascending: false })

        if (error) throw error
        setClientes(data || [])
      } catch (err) {
        console.error('❌ Error cargando clientes:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchClientes()
  }, [user, supabase])

  if (loading || profileLoading) {
    return (
      <div className="p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">👥 Clientes</h1>
        <p className="text-gray-600 mt-1">Gestiona tus clientes aprobados</p>
      </div>

      {/* Tabla de Clientes */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Nombre</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Teléfono</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Empresa</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Desde</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {clientes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <p className="text-lg mb-2">🎉 ¡Aún no tienes clientes aprobados!</p>
                    <p className="text-sm">
                      Los leads que apruebes aparecerán aquí automáticamente.
                    </p>
                  </td>
                </tr>
              ) : (
                clientes.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{cliente.nombre}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{cliente.email}</td>
                    <td className="px-6 py-4 text-gray-600">{cliente.telefono}</td>
                    <td className="px-6 py-4 text-gray-600">{cliente.empresa}</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {new Date(cliente.creado_en).toLocaleDateString('es-MX')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contador */}
      <div className="mt-4 text-sm text-gray-500">
        {clientes.length} cliente{clientes.length !== 1 ? 's' : ''} aprobado{clientes.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}
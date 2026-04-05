'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { Lock, Mail, Building2, User, CheckCircle } from 'lucide-react'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { signIn, signUp } = useAuth()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    console.log('📝 handleSubmit llamado')
    console.log('Email:', email)
    console.log('Password:', password)
    console.log('Nombre:', nombre)
    console.log('Is Login:', isLogin)
    
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (isLogin) {
        console.log('🔐 Intentando login...')
        const { error } = await signIn(email, password)
        if (error) throw error
        router.push('/crm')
      } else {
        console.log('📝 Intentando signUp...')
        const { error, needsConfirmation } = await signUp(email, password, nombre)
        console.log('✅ Respuesta signUp:', { error, needsConfirmation })
        
        if (error) {
          console.error('❌ Error en signUp:', error)
          throw error
        }
        
        if (needsConfirmation) {
          setSuccess(`✅ Cuenta creada. Por favor revisa tu email ${email} para confirmar tu cuenta.`)
          setEmail('')
          setPassword('')
          setNombre('')
        }
      }
    } catch (err: any) {
      console.error('❌ Auth error:', err)
      setError(err.message || 'Ocurrió un error')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">PrestaLista Pro</h1>
          <p className="text-gray-500 mt-1">CRM para gestión de préstamos</p>
        </div>

        <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              isLogin ? 'bg-white text-blue-600 shadow' : 'text-gray-600'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              !isLogin ? 'bg-white text-blue-600 shadow' : 'text-gray-600'
            }`}
          >
            Registrarse
          </button>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm p-4 rounded-lg mb-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tu nombre"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="tu@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            onClick={() => {
              console.log('🔴 BOTÓN CLICKED - Email:', email)
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading 
              ? 'Procesando...' 
              : isLogin 
                ? 'Iniciar Sesión' 
                : 'Crear Cuenta'
            }
          </button>
        </form>

        <div className="mt-6 text-center">
          {isLogin && (
            <p className="text-sm text-gray-500">
              ¿Olvidaste tu contraseña?{' '}
              <button 
                type="button" 
                className="text-blue-600 hover:underline"
                onClick={() => alert('Función de recuperación en desarrollo')}
              >
                Recuperar
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

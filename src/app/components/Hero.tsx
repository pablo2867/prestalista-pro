'use client'

import Link from 'next/link'

export default function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white overflow-hidden">
      <div className="container mx-auto px-6 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
              <span className="text-sm font-semibold">🚀 CRM para gestión de préstamos</span>
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
              Gestiona tus{' '}
              <span className="text-yellow-300">préstamos</span>{' '}
              de forma inteligente
            </h1>
            
            <p className="text-xl text-blue-100 leading-relaxed">
              PrestaLista Pro es la plataforma todo-en-uno para administrar 
              tus préstamos, seguir leads y cerrar más ventas.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-purple-700 bg-white rounded-lg hover:bg-blue-50 transition shadow-lg"
              >
                Probar Gratis →
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white border-2 border-white rounded-lg hover:bg-white/10 transition"
              >
                Iniciar Sesión
              </Link>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-blue-200">
              <span>✓ Sin tarjeta de crédito</span>
              <span>✓ 14 días gratis</span>
              <span>✓ Cancela cuando quieras</span>
            </div>
          </div>
          
          {/* Right Content - Preview */}
          <div className="relative">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-2xl">
              <div className="bg-white rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">Dashboard</h3>
                    <p className="text-sm text-gray-500">Resumen de préstamos</p>
                  </div>
                  <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                    +24% este mes
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">156</p>
                    <p className="text-sm text-gray-600">Total Leads</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">89</p>
                    <p className="text-sm text-gray-600">Aprobados</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">$2.4M</p>
                    <p className="text-sm text-gray-600">En préstamos</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl"></div>
      </div>
    </section>
  )
}
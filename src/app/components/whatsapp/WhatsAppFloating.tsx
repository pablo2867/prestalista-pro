'use client'

import { MessageCircle } from 'lucide-react'

export default function WhatsAppFloating() {
  const phoneNumber = '5219934023786'
  const message = encodeURIComponent('Hola, quiero información sobre préstamos')
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`

  const handleClick = () => {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 group">
      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-3 w-64 bg-white rounded-lg shadow-xl p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              ¿Necesitas ayuda?
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Habla con nosotros por WhatsApp. Respondemos en minutos.
            </p>
            <div className="flex items-center gap-1 mt-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-xs text-green-600 font-medium">En línea</span>
            </div>
          </div>
        </div>
        {/* Triangle pointing down */}
        <div className="absolute bottom-[-6px] right-5 w-3 h-3 bg-white transform rotate-45 shadow-md"></div>
      </div>

      {/* Button with pulse animation */}
      <button
        onClick={handleClick}
        className="relative flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-110"
        title="Contactar por WhatsApp"
      >
        {/* Pulse rings */}
        <span className="absolute inset-0 rounded-full bg-green-500 opacity-75 animate-ping"></span>
        <span className="absolute inset-0 rounded-full bg-green-500 opacity-50 animate-pulse"></span>
        
        {/* Icon */}
        <MessageCircle className="relative w-8 h-8" />
        
        {/* Online badge */}
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></span>
      </button>
    </div>
  )
}
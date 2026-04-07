'use client'

import { MessageCircle } from 'lucide-react'

export default function WhatsAppFloating() {
  const phoneNumber = '5219934023786' // Tu número de WhatsApp
  const message = encodeURIComponent('Hola, quiero información sobre préstamos')
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`

  const handleClick = () => {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
      title="Contactar por WhatsApp"
    >
      <MessageCircle className="w-7 h-7" />
    </button>
  )
}
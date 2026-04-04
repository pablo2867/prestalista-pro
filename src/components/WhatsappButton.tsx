'use client'

import { MessageCircle } from 'lucide-react'

export default function ChatButton() {
  // Tu número de WhatsApp (cámbialo por el tuyo)
  const phoneNumber = '529934023786' // +52 993 402 3786
  
  // Mensaje predefinido
  const message = 'Hola, quiero información sobre préstamos'
  
  // Crear link de WhatsApp
  const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`

  return (
    <a
      href={whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 z-50 flex items-center gap-2 group"
      title="Chatea con nosotros"
    >
      <MessageCircle className="w-6 h-6" />
      <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">
        ¡Escríbenos!
      </span>
    </a>
  )
}
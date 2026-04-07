'use client'

import { MessageCircle } from 'lucide-react'

interface WhatsAppButtonProps {
  phoneNumber: string
  leadName?: string
  message?: string
  variant?: 'primary' | 'icon'
  className?: string
}

export default function WhatsAppButton({
  phoneNumber,
  leadName = '',
  message = 'Hola, te contacto desde PrestaLista Pro',
  variant = 'primary',
  className = ''
}: WhatsAppButtonProps) {
  
  // Formatear número: quitar espacios, guiones, paréntesis
  const formatPhone = (phone: string) => {
    return phone.replace(/[\s\-\(\)]/g, '')
  }

  // Crear mensaje personalizado
  const createMessage = () => {
    const baseMessage = message
    const personalizedMessage = leadName 
      ? `${baseMessage}\n\nHola ${leadName}, ¿cómo estás?`
      : baseMessage
    
    return encodeURIComponent(personalizedMessage)
  }

  // Generar link de WhatsApp
  const whatsappLink = `https://wa.me/${formatPhone(phoneNumber)}?text=${createMessage()}`

  // Abrir WhatsApp en nueva pestaña
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    window.open(whatsappLink, '_blank', 'noopener,noreferrer')
  }

  // Variantes de estilo
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors rounded-lg'
  const variants = {
    primary: 'bg-green-500 hover:bg-green-600 text-white px-4 py-2 gap-2',
    icon: 'bg-green-100 hover:bg-green-200 text-green-700 p-2'
  }

  return (
    <a
      href={whatsappLink}
      onClick={handleClick}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      target="_blank"
      rel="noopener noreferrer"
      title={`Enviar WhatsApp a ${phoneNumber}`}
    >
      <MessageCircle className="w-4 h-4" />
      {variant === 'primary' && <span>WhatsApp</span>}
    </a>
  )
}
'use client'

import { Mail } from 'lucide-react'
import emailjs from '@emailjs/browser'
import { useState } from 'react'

interface EmailButtonProps {
  lead: {
    nombre: string
    email: string
    telefono: string
    whatsapp?: string
    empresa: string
    estado: string
  }
}

export default function EmailButton({ lead }: EmailButtonProps) {
  const [sending, setSending] = useState(false)
  const [showModal, setShowModal] = useState(false)

  async function sendEmail() {
    setSending(true)

    const templateParams = {
      nombre: lead.nombre,
      email: lead.email,
      telefono: lead.telefono,
      whatsapp: lead.whatsapp || 'No especificado',
      empresa: lead.empresa,
      estado: lead.estado,
      date: new Date().toLocaleDateString('es-ES'),
    }

    try {
      console.log('📧 Enviando email...', templateParams)
      
      await emailjs.send(
        'service_7v936gk',        // ✅ Service ID
        'template_ihovqq3',       // ✅ Template ID CORRECTO
        templateParams,
        'aFlp1rsn0ox3qZtJa'       // ✅ Public Key
      )
      
      console.log('✅ Email enviado exitosamente')
      alert('✅ Email enviado exitosamente')
      setShowModal(false)
    } catch (error: any) {
      console.error('❌ Error enviando email:', error)
      alert('❌ Error al enviar email: ' + (error.text || error.message || 'Revisa la consola'))
    }

    setSending(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
        title="Enviar Email"
      >
        <Mail className="w-4 h-4" />
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">¿Enviar email a {lead.nombre}?</h3>
            
            <p className="text-gray-600 mb-4">
              Se enviará la información del lead a:<br/>
              <strong>{lead.email}</strong>
            </p>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={sendEmail}
                disabled={sending}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {sending ? 'Enviando...' : 'Enviar Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
'use client'

import { useState } from 'react'

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs = [
    {
      question: '¿Qué es PrestaLista Pro?',
      answer: 'PrestaLista Pro es una plataforma CRM todo-en-uno diseñada específicamente para la gestión de préstamos y seguimiento de leads.'
    },
    {
      question: '¿Necesito tarjeta de crédito para empezar?',
      answer: 'No, puedes comenzar con nuestra prueba gratuita de 14 días sin necesidad de tarjeta de crédito.'
    },
    {
      question: '¿Puedo cancelar en cualquier momento?',
      answer: 'Sí, puedes cancelar tu suscripción en cualquier momento sin penalizaciones.'
    },
    {
      question: '¿Mis datos están seguros?',
      answer: 'Absolutamente. Usamos encriptación de nivel bancario y cumplimos con GDPR.'
    },
    {
      question: '¿Ofrecen soporte técnico?',
      answer: 'Sí, ofrecemos soporte por email para todos los planes. Los planes Profesional y Empresarial incluyen soporte prioritario 24/7.'
    },
    {
      question: '¿Puedo importar mis datos desde otro CRM?',
      answer: 'Sí, ofrecemos herramientas de importación para migrar tus datos desde la mayoría de los CRMs populares.'
    },
    {
      question: '¿Hay límite de leads en el plan Básico?',
      answer: 'El plan Básico incluye hasta 100 leads. Si necesitas más, puedes actualizar al plan Profesional.'
    },
    {
      question: '¿Puedo agregar más usuarios a mi cuenta?',
      answer: 'Sí, cada plan incluye un número específico de usuarios. Puedes agregar usuarios adicionales contactando a ventas.'
    }
  ]

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Preguntas{' '}
            <span className="text-blue-600">frecuentes</span>
          </h2>
          <p className="text-xl text-gray-600">
            Todo lo que necesitas saber sobre PrestaLista Pro
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 text-left bg-white hover:bg-gray-50 transition flex items-center justify-between"
              >
                <span className="font-semibold text-gray-900">
                  {faq.question}
                </span>
                <span className={`text-2xl text-blue-600 transition-transform ${
                  openIndex === index ? 'rotate-45' : ''
                }`}>
                  +
                </span>
              </button>
              
              {openIndex === index && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <p className="text-gray-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <p className="text-gray-600 mb-6">
            ¿Tienes más preguntas? Estamos aquí para ayudarte
          </p>
          <a
            href="mailto:soporte@prestalista.com"
            className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            Contactar Soporte →
          </a>
        </div>
      </div>
    </section>
  )
}
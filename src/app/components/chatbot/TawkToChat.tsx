'use client'

import { useEffect } from 'react'

export default function TawkToChat() {
  useEffect(() => {
    // Evitar cargar múltiples veces
    if (document.getElementById('tawk-chat')) return

    // Crear elemento de script para Tawk.to
    const script = document.createElement('script')
    script.id = 'tawk-chat'
    script.async = true
    script.charset = 'UTF-8'
    script.setAttribute('crossorigin', '*')
    script.src = 'https://embed.tawk.to/69d5078b36a1f31c37155b83/1jlk2aule'
    
    // Agregar al body del documento
    document.body.appendChild(script)

    // Cleanup: remover script al desmontar el componente
    return () => {
      const existingScript = document.getElementById('tawk-chat')
      if (existingScript) {
        document.body.removeChild(existingScript)
      }
    }
  }, [])

  // Este componente no renderiza nada visible
  return null
}
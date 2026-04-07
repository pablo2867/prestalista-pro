'use client'

import { useEffect } from 'react'

export default function TidioChat() {
  useEffect(() => {
    // Evitar cargar múltiples veces
    if (document.getElementById('tidio-chat')) return

    // Crear elemento de script para Tidio
    const script = document.createElement('script')
    script.id = 'tidio-chat'
    script.src = '//code.tidio.co/ekbj9i9sy5cvzksxz58aqye2tbuhigmy.js'
    script.async = true
    
    // Agregar al body del documento
    document.body.appendChild(script)

    // Cleanup: remover script al desmontar el componente
    return () => {
      const existingScript = document.getElementById('tidio-chat')
      if (existingScript) {
        document.body.removeChild(existingScript)
      }
    }
  }, [])

  // Este componente no renderiza nada visible
  return null
}
'use client'
import { useRef, useEffect, useCallback } from 'react'

export function useNotificationSound() {
  const ctxRef = useRef<AudioContext | null>(null)
  const bufferRef = useRef<AudioBuffer | null>(null)
  const unlockedRef = useRef(false)

  // 1. Inicializar audio y pre-generar el buffer (sonido "Ding")
  const initAudio = useCallback(async () => {
    if (unlockedRef.current) return
    const AC = window.AudioContext || (window as any).webkitAudioContext
    if (!AC) return

    const ctx = new AC()
    if (ctx.state === 'suspended') await ctx.resume()

    // Generar tono descendente suave (400ms) -> Más fiable que osciladores en móvil
    const sampleRate = ctx.sampleRate
    const length = sampleRate * 0.4
    const buffer = ctx.createBuffer(1, length, sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate
      data[i] = Math.sin(2 * Math.PI * 880 * Math.exp(-t * 3) * t) * Math.exp(-t * 10) * 0.5
    }

    ctxRef.current = ctx
    bufferRef.current = buffer
    unlockedRef.current = true
    console.log('🔊 Sistema de audio listo y desbloqueado')
  }, [])

  // 2. Escuchar el PRIMER gesto de usuario en toda la app para desbloquear
  useEffect(() => {
    const unlock = () => initAudio()
    document.addEventListener('click', unlock, { once: true })
    document.addEventListener('touchstart', unlock, { once: true })
    document.addEventListener('keydown', unlock, { once: true })
    return () => {
      document.removeEventListener('click', unlock)
      document.removeEventListener('touchstart', unlock)
      document.removeEventListener('keydown', unlock)
    }
  }, [initAudio])

  // 3. Función segura para reproducir (puede ser llamada desde cualquier lado)
  const play = useCallback(() => {
    if (!unlockedRef.current || !ctxRef.current || !bufferRef.current) {
      console.log('⏳ Audio en espera de interacción del usuario...')
      return
    }
    try {
      const src = ctxRef.current.createBufferSource()
      src.buffer = bufferRef.current
      src.connect(ctxRef.current.destination)
      src.start()
    } catch (e) { console.error(e) }
  }, [])

  // 4. Vibración (solo Android)
  const vibrate = useCallback(() => {
    if ('vibrate' in navigator) navigator.vibrate([200, 100, 200])
  }, [])

  return { play, vibrate, unlocked: unlockedRef.current }
}
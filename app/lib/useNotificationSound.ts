'use client'
import { useRef, useEffect, useCallback } from 'react'

export function useNotificationSound() {
  const ctxRef = useRef<AudioContext | null>(null)
  const bufferRef = useRef<AudioBuffer | null>(null)
  const unlockedRef = useRef(false)
  const hasInteractedRef = useRef(false)
  const playAttemptedRef = useRef(false)

  // 1️⃣ Inicializar audio y pre-generar buffer "Ding"
  const initAudio = useCallback(async () => {
    if (unlockedRef.current) return true
    
    const AC = window.AudioContext || (window as any).webkitAudioContext
    if (!AC) {
      console.error('❌ Web Audio API no soportada')
      return false
    }

    try {
      const ctx = new AC()
      
      // Reanudar inmediatamente si está suspendido
      if (ctx.state === 'suspended') {
        await ctx.resume()
        console.log('✅ AudioContext resumed en init')
      }

      // Generar tono "ding" descendente (400ms) - más fuerte y claro
      const sampleRate = ctx.sampleRate
      const length = sampleRate * 0.4
      const buffer = ctx.createBuffer(1, length, sampleRate)
      const data = buffer.getChannelData(0)
      
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate
        // Frecuencia: 880Hz → 440Hz con envelope más pronunciado
        const freq = 880 * Math.exp(-t * 2.5)
        const envelope = Math.exp(-t * 12) // Decay más rápido = sonido más "clic"
        data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.8
      }

      ctxRef.current = ctx
      bufferRef.current = buffer
      unlockedRef.current = true
      console.log('🔊 Sistema de audio listo y desbloqueado')
      return true
    } catch (err) {
      console.error('❌ Error inicializando audio:', err)
      return false
    }
  }, [])

  // 2️⃣ Escuchar PRIMER gesto de usuario para desbloquear audio
  useEffect(() => {
    const unlock = async () => {
      hasInteractedRef.current = true
      if (!unlockedRef.current) {
        await initAudio()
      }
      // Forzar desbloqueo adicional
      if (ctxRef.current?.state === 'suspended') {
        await ctxRef.current.resume()
      }
    }
    
    // Escuchar múltiples tipos de interacción con capture: true
    document.addEventListener('click', unlock, { once: true, capture: true })
    document.addEventListener('touchstart', unlock, { once: true, capture: true })
    document.addEventListener('keydown', unlock, { once: true, capture: true })
    
    return () => {
      document.removeEventListener('click', unlock, true)
      document.removeEventListener('touchstart', unlock, true)
      document.removeEventListener('keydown', unlock, true)
    }
  }, [initAudio])

  // 3️⃣ Función segura para reproducir (con reintentos y fallback)
  const play = useCallback(async () => {
    playAttemptedRef.current = true
    
    // Si no está listo pero ya hubo interacción, intentar inicializar AHORA
    if (!unlockedRef.current && hasInteractedRef.current) {
      console.log('⏳ Audio no inicializado, intentando ahora...')
      const success = await initAudio()
      if (!success) {
        console.warn('⚠️ No se pudo inicializar el audio')
        return false
      }
    }
    
    // Verificar estado final antes de reproducir
    if (!unlockedRef.current || !ctxRef.current || !bufferRef.current) {
      console.log('⏳ Audio en espera (hasInteracted:', hasInteractedRef.current, ')')
      return false
    }

    try {
      const ctx = ctxRef.current
      
      // CRÍTICO: Reanudar justo antes de reproducir (políticas de autoplay)
      if (ctx.state === 'suspended') {
        await ctx.resume()
        console.log('✅ AudioContext resumed en play()')
      }

      // Crear fuente de buffer
      const src = ctx.createBufferSource()
      src.buffer = bufferRef.current
      
      // Agregar nodo de ganancia para control de volumen
      const gainNode = ctx.createGain()
      gainNode.gain.setValueAtTime(0.8, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35)
      
      // Conectar: buffer → gain → salida
      src.connect(gainNode)
      gainNode.connect(ctx.destination)
      
      // Reproducir en el tiempo exacto
      src.start(ctx.currentTime)
      
      console.log('🔔 Sonido de notificación reproducido exitosamente')
      return true
    } catch (e: any) {
      console.error('❌ Error reproduciendo audio:', e?.message || e)
      
      // Fallback: intentar con oscilador simple si el buffer falla
      try {
        const ctx = ctxRef.current
        if (!ctx) return false
        
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        
        osc.connect(gain)
        gain.connect(ctx.destination)
        
        osc.frequency.setValueAtTime(880, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.2)
        osc.type = 'triangle' // Más audible que 'sine'
        
        gain.gain.setValueAtTime(0.6, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25)
        
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.25)
        
        console.log('🔊 Fallback con oscilador ejecutado')
        return true
      } catch (fallbackErr) {
        console.error('❌ Fallback también falló:', fallbackErr)
        return false
      }
    }
  }, [])

  // 4️⃣ Vibración (solo Android - iOS no permite vibración web)
  const vibrate = useCallback(() => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200])
        console.log('📳 Vibración activada')
        return true
      } catch (e) {
        console.log('⚠️ Vibración no disponible:', e)
        return false
      }
    }
    return false
  }, [])

  // 5️⃣ Función de diagnóstico (útil para debug)
  const getAudioStatus = useCallback(() => ({
    unlocked: unlockedRef.current,
    hasInteracted: hasInteractedRef.current,
    playAttempted: playAttemptedRef.current,
    ctxState: ctxRef.current?.state || 'null',
    hasBuffer: !!bufferRef.current
  }), [])

  return { 
    play, 
    vibrate, 
    unlocked: unlockedRef.current,
    getAudioStatus 
  }
}
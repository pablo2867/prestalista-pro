// app/api/test-notif/route.ts - ENDPOINT DE PRUEBA (CORREGIDO)
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  console.log('🧪 [TEST] Iniciando prueba de notificación...')
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    console.log('📤 Insertando notificación de prueba...')
    
    // ✅ CORREGIDO: 
    // 1. Desestructurar { data, error } (no testNotif)
    // 2. Agregar clave "data:" antes del objeto anidado
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: '6bafc166-ea84-4e03-9526-000d64e4c8c6',
        type: 'test_notification',
        title: '🧪 Prueba de Notificación',
        message: 'Si ves esto, la API puede crear notificaciones',
        data: { test: true, timestamp: new Date().toISOString() }, // ← ✅ Agregada clave "data:"
        read: false
      })
      .select() // ✅ Agregado .select() para recibir los datos insertados

    if (error) {
      console.error('❌ [TEST] Error de Supabase:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return NextResponse.json({ success: false, error }, { status: 500 })
    }

    console.log('✅ [TEST] NOTIFICACIÓN CREADA:', data)
    return NextResponse.json({ success: true, data }, { status: 201 })
    
  } catch (err: any) {
    console.error('💥 [TEST] Excepción:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
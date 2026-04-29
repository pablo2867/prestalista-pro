// app/api/test-notif/route.ts - VERSIÓN CON GET Y POST
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ✅ GET: Para probar desde el navegador
export async function GET() {
  return NextResponse.json({ 
    message: '✅ Endpoint activo. Usa POST para crear la notificación de prueba.',
    instructions: 'Ejecuta: curl -X POST https://prestalista-pro.vercel.app/api/test-notif'
  })
}

// ✅ POST: Crea la notificación de prueba
export async function POST() {
  console.log('🧪 [TEST] Iniciando prueba de notificación...')
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    console.log('📤 Insertando notificación de prueba...')
    
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: '6bafc166-ea84-4e03-9526-000d64e4c8c6',
        type: 'test_notification',
        title: '🧪 Prueba de Notificación',
        message: 'Si ves esto en Supabase, la API funciona correctamente.',
         { test: true, timestamp: new Date().toISOString() },
        read: false
      })
      .select()

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
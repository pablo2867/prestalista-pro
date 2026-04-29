import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  return NextResponse.json({ message: 'OK - Usa POST para probar' })
}

export async function POST() {
  console.log('🧪 [TEST] Iniciando prueba...')
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: '6bafc166-ea84-4e03-9526-000d64e4c8c6',
        type: 'test_notification',
        title: '🧪 Prueba de Notificación',
        message: 'Si ves esto, la API funciona',
        data: { test: true, timestamp: new Date().toISOString() }, // ✅ CORREGIDO: Agregada clave "data:"
        read: false
      })
      .select()

    if (error) {
      console.error('❌ Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ NOTIFICACIÓN CREADA:', data)
    return NextResponse.json({ success: true, data }, { status: 201 })
    
  } catch (err: any) {
    console.error('💥 Excepción:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
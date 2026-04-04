import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/crm'

  if (!token_hash || !type) {
    return NextResponse.redirect(new URL('/auth/login?error=invalid-token', request.url))
  }

  // Crear cliente de Supabase directamente con variables de entorno
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { error } = await supabase.auth.verifyOtp({
    type: type as any,
    token_hash,
  })

  if (!error) {
    return NextResponse.redirect(new URL(next, request.url))
  }

  return NextResponse.redirect(new URL('/auth/login?error=invalid-token', request.url))
}
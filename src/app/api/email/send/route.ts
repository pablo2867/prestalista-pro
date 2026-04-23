import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import WelcomeEmail from '@/emails/WelcomeEmail'

export async function POST(request: NextRequest) {
  try {
    const { type, email, userName } = await request.json()

    if (!email || !userName) {
      return NextResponse.json(
        { error: 'Email y userName son requeridos' },
        { status: 400 }
      )
    }

    // ✅ IMPORTANTE: Instanciar Resend DENTRO de la función (runtime)
    const resend = new Resend(process.env.RESEND_API_KEY)

    let subject = ''
    let react = null

    switch (type) {
      case 'welcome':
        subject = '¡Bienvenido a PrestaLista Pro! 🎉'
        react = WelcomeEmail({ userName })
        break
      case 'day1':
        subject = 'Tu Guía de Inicio Rápido 🚀'
        react = (await import('@/emails/Day1Email')).default({ userName })
        break
      case 'trial-ending':
        subject = 'Tu Prueba Gratis Está por Terminar ⏰'
        react = (await import('@/emails/TrialEndingEmail')).default({ userName, daysLeft: 2 })
        break
      default:
        return NextResponse.json(
          { error: 'Tipo de email no válido' },
          { status: 400 }
        )
    }

    const { data, error } = await resend.emails.send({
      from: 'PrestaLista Pro <onboarding@resend.dev>',
      to: [email],
      subject,
      react,
    })

    if (error) {
      console.error('Error enviando email:', error)
      return NextResponse.json(
        { error: 'Error enviando email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error en API de email:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
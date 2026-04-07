import { Section, Text, Button } from '@react-email/components'
import EmailLayout from './components/EmailLayout'

interface WelcomeEmailProps {
  userName: string
}

export default function WelcomeEmail({ userName }: WelcomeEmailProps) {
  return (
    <EmailLayout title="¡Bienvenido a PrestaLista Pro!">
      <Section>
        <Text style={greeting}>¡Hola {userName}! 👋</Text>
        
        <Text style={paragraph}>
          ¡Gracias por unirte a PrestaLista Pro! Estamos emocionados de ayudarte a 
          transformar tu negocio de préstamos.
        </Text>
        
        <Text style={paragraph}>
          Tu prueba gratis de 14 días ha comenzado. Durante este tiempo tendrás acceso 
          completo a todas las funciones del plan Profesional.
        </Text>
        
        <Text style={subheading}>🚀 Tus Primeros Pasos:</Text>
        
        <Section style={steps}>
          <Text style={step}>1️⃣ <strong>Configura tu perfil</strong> - Agrega tu información de negocio</Text>
          <Text style={step}>2️⃣ <strong>Agrega tu primer lead</strong> - Comienza a gestionar tus contactos</Text>
          <Text style={step}>3️⃣ <strong>Conecta WhatsApp</strong> - Contacta leads directamente</Text>
          <Text style={step}>4️⃣ <strong>Explora el dashboard</strong> - Mira tus métricas en tiempo real</Text>
        </Section>
        
        <Button
          href="https://prestalista-pro.vercel.app/crm/leads"
          style={button}
        >
          Ir a Mi Dashboard →
        </Button>
        
        <Text style={paragraph}>
          ¿Tienes preguntas? Nuestro equipo de soporte está disponible 24/7. 
          Solo responde a este email.
        </Text>
        
        <Text style={signature}>
          El equipo de PrestaLista Pro
        </Text>
      </Section>
    </EmailLayout>
  )
}

const greeting = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#1f2937',
  marginBottom: '20px',
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#374151',
  marginBottom: '16px',
}

const subheading = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#1f2937',
  marginTop: '24px',
  marginBottom: '12px',
}

const steps = {
  backgroundColor: '#f0fdf4',
  padding: '20px',
  borderRadius: '8px',
  marginBottom: '24px',
}

const step = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#374151',
  marginBottom: '8px',
}

const button = {
  backgroundColor: '#16a34a',
  color: '#ffffff',
  padding: '14px 28px',
  borderRadius: '8px',
  textDecoration: 'none',
  display: 'inline-block',
  fontWeight: 'bold',
  fontSize: '16px',
  marginTop: '20px',
  marginBottom: '20px',
}

const signature = {
  fontSize: '16px',
  color: '#6b7280',
  marginTop: '24px',
  fontStyle: 'italic',
}
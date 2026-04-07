import { Section, Text, Button } from '@react-email/components'
import EmailLayout from './components/EmailLayout'

interface TrialEndingEmailProps {
  userName: string
  daysLeft: number
}

export default function TrialEndingEmail({ userName, daysLeft }: TrialEndingEmailProps) {
  return (
    <EmailLayout title="Tu Prueba Gratis Está por Terminar">
      <Section>
        <Text style={greeting}>¡Hola {userName}! ⏰</Text>
        
        <Text style={paragraph}>
          Te recordamos que tu prueba gratis de 14 días terminará en <strong>{daysLeft} días</strong>.
        </Text>
        
        <Section style={alert}>
          <Text style={alertText}>
             ¡No pierdas acceso a tus leads y métricas!
          </Text>
        </Section>
        
        <Text style={subheading}>📊 Lo Que Has Logrado:</Text>
        
        <Section style={stats}>
          <Text style={stat}>✅ Leads gestionados en tu CRM</Text>
          <Text style={stat}>✅ Contactos vía WhatsApp</Text>
          <Text style={stat}>✅ Dashboard de métricas activo</Text>
        </Section>
        
        <Text style={paragraph}>
          Para continuar usando PrestaLista Pro, solo necesitas elegir un plan. 
          Tus datos se mantendrán intactos.
        </Text>
        
        <Button
          href="https://prestalista-pro.vercel.app/#pricing"
          style={button}
        >
          Ver Planes y Precios →
        </Button>
        
        <Text style={offer}>
          💡 <strong>Oferta especial:</strong> Si upgrades hoy, obtén 20% de descuento en tu primer mes.
          Usa el código: <code style={code}>PRIMEROS20</code>
        </Text>
        
        <Text style={paragraph}>
          ¿Tienes dudas sobre qué plan elegir? Responde a este email y te ayudamos.
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

const alert = {
  backgroundColor: '#fef3c7',
  padding: '16px',
  borderRadius: '8px',
  marginBottom: '24px',
  borderLeft: '4px solid #f59e0b',
}

const alertText = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#92400e',
  margin: '0',
}

const subheading = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#1f2937',
  marginTop: '24px',
  marginBottom: '12px',
}

const stats = {
  backgroundColor: '#f0fdf4',
  padding: '20px',
  borderRadius: '8px',
  marginBottom: '24px',
}

const stat = {
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

const offer = {
  backgroundColor: '#dbeafe',
  padding: '16px',
  borderRadius: '8px',
  fontSize: '15px',
  color: '#1e40af',
  marginBottom: '24px',
}

const code = {
  backgroundColor: '#1e40af',
  color: '#ffffff',
  padding: '4px 8px',
  borderRadius: '4px',
  fontFamily: 'monospace',
}

const signature = {
  fontSize: '16px',
  color: '#6b7280',
  marginTop: '24px',
  fontStyle: 'italic',
}
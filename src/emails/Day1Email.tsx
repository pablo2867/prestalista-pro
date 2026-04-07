import { Section, Text, Button } from '@react-email/components'
import EmailLayout from './components/EmailLayout'

interface Day1EmailProps {
  userName: string
}

export default function Day1Email({ userName }: Day1EmailProps) {
  return (
    <EmailLayout title="Tu Guía de Inicio Rápido">
      <Section>
        <Text style={greeting}>¡Hola {userName}! 🚀</Text>
        
        <Text style={paragraph}>
          Esperamos que tu primer día con PrestaLista Pro haya sido excelente. 
          Aquí tienes algunos tips para aprovechar al máximo tu CRM.
        </Text>
        
        <Text style={subheading}>💡 Tips para tu Primera Semana:</Text>
        
        <Section style={tips}>
          <Text style={tip}>
            ✅ <strong>Importa tus leads existentes</strong> - Sube tu lista de contactos desde Excel/CSV
          </Text>
          <Text style={tip}>
            ✅ <strong>Usa las etiquetas</strong> - Clasifica leads por estado (Nuevo, En seguimiento, Aprobado)
          </Text>
          <Text style={tip}>
            ✅ <strong>Programa seguimientos</strong> - No pierdas ninguna oportunidad de venta
          </Text>
          <Text style={tip}>
            ✅ <strong>Revisa el dashboard</strong> - Tus métricas te ayudan a tomar mejores decisiones
          </Text>
        </Section>
        
        <Button
          href="https://prestalista-pro.vercel.app/crm/leads/new"
          style={button}
        >
          Agregar Mi Primer Lead →
        </Button>
        
        <Text style={paragraph}>
          ¿Necesitas ayuda? Tenemos tutoriales en video y documentación completa.
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

const tips = {
  backgroundColor: '#fef3c7',
  padding: '20px',
  borderRadius: '8px',
  marginBottom: '24px',
}

const tip = {
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
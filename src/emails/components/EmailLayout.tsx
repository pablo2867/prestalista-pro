import { Html, Head, Body, Container, Section, Text, Hr } from '@react-email/components'

interface EmailLayoutProps {
  children: React.ReactNode
  title: string
}

export default function EmailLayout({ children, title }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <div style={logo}>🏦</div>
            <Text style={titleText}>{title}</Text>
          </Section>
          
          {/* Content */}
          <Section style={content}>
            {children}
          </Section>
          
          {/* Footer */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} PrestaLista Pro. Todos los derechos reservados.
            </Text>
            <Text style={footerText}>
              ¿Preguntas? Responde a este email o escribe a admin@prestalista.com
            </Text>
            <Text style={footerText}>
              <a href="https://prestalista-pro.vercel.app" style={link}>prestalista-pro.vercel.app</a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f3f4f6',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0',
  maxWidth: '600px',
}

const header = {
  backgroundColor: '#16a34a',
  padding: '30px',
  textAlign: 'center' as const,
  borderRadius: '8px 8px 0 0',
}

const logo = {
  fontSize: '48px',
  marginBottom: '10px',
}

const titleText = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
}

const content = {
  backgroundColor: '#ffffff',
  padding: '30px',
  borderRadius: '0 0 8px 8px',
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '20px 0',
}

const footer = {
  padding: '20px 30px',
  textAlign: 'center' as const,
  color: '#6b7280',
  fontSize: '14px',
}

const footerText = {
  margin: '5px 0',
  color: '#6b7280',
  fontSize: '14px',
}

const link = {
  color: '#16a34a',
  textDecoration: 'underline',
}
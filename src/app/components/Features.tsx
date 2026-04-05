export default function Features() {
  const features = [
    {
      icon: '📊',
      title: 'Dashboard Inteligente',
      description: 'Visualiza todas tus métricas importantes en tiempo real. Sigue el progreso de tus préstamos y leads.'
    },
    {
      icon: '🎯',
      title: 'Gestión de Leads',
      description: 'Organiza, clasifica y da seguimiento a cada lead. Nunca pierdas una oportunidad de venta.'
    },
    {
      icon: '📱',
      title: 'Multi-Plataforma',
      description: 'Accede desde cualquier dispositivo. Web, móvil o tablet. Tu CRM siempre contigo.'
    },
    {
      icon: '🔔',
      title: 'Notificaciones Automáticas',
      description: 'Recibe alertas en tiempo real sobre nuevos leads, pagos y actualizaciones importantes.'
    },
    {
      icon: '📈',
      title: 'Reportes Detallados',
      description: 'Genera reportes personalizados. Analiza tu rendimiento y toma mejores decisiones.'
    },
    {
      icon: '🔒',
      title: 'Seguridad Total',
      description: 'Tus datos protegidos con encriptación de nivel bancario. Cumplimiento GDPR.'
    }
  ]

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Todo lo que necesitas para{' '}
            <span className="text-blue-600">hacer crecer</span> tu negocio
          </h2>
          <p className="text-xl text-gray-600">
            Herramientas poderosas diseñadas específicamente para la gestión de préstamos
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-xl shadow-sm hover:shadow-lg transition-shadow"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
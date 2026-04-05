import Link from 'next/link'

export default function Pricing() {
  const plans = [
    {
      name: 'Básico',
      price: '29',
      description: 'Perfecto para empezar',
      features: [
        'Hasta 100 leads',
        'Dashboard básico',
        'Reportes mensuales',
        'Soporte por email',
        '1 usuario'
      ],
      cta: 'Comenzar Ahora',
      popular: false
    },
    {
      name: 'Profesional',
      price: '79',
      description: 'El más popular',
      features: [
        'Leads ilimitados',
        'Dashboard avanzado',
        'Reportes en tiempo real',
        'Soporte prioritario',
        '5 usuarios',
        'API access',
        'Integraciones'
      ],
      cta: 'Probar Gratis',
      popular: true
    },
    {
      name: 'Empresarial',
      price: '199',
      description: 'Para grandes equipos',
      features: [
        'Todo lo de Profesional',
        'Usuarios ilimitados',
        'Soporte 24/7',
        'Personalización avanzada',
        'SSO & SAML',
        'SLA garantizado',
        'Onboarding dedicado'
      ],
      cta: 'Contactar Ventas',
      popular: false
    }
  ]

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Planes simples y{' '}
            <span className="text-blue-600">transparentes</span>
          </h2>
          <p className="text-xl text-gray-600">
            Elige el plan que mejor se adapte a tus necesidades
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`rounded-2xl p-8 ${
                plan.popular
                  ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-2xl scale-105'
                  : 'bg-gray-50 border-2 border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="inline-block bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-sm font-semibold mb-4">
                  Más Popular
                </div>
              )}
              
              <h3 className={`text-2xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                {plan.name}
              </h3>
              <p className={`mb-6 ${plan.popular ? 'text-blue-100' : 'text-gray-600'}`}>
                {plan.description}
              </p>
              
              <div className="mb-6">
                <span className="text-5xl font-bold">${plan.price}</span>
                <span className={`${plan.popular ? 'text-blue-100' : 'text-gray-600'}`}>/mes</span>
              </div>
              
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center">
                    <span className="text-green-500 mr-3">✓</span>
                    <span className={plan.popular ? 'text-white' : 'text-gray-700'}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              
              <Link
                href="/auth/register"
                className={`block w-full py-3 px-6 text-center font-semibold rounded-lg transition ${
                  plan.popular
                    ? 'bg-white text-purple-700 hover:bg-blue-50'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
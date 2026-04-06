export default function Testimonials() {
  const testimonials = [
    {
      name: 'Carlos Mendoza',
      role: 'CEO, FinanzasExpress',
      image: '👨💼',
      content: 'PrestaLista Pro transformó completamente nuestra forma de gestionar préstamos. Ahora cerramos 3x más ventas.',
      stats: '+300% más ventas'
    },
    {
      name: 'María González',
      role: 'Directora, CréditoFácil',
      image: '👩‍',
      content: 'La mejor inversión que hemos hecho. El seguimiento de leads es increíble y el soporte es excepcional.',
      stats: '+150% conversión'
    },
    {
      name: 'Roberto Sánchez',
      role: 'Fundador, PréstamosYa',
      image: '👨‍🔧',
      content: 'Después de probar 5 CRMs diferentes, PrestaLista Pro es el único que realmente entiende nuestro negocio.',
      stats: '+200% eficiencia'
    }
  ]

  const stats = [
    { number: '2,500+', label: 'Empresas confían en nosotros' },
    { number: '$500M+', label: 'En préstamos gestionados' },
    { number: '98%', label: 'Tasa de satisfacción' },
    { number: '24/7', label: 'Soporte disponible' }
  ]

  return (
    <section className="py-20 bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <p className="text-4xl lg:text-5xl font-bold text-blue-600 mb-2">
                {stat.number}
              </p>
              <p className="text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Lo que dicen nuestros{' '}
            <span className="text-blue-600">clientes</span>
          </h2>
          <p className="text-xl text-gray-600">
            Miles de empresas ya confían en PrestaLista Pro
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center mb-6">
                <div className="text-5xl mr-4">{testimonial.image}</div>
                <div>
                  <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>
              
              <div className="bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-semibold inline-block">
                {testimonial.stats}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-gray-500 mb-8">Empresas que confían en nosotros</p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <div className="text-2xl font-bold text-gray-400">💼 FinanzasExpress</div>
            <div className="text-2xl font-bold text-gray-400">🏦 CréditoFácil</div>
            <div className="text-2xl font-bold text-gray-400">📈 PréstamosYa</div>
            <div className="text-2xl font-bold text-gray-400">💰 MoneyFast</div>
            <div className="text-2xl font-bold text-gray-400">🎯 LoanPro</div>
          </div>
        </div>
      </div>
    </section>
  )
}
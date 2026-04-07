import Link from 'next/link'
import { 
  MessageCircle, 
  Check, 
  ArrowRight, 
  Users, 
  BarChart3, 
  Shield, 
  Zap, 
  Smartphone, 
  Headphones,
  Star,
  ChevronDown
} from 'lucide-react'
import WhatsAppFloating from '@/app/components/whatsapp/WhatsAppFloating'
import TawkToChat from '@/app/components/chatbot/TawkToChat'

export default function HomePage() {
  return (
    <>
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900">PrestaLista Pro</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition">Características</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition">Precios</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition">Testimonios</a>
              <a href="#faq" className="text-gray-600 hover:text-gray-900 transition">FAQ</a>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/auth/login" className="text-gray-600 hover:text-gray-900 font-medium">
                Iniciar Sesión
              </Link>
              <Link 
                href="/auth/register" 
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition"
              >
                Prueba Gratis
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            Nuevo: Integración con WhatsApp Business
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            El CRM Inteligente que
            <span className="text-green-600"> Transforma</span>
            <br />
            Tu Negocio de Préstamos
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Gestiona leads, automatiza WhatsApp y cierra más ventas en menos tiempo. 
            Todo en una plataforma diseñada para casas de préstamo y financieros.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link 
              href="/auth/register" 
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition flex items-center justify-center gap-2"
            >
              🚀 Prueba Gratis 14 Días
              <ArrowRight className="w-5 h-5" />
            </Link>
            <button className="border-2 border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg transition flex items-center justify-center gap-2">
              📹 Ver Demo de 2 Min
            </button>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              Sin tarjeta de crédito
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              Setup en 5 minutos
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              Cancela cuando quieras
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-500 mb-6">Empresas que confían en PrestaLista Pro</p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <div className="text-2xl font-bold text-gray-400">Financiera XYZ</div>
            <div className="text-2xl font-bold text-gray-400">Préstamos Rápidos</div>
            <div className="text-2xl font-bold text-gray-400">Crédito Express</div>
            <div className="text-2xl font-bold text-gray-400">MicroFinanzas Pro</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Todo lo que Necesitas para
              <span className="text-green-600"> Cerrar Más Ventas</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Herramientas poderosas diseñadas específicamente para el sector de préstamos
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 bg-gray-50 rounded-2xl hover:bg-gray-100 transition">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Gestión de Leads</h3>
              <p className="text-gray-600">
                Organiza, filtra y da seguimiento a cada lead. Nunca pierdas una oportunidad de venta.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="p-6 bg-gray-50 rounded-2xl hover:bg-gray-100 transition">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <MessageCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">WhatsApp Integrado</h3>
              <p className="text-gray-600">
                Contacta leads directamente desde el CRM. Mensajes prellenados y formato automático.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="p-6 bg-gray-50 rounded-2xl hover:bg-gray-100 transition">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Analytics en Tiempo Real</h3>
              <p className="text-gray-600">
                Métricas de conversión, rendimiento de agentes y ROI de tus campañas.
              </p>
            </div>
            
            {/* Feature 4 */}
            <div className="p-6 bg-gray-50 rounded-2xl hover:bg-gray-100 transition">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Seguridad Empresarial</h3>
              <p className="text-gray-600">
                Tus datos protegidos con encriptación de grado bancario y políticas de acceso granular.
              </p>
            </div>
            
            {/* Feature 5 */}
            <div className="p-6 bg-gray-50 rounded-2xl hover:bg-gray-100 transition">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <Smartphone className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Mobile First</h3>
              <p className="text-gray-600">
                Trabaja desde cualquier dispositivo. Interfaz optimizada para móvil y tablet.
              </p>
            </div>
            
            {/* Feature 6 */}
            <div className="p-6 bg-gray-50 rounded-2xl hover:bg-gray-100 transition">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <Headphones className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Soporte 24/7</h3>
              <p className="text-gray-600">
                Equipo de soporte especializado en el sector financiero. Respuestas en minutos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Planes Simples y
              <span className="text-green-600"> Transparentes</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Elige el plan perfecto para tu negocio. Todos incluyen 14 días de prueba gratis.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Basic Plan */}
            <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-green-300 transition">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Básico</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">$29</span>
                <span className="text-gray-500">/mes</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-gray-600">
                  <Check className="w-5 h-5 text-green-500" />
                  Hasta 100 leads/mes
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <Check className="w-5 h-5 text-green-500" />
                  WhatsApp integrado
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <Check className="w-5 h-5 text-green-500" />
                  Email automatizado
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <Check className="w-5 h-5 text-green-500" />
                  Soporte por email
                </li>
              </ul>
              <Link 
                href="/auth/register?plan=basic" 
                className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 rounded-xl transition"
              >
                Comenzar Gratis
              </Link>
            </div>
            
            {/* Pro Plan - Featured */}
            <div className="bg-white rounded-2xl p-8 border-2 border-green-500 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                Más Popular
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Profesional</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">$79</span>
                <span className="text-gray-500">/mes</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-gray-600">
                  <Check className="w-5 h-5 text-green-500" />
                  Leads ilimitados
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <Check className="w-5 h-5 text-green-500" />
                  Todo lo del plan Básico
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <Check className="w-5 h-5 text-green-500" />
                  Analytics avanzado
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <Check className="w-5 h-5 text-green-500" />
                  Soporte prioritario 24/7
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <Check className="w-5 h-5 text-green-500" />
                  API access
                </li>
              </ul>
              <Link 
                href="/auth/register?plan=pro" 
                className="block w-full text-center bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition"
              >
                Comenzar Gratis
              </Link>
            </div>
            
            {/* Enterprise Plan */}
            <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-green-300 transition">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Empresarial</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">$199</span>
                <span className="text-gray-500">/mes</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-gray-600">
                  <Check className="w-5 h-5 text-green-500" />
                  Todo lo del plan Profesional
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <Check className="w-5 h-5 text-green-500" />
                  Múltiples usuarios
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <Check className="w-5 h-5 text-green-500" />
                  Personalización de marca
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <Check className="w-5 h-5 text-green-500" />
                  SLA garantizado 99.9%
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <Check className="w-5 h-5 text-green-500" />
                  Manager de cuenta dedicado
                </li>
              </ul>
              <Link 
                href="/auth/register?plan=enterprise" 
                className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 rounded-xl transition"
              >
                Contactar Ventas
              </Link>
            </div>
          </div>
          
          <p className="text-center text-gray-500 mt-8">
            ¿No estás seguro? <Link href="/auth/register" className="text-green-600 hover:underline">Prueba gratis 14 días</Link> sin compromiso.
          </p>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Lo que Dicen Nuestros
              <span className="text-green-600"> Clientes</span>
            </h2>
            <div className="flex justify-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <p className="text-xl text-gray-600">4.9/5 basado en 127 reseñas</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-6">
                "PrestaLista Pro transformó mi negocio. Cerré 3x más préstamos en el primer mes. 
                La integración con WhatsApp es increíble."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-700 font-semibold">CM</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Carlos M.</p>
                  <p className="text-sm text-gray-500">Director Financiero</p>
                </div>
              </div>
            </div>
            
            {/* Testimonial 2 */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-6">
                "El soporte es excepcional. Cada vez que tengo una duda, me responden en minutos. 
                Vale cada peso invertido."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-700 font-semibold">AR</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Ana R.</p>
                  <p className="text-sm text-gray-500">Dueña de Microfinanciera</p>
                </div>
              </div>
            </div>
            
            {/* Testimonial 3 */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-6">
                "La interfaz es intuitiva y mi equipo la adoptó en un día. Los analytics me ayudan 
                a tomar mejores decisiones de negocio."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-700 font-semibold">JL</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Jorge L.</p>
                  <p className="text-sm text-gray-500">CEO, Crédito Express</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Preguntas
              <span className="text-green-600"> Frecuentes</span>
            </h2>
          </div>
          
          <div className="space-y-4">
            {/* FAQ 1 */}
            <details className="bg-white rounded-xl p-6 group">
              <summary className="font-semibold text-gray-900 cursor-pointer flex justify-between items-center">
                ¿Necesito tarjeta de crédito para la prueba gratis?
                <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition" />
              </summary>
              <p className="text-gray-600 mt-4">
                No, puedes probar PrestaLista Pro gratis durante 14 días sin proporcionar tarjeta de crédito. 
                Sin compromisos, cancela cuando quieras.
              </p>
            </details>
            
            {/* FAQ 2 */}
            <details className="bg-white rounded-xl p-6 group">
              <summary className="font-semibold text-gray-900 cursor-pointer flex justify-between items-center">
                ¿Puedo migrar mis datos desde otro CRM?
                <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition" />
              </summary>
              <p className="text-gray-600 mt-4">
                Sí, ofrecemos migración gratuita de datos desde la mayoría de CRMs populares. 
                Nuestro equipo te guiará paso a paso en el proceso.
              </p>
            </details>
            
            {/* FAQ 3 */}
            <details className="bg-white rounded-xl p-6 group">
              <summary className="font-semibold text-gray-900 cursor-pointer flex justify-between items-center">
                ¿El plan incluye integración con WhatsApp?
                <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition" />
              </summary>
              <p className="text-gray-600 mt-4">
                Sí, todos los planes incluyen integración nativa con WhatsApp. 
                Contacta leads directamente desde el CRM con mensajes prellenados.
              </p>
            </details>
            
            {/* FAQ 4 */}
            <details className="bg-white rounded-xl p-6 group">
              <summary className="font-semibold text-gray-900 cursor-pointer flex justify-between items-center">
                ¿Ofrecen soporte en español?
                <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition" />
              </summary>
              <p className="text-gray-600 mt-4">
                Sí, nuestro equipo de soporte habla español y está disponible 24/7 
                para ayudarte con cualquier pregunta o problema técnico.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-green-600 to-emerald-700">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            ¿Listo para Transformar tu Negocio de Préstamos?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Únete a +500 negocios que ya están cerrando más ventas con PrestaLista Pro.
          </p>
          <Link 
            href="/auth/register" 
            className="inline-flex items-center gap-2 bg-white text-green-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition"
          >
            🎁 Comenzar Prueba Gratis - 14 Días
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-green-100 mt-4 text-sm">
            Sin tarjeta de crédito • Setup en 5 minutos • Cancela cuando quieras
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl text-white">PrestaLista Pro</span>
              </div>
              <p className="text-sm">
                El CRM inteligente para casas de préstamo y negocios financieros en México.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Producto</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition">Características</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Precios</a></li>
                <li><a href="#" className="hover:text-white transition">Integraciones</a></li>
                <li><a href="#" className="hover:text-white transition">Changelog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Sobre Nosotros</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Carreras</a></li>
                <li><a href="#" className="hover:text-white transition">Contacto</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Términos de Servicio</a></li>
                <li><a href="#" className="hover:text-white transition">Política de Privacidad</a></li>
                <li><a href="#" className="hover:text-white transition">Cookies</a></li>
                <li><a href="#" className="hover:text-white transition">GDPR</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>© {new Date().getFullYear()} PrestaLista Pro. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Componentes Flotantes */}
      <WhatsAppFloating />
      <TawkToChat />
    </>
  )
}
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-white text-xl font-bold mb-4">PrestaLista Pro</h3>
            <p className="text-gray-400">
              La plataforma líder en gestión de préstamos y seguimiento de leads.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Producto</h4>
            <ul className="space-y-2">
              <li><Link href="#features" className="hover:text-white transition">Características</Link></li>
              <li><Link href="#pricing" className="hover:text-white transition">Precios</Link></li>
              <li><Link href="#" className="hover:text-white transition">Integraciones</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Empresa</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="hover:text-white transition">Sobre Nosotros</Link></li>
              <li><Link href="#" className="hover:text-white transition">Blog</Link></li>
              <li><Link href="#" className="hover:text-white transition">Contacto</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="hover:text-white transition">Privacidad</Link></li>
              <li><Link href="#" className="hover:text-white transition">Términos</Link></li>
              <li><Link href="#" className="hover:text-white transition">Cookies</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
          <p>© 2026 PrestaLista Pro. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
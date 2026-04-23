// Página de inicio - redirecciona a CRM

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">PrestaLista Pro</h1>
        <p className="text-gray-400 mb-6">Sistema de Gestión de Préstamos</p>
        <a 
          href="/crm/capital" 
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition"
        >
          Ir a Gestión de Capital
        </a>
      </div>
    </div>
  )
}
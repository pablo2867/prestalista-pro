'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../lib/AuthContext'
import ProtectedRoute from '../lib/ProtectedRoute'

export default function ReportesPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)

  // ✅ Simulación de datos para la vista (luego se conectará a Supabase)
  const stats = {
    totalIngresos: 0,
    totalEgresos: 0,
    saldo: 0
  }

  useEffect(() => {
    // Aquí irá la carga de datos reales de Supabase en el futuro
    setLoading(false)
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0b0f19', color: 'white' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
        <div>Cargando reportes...</div>
      </div>
    </div>
  )

  return (
    <ProtectedRoute>
      <div style={{ minHeight: '100vh', backgroundColor: '#0b0f19', color: 'white', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '32px' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold' }}>📊 Reportes Generales</h1>
          <Link 
            href="/capital" 
            style={{ padding: '10px 24px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: '600' }}
          >
            ← Volver al Panel
          </Link>
        </div>

        {/* TARJETAS DE ESTADÍSTICAS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '40px' }}>
          
          {/* Ingresos */}
          <div style={{ background: 'linear-gradient(135deg, #064e3b, #065f46)', padding: '24px', borderRadius: '16px', border: '1px solid #10b981' }}>
            <div style={{ color: '#d1fae5', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Total Ingresos</div>
            <div style={{ fontSize: '40px', fontWeight: 'bold', color: '#34d399' }}>${stats.totalIngresos.toLocaleString('es-MX')}</div>
          </div>

          {/* Egresos */}
          <div style={{ background: 'linear-gradient(135deg, #7f1d1d, #991b1b)', padding: '24px', borderRadius: '16px', border: '1px solid #ef4444' }}>
            <div style={{ color: '#fee2e2', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Total Egresos</div>
            <div style={{ fontSize: '40px', fontWeight: 'bold', color: '#f87171' }}>${stats.totalEgresos.toLocaleString('es-MX')}</div>
          </div>

          {/* Saldo */}
          <div style={{ background: 'linear-gradient(135deg, #1e3a8a, #1e40af)', padding: '24px', borderRadius: '16px', border: '1px solid '#3b82f6' }}>
            <div style={{ color: '#dbeafe', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Saldo Neto</div>
            <div style={{ fontSize: '40px', fontWeight: 'bold', color: '#60a5fa' }}>${stats.saldo.toLocaleString('es-MX')}</div>
          </div>
        </div>

        {/* ÁREA DE CONTENIDO */}
        <div style={{ backgroundColor: '#111827', borderRadius: '16px', border: '1px solid #1f2937', padding: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px' }}>Detalle de Operaciones</h2>
          
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}></div>
            <h3 style={{ fontSize: '20px', color: '#9ca3af', marginBottom: '12px' }}>Esperando conexión de datos</h3>
            <p style={{ maxWidth: '500px', margin: '0 auto' }}>
              Esta sección se llenará automáticamente cuando conectemos los reportes a la base de datos. 
              Por ahora, usa el módulo de <strong>Capital</strong> para ver tu historial reciente.
            </p>
            <Link 
              href="/capital" 
              style={{ marginTop: '24px', display: 'inline-block', padding: '12px 32px', backgroundColor: '#10b981', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: '600' }}
            >
              Ir a Gestión de Capital
            </Link>
          </div>
        </div>

      </div>
    </ProtectedRoute>
  )
}
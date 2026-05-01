'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabaseClient'
import ProtectedRoute from '../lib/ProtectedRoute'

export default function ReportesPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalIngresos: 0,
    totalEgresos: 0,
    saldo: 0
  })

  useEffect(() => {
    const cargarDatos = async () => {
      if (!user?.id) return

      try {
        const { data, error } = await supabase
          .from('transacciones_capital')
          .select('tipo, monto')
          .eq('user_id', user.id)

        if (error) throw error

        const ingresos = data?.filter(t => t.tipo === 'Ingreso').reduce((sum, t) => sum + (t.monto || 0), 0) || 0
        const egresos = data?.filter(t => t.tipo === 'Egreso').reduce((sum, t) => sum + (t.monto || 0), 0) || 0

        setStats({
          totalIngresos: ingresos,
          totalEgresos: egresos,
          saldo: ingresos - egresos
        })
      } catch (err) {
        console.error('❌ Error cargando reportes:', err)
      } finally {
        setLoading(false)
      }
    }

    cargarDatos()
  }, [user?.id])

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
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold' }}>📊 Reportes Generales</h1>
          <Link 
            href="/capital" 
            style={{ padding: '10px 24px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: '600' }}
          >
            ← Volver al Panel
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '40px' }}>
          
          <div style={{ background: 'linear-gradient(135deg, #064e3b, #065f46)', padding: '24px', borderRadius: '16px', border: '1px solid #10b981' }}>
            <div style={{ color: '#d1fae5', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Total Ingresos</div>
            <div style={{ fontSize: '40px', fontWeight: 'bold', color: '#34d399' }}>${stats.totalIngresos.toLocaleString('es-MX')}</div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #7f1d1d, #991b1b)', padding: '24px', borderRadius: '16px', border: '1px solid #ef4444' }}>
            <div style={{ color: '#fee2e2', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Total Egresos</div>
            <div style={{ fontSize: '40px', fontWeight: 'bold', color: '#f87171' }}>${stats.totalEgresos.toLocaleString('es-MX')}</div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #1e3a8a, #1e40af)', padding: '24px', borderRadius: '16px', border: '1px solid #3b82f6' }}>
            <div style={{ color: '#dbeafe', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Saldo Neto</div>
            <div style={{ fontSize: '40px', fontWeight: 'bold', color: '#60a5fa' }}>${stats.saldo.toLocaleString('es-MX')}</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#111827', borderRadius: '16px', border: '1px solid #1f2937', padding: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px' }}>Detalle de Operaciones</h2>
          
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>📊</div>
            <h3 style={{ fontSize: '20px', color: '#9ca3af', marginBottom: '12px' }}>Datos conectados a Supabase</h3>
            <p style={{ maxWidth: '500px', margin: '0 auto' }}>
              Los reportes ahora muestran información real de tu base de datos. 
              Todas las transacciones registradas en <strong>Capital</strong> se reflejan aquí automáticamente.
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
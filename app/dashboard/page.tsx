// app/dashboard/page.tsx
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useGlobalContext } from '../lib/GlobalContext'

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // 🔗 Obtener señal de actualización para sync en tiempo real
  const { prestamosActualizados } = useGlobalContext()

  useEffect(() => {
    setLoading(true)
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => {
        setMetrics(d.metrics)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [prestamosActualizados])

  // 📥 Función corregida: Exporta datos limpios para Excel (sin $ ni comas, separador ;)
  const exportarDashboard = () => {
    if (!metrics) return
    
    const BOM = '\uFEFF' // Para que Excel reconozca tildes y ñ
    let csvContent = BOM

    // Helper para crear cada sección limpia
    const addSection = (title: string, data: [string, string][]) => {
      csvContent += `\n\n${title}\nConcepto;Valor\n`
      data.forEach(([concepto, valor]) => {
        csvContent += `${concepto};${valor}\n`
      })
    }

    // === CAPITAL ===
    addSection('CAPITAL', [
      ['Saldo Actual', metrics.capital.saldoActual.toFixed(2)],
      ['Total Ingresos', metrics.capital.totalIngresos.toFixed(2)],
      ['Total Egresos', metrics.capital.totalEgresos.toFixed(2)],
      ['Distribuidores', metrics.distributors.total.toString()]
    ])

    // === CLIENTES ===
    const tasaMorosidad = metrics.clientes.total > 0 
      ? ((metrics.clientes.morosos / metrics.clientes.total) * 100).toFixed(1) 
      : '0'
    addSection('CLIENTES', [
      ['Total Clientes', metrics.clientes.total.toString()],
      ['Activos', metrics.clientes.activos.toString()],
      ['Morosos', metrics.clientes.morosos.toString()],
      ['Tasa Morosidad', `${tasaMorosidad}%`]
    ])

    // === PRÉSTAMOS ===
    addSection('PRÉSTAMOS', [
      ['Total Préstamos', metrics.prestamos.total.toString()],
      ['Préstamos Activos', metrics.prestamos.activos.toString()],
      ['Total Prestado', metrics.prestamos.totalPrestado.toFixed(2)],
      ['Por Cobrar', metrics.prestamos.totalPorCobrar.toFixed(2)]
    ])

    // === LEADS ===
    addSection('LEADS', [
      ['Total Leads', metrics.leads.total.toString()],
      ['Leads Nuevos', metrics.leads.nuevos.toString()],
      ['Leads Convertidos', metrics.leads.convertidos.toString()],
      ['Monto Potencial', metrics.leads.montoPotencial.toFixed(2)]
    ])

    // === RESUMEN EJECUTIVO ===
    const tasaConversion = metrics.leads.total > 0 
      ? ((metrics.leads.convertidos / metrics.leads.total) * 100).toFixed(1) 
      : '0'
    const ticketPromedio = metrics.prestamos.total > 0 
      ? (metrics.prestamos.totalPrestado / metrics.prestamos.total).toFixed(2) 
      : '0'
    const carteraTotal = (metrics.capital.saldoActual + metrics.prestamos.totalPorCobrar).toFixed(2)
    const roi = metrics.prestamos.totalPrestado > 0 
      ? ((metrics.prestamos.totalPorCobrar / metrics.prestamos.totalPrestado - 1) * 100).toFixed(1) 
      : '0'

    addSection('RESUMEN EJECUTIVO', [
      ['Tasa Conversión', `${tasaConversion}%`],
      ['Ticket Promedio', ticketPromedio],
      ['Cartera Total', carteraTotal],
      ['ROI Potencial', `${roi}%`]
    ])

    // Generar y descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `dashboard_prestalista_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const s = {
    page: { display: 'flex', minHeight: '100vh', backgroundColor: '#0b0f19', fontFamily: 'system-ui, sans-serif', color: 'white' },
    sidebar: { width: '260px', backgroundColor: '#111827', borderRight: '1px solid #1f2937', position: 'fixed' as const, height: '100vh', zIndex: 10 },
    main: { marginLeft: '260px', flex: 1, padding: '24px' },
    section: { backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '28px', marginBottom: '24px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' },
    stat: { backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '24px' }
  }

  if(loading) return <div style={{...s.page,justifyContent:'center',alignItems:'center',fontSize:'20px'}}>⏳ Cargando dashboard...</div>

  return (
    <div style={s.page}>
      {/* 🖨️ Estilos para impresión */}
      <style>
        {`@media print {
          aside, .no-print { display: none !important; }
          main { margin-left: 0 !important; padding: 20px !important; }
          body { background: white !important; color: black !important; }
          * { color: black !important; background: white !important; }
          div[style*="backgroundColor"] { background: white !important; }
          h1, h2 { color: black !important; }
        }`}
      </style>

      <aside style={s.sidebar}>
        <div style={{ padding: '20px', borderBottom: '1px solid #1f2937' }}><div style={{ fontWeight: 'bold', fontSize: '16px' }}>PrestaLista Pro</div></div>
        <nav style={{ padding: '16px 12px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', borderRadius: '8px', marginBottom: '4px', fontWeight: '600', border: '1px solid rgba(59, 130, 246, 0.3)', textDecoration: 'none' }}>📊 Dashboard</Link>
          <Link href="/capital" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}>💰 Capital</Link>
          <Link href="/leads" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}>🎯 Mis Leads</Link>
          <Link href="/distribuidores" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}>🤝 Distribuidores</Link>
          <Link href="/prestatarios" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}>👤 Prestatarios</Link>
          <Link href="/prestamos" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', color: '#9ca3af', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none' }}>📄 Préstamos</Link>
        </nav>
      </aside>

      <main style={s.main}>
        {/* Header con botones de Imprimir y Exportar */}
        <div style={{ background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 20px rgba(37, 99, 235, 0.25)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '6px' }}>Dashboard General</h1>
              <p style={{ color: '#e0e7ff', fontSize: '14px' }}>Vista ejecutiva de tu negocio de préstamos</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }} className="no-print">
              <button onClick={() => window.print()} style={{ padding: '10px 20px', backgroundColor: '#1e40af', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>🖨️ Imprimir</button>
              <button onClick={exportarDashboard} style={{ padding: '10px 20px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>📥 Exportar Excel</button>
            </div>
          </div>
        </div>

        <div style={s.section}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#60a5fa' }}>💰 Capital</h2>
          <div style={s.grid}>
            <div style={s.stat}><div style={{fontSize:'13px',color:'#9ca3af',marginBottom:'8px'}}>Saldo Actual</div><div style={{fontSize:'32px',fontWeight:'bold',color:'#34d399'}}>${metrics?.capital.saldoActual.toLocaleString()}</div></div>
            <div style={s.stat}><div style={{fontSize:'13px',color:'#9ca3af',marginBottom:'8px'}}>Total Ingresos</div><div style={{fontSize:'28px',fontWeight:'bold',color:'#60a5fa'}}>${metrics?.capital.totalIngresos.toLocaleString()}</div></div>
            <div style={s.stat}><div style={{fontSize:'13px',color:'#9ca3af',marginBottom:'8px'}}>Total Egresos</div><div style={{fontSize:'28px',fontWeight:'bold',color:'#ef4444'}}>${metrics?.capital.totalEgresos.toLocaleString()}</div></div>
            <div style={s.stat}><div style={{fontSize:'13px',color:'#9ca3af',marginBottom:'8px'}}>Distribuidores</div><div style={{fontSize:'28px',fontWeight:'bold',color:'#fbbf24'}}>{metrics?.distributors.total}</div></div>
          </div>
        </div>

        <div style={s.section}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#34d399' }}>👥 Clientes</h2>
          <div style={s.grid}>
            <div style={s.stat}><div style={{fontSize:'13px',color:'#9ca3af',marginBottom:'8px'}}>Total Clientes</div><div style={{fontSize:'32px',fontWeight:'bold',color:'#60a5fa'}}>{metrics?.clientes.total}</div></div>
            <div style={s.stat}><div style={{fontSize:'13px',color:'#9ca3af',marginBottom:'8px'}}>Activos</div><div style={{fontSize:'28px',fontWeight:'bold',color:'#34d399'}}>{metrics?.clientes.activos}</div></div>
            <div style={s.stat}><div style={{fontSize:'13px',color:'#9ca3af',marginBottom:'8px'}}>Morosos</div><div style={{fontSize:'28px',fontWeight:'bold',color:'#f87171'}}>{metrics?.clientes.morosos}</div></div>
            <div style={s.stat}><div style={{fontSize:'13px',color:'#9ca3af',marginBottom:'8px'}}>Tasa Morosidad</div><div style={{fontSize:'28px',fontWeight:'bold',color:'#fbbf24'}}>{metrics?.clientes.total>0?((metrics.clientes.morosos/metrics.clientes.total)*100).toFixed(1):0}%</div></div>
          </div>
        </div>

        <div style={s.section}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#fbbf24' }}>📄 Préstamos</h2>
          <div style={s.grid}>
            <div style={s.stat}><div style={{fontSize:'13px',color:'#9ca3af',marginBottom:'8px'}}>Total Préstamos</div><div style={{fontSize:'32px',fontWeight:'bold',color:'#60a5fa'}}>{metrics?.prestamos.total}</div></div>
            <div style={s.stat}><div style={{fontSize:'13px',color:'#9ca3af',marginBottom:'8px'}}>Activos</div><div style={{fontSize:'28px',fontWeight:'bold',color:'#34d399'}}>{metrics?.prestamos.activos}</div></div>
            <div style={s.stat}><div style={{fontSize:'13px',color:'#9ca3af',marginBottom:'8px'}}>Total Prestado</div><div style={{fontSize:'28px',fontWeight:'bold',color:'#fbbf24'}}>${metrics?.prestamos.totalPrestado.toLocaleString()}</div></div>
            <div style={s.stat}><div style={{fontSize:'13px',color:'#9ca3af',marginBottom:'8px'}}>Por Cobrar</div><div style={{fontSize:'28px',fontWeight:'bold',color:'#f87171'}}>${metrics?.prestamos.totalPorCobrar.toLocaleString()}</div></div>
          </div>
        </div>

        <div style={s.section}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#a78bfa' }}>🎯 Leads</h2>
          <div style={s.grid}>
            <div style={s.stat}><div style={{fontSize:'13px',color:'#9ca3af',marginBottom:'8px'}}>Total Leads</div><div style={{fontSize:'32px',fontWeight:'bold',color:'#60a5fa'}}>{metrics?.leads.total}</div></div>
            <div style={s.stat}><div style={{fontSize:'13px',color:'#9ca3af',marginBottom:'8px'}}>Nuevos</div><div style={{fontSize:'28px',fontWeight:'bold',color:'#fbbf24'}}>{metrics?.leads.nuevos}</div></div>
            <div style={s.stat}><div style={{fontSize:'13px',color:'#9ca3af',marginBottom:'8px'}}>Convertidos</div><div style={{fontSize:'28px',fontWeight:'bold',color:'#34d399'}}>{metrics?.leads.convertidos}</div></div>
            <div style={s.stat}><div style={{fontSize:'13px',color:'#9ca3af',marginBottom:'8px'}}>Monto Potencial</div><div style={{fontSize:'28px',fontWeight:'bold',color:'#f87171'}}>${metrics?.leads.montoPotencial.toLocaleString()}</div></div>
          </div>
        </div>

        <div style={s.section}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#f87171' }}>📊 Resumen Ejecutivo</h2>
          <div style={s.grid}>
            <div style={s.stat}><div style={{fontSize:'13px',color:'#9ca3af',marginBottom:'8px'}}>Tasa Conversión</div><div style={{fontSize:'28px',fontWeight:'bold',color:'#34d399'}}>{metrics?.leads.total>0?((metrics.leads.convertidos/metrics.leads.total)*100).toFixed(1):0}%</div></div>
            <div style={s.stat}><div style={{fontSize:'13px',color:'#9ca3af',marginBottom:'8px'}}>Ticket Promedio</div><div style={{fontSize:'28px',fontWeight:'bold',color:'#fbbf24'}}>${metrics?.prestamos.total>0?Math.round(metrics.prestamos.totalPrestado/metrics.prestamos.total).toLocaleString():0}</div></div>
            <div style={s.stat}><div style={{fontSize:'13px',color:'#9ca3af',marginBottom:'8px'}}>Cartera Total</div><div style={{fontSize:'28px',fontWeight:'bold',color:'#60a5fa'}}>${(metrics?.capital.saldoActual+metrics?.prestamos.totalPorCobrar).toLocaleString()}</div></div>
            <div style={s.stat}><div style={{fontSize:'13px',color:'#9ca3af',marginBottom:'8px'}}>ROI Potencial</div><div style={{fontSize:'28px',fontWeight:'bold',color:'#34d399'}}>{((metrics?.prestamos.totalPorCobrar/metrics?.prestamos.totalPrestado-1)*100||0).toFixed(1)}%</div></div>
          </div>
        </div>
      </main>
    </div>
  )
}
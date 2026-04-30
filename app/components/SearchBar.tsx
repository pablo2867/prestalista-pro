// app/components/SearchBar.tsx - VERSIÓN PRODUCCIÓN CON POSICIONAMIENTO CORREGIDO
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length >= 2) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 [SearchBar] Buscando:', query)
        }
        
        setLoading(true)
        setShowDropdown(true)
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
          const data = await res.json()
          if (data.success) {
            setResults(data.results)
          }
        } catch (err: any) {
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ [SearchBar] Error:', err)
          }
          setResults({ error: err.message })
        } finally {
          setLoading(false)
        }
      } else {
        setShowDropdown(false)
        setResults(null)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // ✅ Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ✅ Navegar al módulo seleccionado
  const handleResultClick = (type: string) => {
    setShowDropdown(false)
    setQuery('')
    
    const routes: Record<string, string> = {
      prestamos: '/prestamos',
      prestatarios: '/prestatarios', 
      leads: '/leads',
      pagos: '/movimientos'
    }
    
    if (routes[type]) {
      router.push(routes[type])
    }
  }

  // 🎨 Estilos corregidos para posicionamiento estable
  const s = {
    container: { 
      position: 'relative' as const, 
      width: '100%', 
      maxWidth: '400px',
      zIndex: 1000 // ✅ Z-index moderado para no interferir con otros elementos
    },
    input: {
      width: '100%',
      padding: '10px 16px',
      backgroundColor: '#1f2937',
      border: '1px solid #374151', // ✅ Borde más sutil
      borderRadius: '8px',
      color: 'white',
      fontSize: '14px',
      outline: 'none',
      transition: 'border-color 0.2s'
    },
    dropdown: {
      position: 'absolute' as const,
      top: 'calc(100% + 8px)', // ✅ Espacio claro entre input y dropdown
      left: 0,
      right: 0,
      backgroundColor: '#111827',
      border: '1px solid #374151',
      borderRadius: '12px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.5)', // ✅ Sombra más suave
      zIndex: 1001, // ✅ Justo por encima del contenedor
      maxHeight: '400px', // ✅ Altura máxima razonable
      overflow: 'auto',
      backdropFilter: 'blur(8px)' // ✅ Efecto moderno
    },
    item: {
      padding: '12px 16px',
      backgroundColor: 'transparent',
      borderBottom: '1px solid #1f2937',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      color: 'white',
      transition: 'background-color 0.15s'
    },
    sectionTitle: {
      padding: '8px 16px',
      fontSize: '11px',
      color: '#6b7280',
      fontWeight: '600',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em'
    },
    noResults: {
      padding: '16px',
      color: '#6b7280',
      textAlign: 'center' as const,
      fontSize: '14px'
    }
  }

  // ✅ Renderizado condicional de resultados
  const renderResults = () => {
    if (loading) {
      return <div style={{ padding: '16px', color: '#9ca3af', textAlign: 'center' }}>⏳ Buscando...</div>
    }
    
    if (!results) {
      return <div style={s.noResults}>Escribe para buscar clientes, préstamos o movimientos...</div>
    }

    const hasResults = results.prestatarios?.length || results.prestamos?.length || results.leads?.length || results.pagos?.length

    if (!hasResults) {
      return <div style={s.noResults}>📋 No se encontraron resultados para "{query}"</div>
    }

    return (
      <>
        {/* 👤 Clientes */}
        {results.prestatarios?.length > 0 && (
          <>
            <div style={s.sectionTitle}>Clientes ({results.prestatarios.length})</div>
            {results.prestatarios.map((p: any) => (
              <div
                key={p.id}
                style={s.item}
                onClick={() => handleResultClick('prestatarios')}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1f2937'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <span>👤</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.nombre} {p.apellido}
                  </div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>{p.telefono || 'Sin teléfono'}</div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* 📄 Préstamos */}
        {results.prestamos?.length > 0 && (
          <>
            <div style={s.sectionTitle}>Préstamos ({results.prestamos.length})</div>
            {results.prestamos.map((p: any) => (
              <div
                key={p.id}
                style={s.item}
                onClick={() => handleResultClick('prestamos')}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1f2937'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <span>📄</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.prestatario?.nombre} {p.prestatario?.apellido}
                  </div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>${Number(p.monto_principal || 0).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* 🎯 Leads */}
        {results.leads?.length > 0 && (
          <>
            <div style={s.sectionTitle}>Leads ({results.leads.length})</div>
            {results.leads.map((l: any) => (
              <div
                key={l.id}
                style={s.item}
                onClick={() => handleResultClick('leads')}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1f2937'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <span>🎯</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {l.nombre} {l.apellido}
                  </div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>{l.origen || 'Sin origen'}</div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* 💵 Pagos */}
        {results.pagos?.length > 0 && (
          <>
            <div style={s.sectionTitle}>Pagos ({results.pagos.length})</div>
            {results.pagos.map((p: any) => (
              <div
                key={p.id}
                style={s.item}
                onClick={() => handleResultClick('pagos')}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1f2937'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <span>💵</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '600' }}>${Number(p.monto || 0).toLocaleString()}</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>{new Date(p.fecha_pago).toLocaleDateString('es-MX')}</div>
                </div>
              </div>
            ))}
          </>
        )}
      </>
    )
  }

  return (
    <div ref={containerRef} style={s.container}>
      <input
        type="text"
        placeholder="🔍 Buscar cliente, préstamo o movimiento..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (query.length >= 2) setShowDropdown(true)
        }}
        style={s.input}
      />

      {showDropdown && query.length >= 2 && (
        <div style={s.dropdown}>
          {renderResults()}
        </div>
      )}
    </div>
  )
}
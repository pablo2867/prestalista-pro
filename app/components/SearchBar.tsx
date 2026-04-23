// app/components/SearchBar.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any>(null)
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length >= 2) {
        setLoading(true)
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
          const data = await res.json()
          if (data.success) {
            setResults(data.results)
            setShowResults(true)
          }
        } catch (err) {
          console.error('Search error:', err)
        } finally {
          setLoading(false)
        }
      } else {
        setShowResults(false)
        setResults(null)
      }
    }, 300) // Debounce de 300ms

    return () => clearTimeout(timer)
  }, [query])

  // Cerrar resultados al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleResultClick = (type: string, item: any) => {
    setShowResults(false)
    setQuery('')
    
    // Redirigir según el tipo de resultado
    switch (type) {
      case 'prestamos':
        router.push(`/prestamos`)
        break
      case 'prestatarios':
        router.push(`/prestatarios`)
        break
      case 'leads':
        router.push(`/leads`)
        break
      case 'pagos':
        router.push(`/movimientos`)
        break
    }
  }

  const s = {
    container: { position: 'relative' as const, width: '100%', maxWidth: '400px' },
    input: {
      width: '100%',
      padding: '10px 16px',
      backgroundColor: 'rgba(255,255,255,0.1)',
      border: '1px solid rgba(255,255,255,0.2)',
      borderRadius: '8px',
      color: 'white',
      fontSize: '14px',
      outline: 'none',
      transition: 'all 0.2s'
    },
    dropdown: {
      position: 'absolute' as const,
      top: '100%',
      left: 0,
      right: 0,
      marginTop: '8px',
      backgroundColor: '#111827',
      border: '1px solid #1f2937',
      borderRadius: '12px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
      zIndex: 1000,
      maxHeight: '400px',
      overflow: 'auto'
    },
    section: { padding: '12px' },
    sectionTitle: { fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' as const, fontWeight: '600', marginBottom: '8px', paddingLeft: '8px' },
    item: {
      padding: '10px 12px',
      backgroundColor: 'transparent',
      borderRadius: '6px',
      cursor: 'pointer',
      marginBottom: '4px',
      transition: 'background-color 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    itemHover: { backgroundColor: '#1f2937' }
  }

  if (!results) return null

  return (
    <div ref={searchRef} style={s.container}>
      <input
        type="text"
        placeholder="🔍 Buscar cliente, préstamo, pago..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.length >= 2 && setShowResults(true)}
        style={s.input}
      />

      {showResults && results && (
        <div style={s.dropdown}>
          {loading && (
            <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>
              ⏳ Buscando...
            </div>
          )}

          {!loading && (
            <>
              {results.prestamos.length > 0 && (
                <div>
                  <div style={s.sectionTitle}>📄 Préstamos ({results.prestamos.length})</div>
                  {results.prestamos.map((p: any) => (
                    <div
                      key={p.id}
                      style={s.item}
                      onClick={() => handleResultClick('prestamos', p)}
                      onMouseEnter={(e) => Object.assign(e.currentTarget.style, s.itemHover)}
                      onMouseLeave={(e) => Object.assign(e.currentTarget.style, { backgroundColor: 'transparent' })}
                    >
                      <span>📄</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>
                          {p.prestatario?.nombre} {p.prestatario?.apellido}
                        </div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                          ${Number(p.monto_principal).toLocaleString()} • {p.estado}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.prestatarios.length > 0 && (
                <div>
                  <div style={s.sectionTitle}>👤 Clientes ({results.prestatarios.length})</div>
                  {results.prestatarios.map((p: any) => (
                    <div
                      key={p.id}
                      style={s.item}
                      onClick={() => handleResultClick('prestatarios', p)}
                      onMouseEnter={(e) => Object.assign(e.currentTarget.style, s.itemHover)}
                      onMouseLeave={(e) => Object.assign(e.currentTarget.style, { backgroundColor: 'transparent' })}
                    >
                      <span>👤</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>{p.nombre} {p.apellido}</div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>{p.telefono}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.leads.length > 0 && (
                <div>
                  <div style={s.sectionTitle}>🎯 Leads ({results.leads.length})</div>
                  {results.leads.map((l: any) => (
                    <div
                      key={l.id}
                      style={s.item}
                      onClick={() => handleResultClick('leads', l)}
                      onMouseEnter={(e) => Object.assign(e.currentTarget.style, s.itemHover)}
                      onMouseLeave={(e) => Object.assign(e.currentTarget.style, { backgroundColor: 'transparent' })}
                    >
                      <span>🎯</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>{l.nombre} {l.apellido}</div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>{l.origen} • {l.estado}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.pagos.length > 0 && (
                <div>
                  <div style={s.sectionTitle}>💵 Pagos ({results.pagos.length})</div>
                  {results.pagos.map((p: any) => (
                    <div
                      key={p.id}
                      style={s.item}
                      onClick={() => handleResultClick('pagos', p)}
                      onMouseEnter={(e) => Object.assign(e.currentTarget.style, s.itemHover)}
                      onMouseLeave={(e) => Object.assign(e.currentTarget.style, { backgroundColor: 'transparent' })}
                    >
                      <span>💵</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', fontSize: '14px', color: '#34d399' }}>
                          +${Number(p.monto).toLocaleString()}
                        </div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                          {new Date(p.fecha_pago).toLocaleDateString('es-MX')} • {p.prestamo?.prestatario?.nombre}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.prestamos.length === 0 && results.prestatarios.length === 0 && 
               results.leads.length === 0 && results.pagos.length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                  📋 No se encontraron resultados
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
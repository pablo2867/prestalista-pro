// app/components/SearchBar.tsx - VERSIÓN DEBUG
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

  console.log('🔍 [SearchBar] Render:', { query, results, showDropdown })

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length >= 2) {
        console.log('🔍 [SearchBar] Buscando:', query)
        setLoading(true)
        setShowDropdown(true)
        try {
          // 🔹 Usar URL absoluta con el puerto actual para evitar errores
          const port = window.location.port || (window.location.protocol === 'https:' ? '443' : '80')
          const baseUrl = `${window.location.protocol}//${window.location.hostname}:${port}`
          const url = `${baseUrl}/api/search?q=${encodeURIComponent(query)}`
          
          console.log('🌐 [SearchBar] Fetch URL:', url)
          
          const res = await fetch(url)
          console.log('📡 [SearchBar] Response status:', res.status)
          
          const data = await res.json()
          console.log('📦 [SearchBar] Response data:', data)
          
          if (data.success) {
            setResults(data.results)
            console.log('✅ [SearchBar] Resultados guardados:', data.results)
          } else {
            console.error('❌ [SearchBar] API error:', data.error)
          }
        } catch (err: any) {
          console.error('❌ [SearchBar] Fetch error:', err)
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleResultClick = (type: string) => {
    console.log('🖱️ [SearchBar] Click en:', type)
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

  // 🎨 Estilos mínimos y visibles
  const s = {
    container: { position: 'relative' as const, width: '100%', maxWidth: '400px', zIndex: 9999 },
    input: {
      width: '100%',
      padding: '12px 16px',
      backgroundColor: '#1f2937',
      border: '2px solid #3b82f6',
      borderRadius: '8px',
      color: 'white',
      fontSize: '14px',
      outline: 'none'
    },
    dropdown: {
      position: 'absolute' as const,
      top: '100%',
      left: 0,
      right: 0,
      marginTop: '8px',
      backgroundColor: '#111827',
      border: '2px solid #3b82f6',
      borderRadius: '12px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
      zIndex: 10000,
      maxHeight: '500px',
      overflow: 'auto'
    },
    item: {
      padding: '12px 16px',
      backgroundColor: 'transparent',
      borderBottom: '1px solid #1f2937',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      color: 'white'
    }
  }

  return (
    <div ref={containerRef} style={s.container}>
      {/* 🔍 Input SIEMPRE visible con borde azul para confirmar que está activo */}
      <input
        type="text"
        placeholder="🔍 Buscar..."
        value={query}
        onChange={(e) => {
          console.log('⌨️ [SearchBar] Input change:', e.target.value)
          setQuery(e.target.value)
        }}
        onFocus={() => {
          console.log('🎯 [SearchBar] Input focus')
          if (query.length >= 2) setShowDropdown(true)
        }}
        style={s.input}
      />

      {/* 📋 Dropdown con resultados */}
      {showDropdown && query.length >= 2 && (
        <div style={s.dropdown}>
          {loading && <div style={{ padding: '16px', color: '#9ca3af' }}>⏳ Buscando...</div>}
          
          {!loading && results && (
            <>
              {/* 👤 Clientes */}
              {results.prestatarios?.length > 0 && (
                <>
                  <div style={{ padding: '8px 16px', fontSize: '11px', color: '#6b7280', fontWeight: '600' }}>
                    CLIENTES ({results.prestatarios.length})
                  </div>
                  {results.prestatarios.map((p: any) => (
                    <div
                      key={p.id}
                      style={s.item}
                      onClick={() => {
                        console.log('✅ [SearchBar] Seleccionado cliente:', p.nombre)
                        handleResultClick('prestatarios')
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <span>👤</span>
                      <div>
                        <div style={{ fontWeight: '600' }}>{p.nombre} {p.apellido}</div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>{p.telefono || 'Sin teléfono'}</div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* 📄 Préstamos */}
              {results.prestamos?.length > 0 && (
                <>
                  <div style={{ padding: '8px 16px', fontSize: '11px', color: '#6b7280', fontWeight: '600' }}>
                    PRÉSTAMOS ({results.prestamos.length})
                  </div>
                  {results.prestamos.map((p: any) => (
                    <div
                      key={p.id}
                      style={s.item}
                      onClick={() => handleResultClick('prestamos')}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <span>📄</span>
                      <div>
                        <div style={{ fontWeight: '600' }}>{p.prestatario?.nombre} {p.prestatario?.apellido}</div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>${Number(p.monto_principal || 0).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* ❌ Sin resultados */}
              {(!results.prestatarios?.length && !results.prestamos?.length && !results.leads?.length && !results.pagos?.length) && (
                <div style={{ padding: '16px', color: '#6b7280', textAlign: 'center' }}>
                  📋 No se encontraron resultados para "{query}"
                </div>
              )}
            </>
          )}
          
          {!loading && !results && (
            <div style={{ padding: '16px', color: '#6b7280', textAlign: 'center' }}>
              Escribe para buscar...
            </div>
          )}
        </div>
      )}
    </div>
  )
}
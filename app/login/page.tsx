// app/login/page.tsx
'use client'

import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'admin' | 'distribuidor' | 'cobrador'>('cobrador')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { signIn, signUp } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        const { error } = await signIn(email, password)
        if (error) throw error
        router.push('/') // Al loguear va al dashboard
      } else {
        const { error } = await signUp(email, password, fullName, role)
        if (error) throw error
        alert('✅ Cuenta creada. Inicia sesión ahora.')
        setIsLogin(true)
      }
    } catch (err: any) {
      setError(err.message || 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const s = {
    page: { display: 'flex', minHeight: 'calc(100vh - 60px)', backgroundColor: '#0b0f19', alignItems: 'center', justifyContent: 'center', padding: '20px' },
    card: { backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '450px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' },
    title: { fontSize: '28px', fontWeight: 'bold', color: 'white', marginBottom: '8px', textAlign: 'center' as const },
    subtitle: { color: '#9ca3af', fontSize: '14px', marginBottom: '32px', textAlign: 'center' as const },
    input: { width: '100%', padding: '14px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: '15px', marginBottom: '16px', outline: 'none', boxSizing: 'border-box' as const },
    select: { width: '100%', padding: '14px', backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '8px', color: 'white', fontSize: '15px', marginBottom: '16px', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' as const },
    button: { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #2563eb, #3b82f6)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '15px', marginTop: '8px' },
    error: { backgroundColor: '#7f1d1d', color: '#f87171', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'center' as const },
    toggle: { textAlign: 'center' as const, marginTop: '24px', color: '#9ca3af', fontSize: '14px' },
    link: { color: '#3b82f6', cursor: 'pointer', marginLeft: '6px', textDecoration: 'underline' }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>PrestaLista Pro</h1>
        <p style={s.subtitle}>{isLogin ? 'Inicia sesión para continuar' : 'Registra tu cuenta de trabajo'}</p>

        {error && <div style={s.error}>❌ {error}</div>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <input type="text" placeholder="Nombre completo" value={fullName} onChange={(e) => setFullName(e.target.value)} required={!isLogin} style={s.input} />
              <select value={role} onChange={(e) => setRole(e.target.value as any)} required={!isLogin} style={s.select}>
                <option value="cobrador">👤 Cobrador</option>
                <option value="distribuidor">🤝 Distribuidor</option>
                <option value="admin">🔧 Administrador</option>
              </select>
            </>
          )}

          <input type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} required style={s.input} />
          <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required style={s.input} />

          <button type="submit" disabled={loading} style={{...s.button, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer'}}>
            {loading ? '⏳ Procesando...' : isLogin ? '🔐 Iniciar Sesión' : '📝 Crear Cuenta'}
          </button>
        </form>

        <div style={s.toggle}>
          {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
          <span style={s.link} onClick={() => { setIsLogin(!isLogin); setError('') }}>
            {isLogin ? 'Regístrate' : 'Inicia sesión'}
          </span>
        </div>
      </div>
    </div>
  )
}
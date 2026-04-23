'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/utils/supabase/client'

export interface TenantConfig {
  id: string
  nombreEmpresa: string
  subdominio: string
  dominioPersonalizado: string | null
  logoUrl: string | null
  colorPrincipal: string
  colorSecundario: string
  moneda: string
  zonaHoraria: string
  plan: string
  branding: {
    textoHeader: string
    textoFooter: string
    textoLogin: string
    faviconUrl: string | null
    emailSoporte: string | null
    telefonoSoporte: string | null
  }
}

interface TenantContextType {
  tenant: TenantConfig | null
  loading: boolean
  getBrandingText: (key: keyof TenantConfig['branding']) => string
}

const TenantContext = createContext<TenantContextType | undefined>(undefined)

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<TenantConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Detectar tenant desde subdominio, dominio o localhost
  useEffect(() => {
    async function detectarTenant() {
      try {
        const hostname = window.location.hostname
        const parts = hostname.split('.')
        
        let subdominio: string | null = null
        
        // Detectar subdominio (ej: finanzas.prestalista.com)
        if (parts.length >= 3 && !hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
          subdominio = parts[0]
        }
        
        // Para desarrollo en localhost, usar tenant 'demo'
        if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
          subdominio = 'demo'
        }

        if (subdominio) {
          // Buscar tenant por subdominio o dominio personalizado
          const { data, error } = await supabase
            .from('tenants')
            .select(`
              *,
              tenant_branding (
                texto_header,
                texto_footer,
                texto_login,
                favicon_url,
                email_soporte,
                telefono_soporte
              )
            `)
            .or(`subdominio.eq.${subdominio},dominio_personalizado.eq.${hostname}`)
            .eq('activo', true)
            .maybeSingle()

          if (data && !error) {
            setTenant({
              id: data.id,
              nombreEmpresa: data.nombre_empresa,
              subdominio: data.subdominio,
              dominioPersonalizado: data.dominio_personalizado,
              logoUrl: data.logo_url,
              colorPrincipal: data.color_principal,
              colorSecundario: data.color_secundario,
              moneda: data.moneda,
              zonaHoraria: data.zona_horaria,
              plan: data.plan,
              branding: {
                textoHeader: data.tenant_branding?.texto_header || 'CRM de Préstamos',
                textoFooter: data.tenant_branding?.texto_footer || '© 2026 {empresa}. Todos los derechos reservados.',
                textoLogin: data.tenant_branding?.texto_login || 'Bienvenido a {empresa} CRM',
                faviconUrl: data.tenant_branding?.favicon_url,
                emailSoporte: data.tenant_branding?.email_soporte,
                telefonoSoporte: data.tenant_branding?.telefono_soporte
              }
            })
            
            // Actualizar favicon dinámicamente si existe
            if (data.tenant_branding?.favicon_url) {
              const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement
              if (link) link.href = data.tenant_branding.favicon_url
            }
          }
        }
      } catch (err) {
        console.error('❌ Error detectando tenant:', err)
      } finally {
        setLoading(false)
      }
    }

    detectarTenant()
  }, [supabase])

  // Helper para reemplazar placeholders en textos de branding
  const getBrandingText = (key: keyof TenantConfig['branding']): string => {
    if (!tenant) return ''
    let text = tenant.branding[key] || ''
    // Reemplazar {empresa} con el nombre real de la empresa
    return text.replace(/{empresa}/g, tenant.nombreEmpresa)
  }

  return (
    <TenantContext.Provider value={{ tenant, loading, getBrandingText }}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  const context = useContext(TenantContext)
  if (context === undefined) {
    throw new Error('useTenant debe usarse dentro de TenantProvider')
  }
  return context
}
export interface Lead {
  id: string
  nombre: string
  email: string
  telefono: string
  whatsapp?: string
  empresa: string
  estado: 'nuevo' | 'contactado' | 'calificado' | 'perdido'
  creado_en: string
}

export interface User {
  id: string
  email: string
  nombre: string
  rol: 'admin' | 'vendedor'
}
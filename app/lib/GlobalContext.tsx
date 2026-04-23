// app/lib/GlobalContext.tsx
'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type GlobalContextType = {
  prestamosActualizados: boolean
  movimientosActualizados: boolean
  triggerPrestamosUpdate: () => void
  triggerMovimientosUpdate: () => void
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined)

export function GlobalProvider({ children }: { children: ReactNode }) {
  const [prestamosActualizados, setPrestamosActualizados] = useState(false)
  const [movimientosActualizados, setMovimientosActualizados] = useState(false)

  const triggerPrestamosUpdate = () => {
    setPrestamosActualizados(true)
    setTimeout(() => setPrestamosActualizados(false), 100)
  }

  const triggerMovimientosUpdate = () => {
    setMovimientosActualizados(true)
    setTimeout(() => setMovimientosActualizados(false), 100)
  }

  return (
    <GlobalContext.Provider 
      value={{ 
        prestamosActualizados, 
        movimientosActualizados,
        triggerPrestamosUpdate,
        triggerMovimientosUpdate
      }}
    >
      {children}
    </GlobalContext.Provider>
  )
}

export function useGlobalContext() {
  const context = useContext(GlobalContext)
  if (!context) {
    throw new Error('useGlobalContext must be used within a GlobalProvider')
  }
  return context
}
"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import type { User } from "./mock-data"

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  const login = useCallback(async (email: string, _password: string): Promise<boolean> => {
    // Simulacao de autenticacao - em producao, isso seria uma chamada API
    await new Promise((resolve) => setTimeout(resolve, 800))

    if (email === "admin@afapan.org.br") {
      setUser({
        id: "1",
        nome: "Carlos Silva",
        email: "admin@afapan.org.br",
        role: "admin",
        ativo: true,
        criadoEm: "2024-01-15",
      })
      return true
    }
    return false
  }, [])

  const logout = useCallback(() => {
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider")
  }
  return context
}

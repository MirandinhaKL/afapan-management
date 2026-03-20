"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { supabase } from "./supabase"
import type { User } from "./mock-data"

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verifica se há uma sessão ativa ao carregar
    let mounted = true

    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (mounted && session?.user) {
          await fetchUserProfile(session.user.id)
        }
      } catch (error) {
        console.warn("Falha ao obter sessão do Supabase:", error)
      }
      
      if (mounted) {
        setLoading(false)
      }
    }

    getSession()

    // Escuta mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (session?.user) {
          await fetchUserProfile(session.user.id)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.warn("Erro ao processar mudança de estado de autenticação:", error)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!error && data) {
      setUser(data)
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Supabase pode falhar com AbortError quando há um lock concorrente
        if ((error as any)?.name === 'AbortError') {
          console.warn('AbortError ao tentar logar (locking). Tentando novamente...')
          return false
        }

        // Log específico do erro do Supabase para debug
        console.error('Erro de autenticação Supabase:', {
          message: error.message,
          status: error.status,
          name: error.name
        })

        return false
      }

      // Verifica se o usuário foi retornado (autenticação bem-sucedida)
      if (!data.user) {
        console.error('Login falhou: nenhum usuário retornado')
        return false
      }

      console.log('Login bem-sucedido para:', data.user.email)
      return true
    } catch (error: any) {
      // Se o erro for AbortError, a mensagem é genérica mas não quebra a UI
      if (error?.name === 'AbortError') {
        console.warn('AbortError no login (lock).', error)
        return false
      }

      console.error('Erro inesperado no login:', error)
      return false
    }
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Erro no logout:', error.message)
    }
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, loading }}>
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

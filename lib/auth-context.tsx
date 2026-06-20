"use client"

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import type { Session } from "@supabase/supabase-js"
import { supabase } from "./supabase"
import type { User } from "./mock-data"

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isPasswordRecovery: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<boolean>
  updatePassword: (password: string) => Promise<boolean>
  cancelPasswordRecovery: () => Promise<void>
  loading: boolean
  setIsCreatingUser: (value: boolean) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
const AUTH_LOADING_FALLBACK_MS = 8000
const PROFILE_TIMEOUT_MS = 8000

function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error(`${label} demorou mais que ${timeoutMs}ms`))
    }, timeoutMs)

    Promise.resolve(promise)
      .then(resolve)
      .catch(reject)
      .finally(() => window.clearTimeout(timeout))
  })
}

function isInvalidRefreshTokenError(error: unknown) {
  return error instanceof Error && error.message.toLowerCase().includes("invalid refresh token")
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)
  const isCreatingUserRef = useRef(false)
  const authRequestIdRef = useRef(0)

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await withTimeout(
      supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single(),
      PROFILE_TIMEOUT_MS,
      "Busca do perfil"
    )

    if (error || !data) {
      throw error || new Error("Perfil não encontrado")
    }

    return data as User
  }

  useEffect(() => {
    let mounted = true
    let initialSessionResolved = false
    const loadingFallback = window.setTimeout(() => {
      if (mounted) {
        setLoading(false)
      }
    }, AUTH_LOADING_FALLBACK_MS)

    const applySession = async (session: Session | null) => {
      const requestId = ++authRequestIdRef.current

      if (!session?.user) {
        if (mounted) {
          setUser(null)
        }
        return
      }

      try {
        const profile = await fetchUserProfile(session.user.id)
        if (mounted && requestId === authRequestIdRef.current) {
          setUser(profile)
        }
      } catch (error) {
        console.warn("Falha ao buscar perfil do usuário:", error)
        if (mounted && requestId === authRequestIdRef.current) {
          setUser(null)
        }
      }
    }

    const loadInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        await applySession(session)
      } catch (error) {
        if (isInvalidRefreshTokenError(error)) {
          console.warn("Sessão local inválida. Limpando sessão do navegador.")
          await supabase.auth.signOut({ scope: "local" })
        } else {
          console.warn("Falha ao obter sessão do Supabase:", error)
        }

        if (mounted) {
          setUser(null)
        }
      } finally {
        initialSessionResolved = true
        window.clearTimeout(loadingFallback)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void loadInitialSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (isCreatingUserRef.current) {
        return
      }

      // getSession() já resolve a sessão usada na primeira renderização.
      // Processar INITIAL_SESSION em paralelo inicia uma segunda busca do perfil
      // e pode liberar o loading antes de essa busca terminar, exibindo o login
      // por um instante durante o F5.
      if (event === "INITIAL_SESSION" && !initialSessionResolved) {
        return
      }

      if (event === "PASSWORD_RECOVERY") {
        setIsPasswordRecovery(true)
      }

      window.setTimeout(() => {
        if (mounted) {
          void applySession(session)
        }
      }, 0)
    })

    return () => {
      mounted = false
      window.clearTimeout(loadingFallback)
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if ((error as any)?.name === "AbortError") {
          console.warn("AbortError ao tentar logar (locking). Tentando novamente...")
          return false
        }

        console.error("Erro de autenticação Supabase:", {
          message: error.message,
          status: error.status,
          name: error.name,
        })

        return false
      }

      if (!data.user) {
        console.error("Login falhou: nenhum usuário retornado")
        return false
      }

      console.log("Login bem-sucedido para:", data.user.email)
      return true
    } catch (error: any) {
      if (error?.name === "AbortError") {
        console.warn("AbortError no login (lock).", error)
        return false
      }

      console.error("Erro inesperado no login:", error)
      return false
    }
  }

  const logout = async () => {
    setUser(null)
    setIsPasswordRecovery(false)

    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Erro no logout:", error.message)
    }
  }

  const requestPasswordReset = async (email: string): Promise<boolean> => {
    const redirectTo = typeof window !== "undefined" ? window.location.origin : undefined
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    if (error) {
      console.error("Erro ao solicitar recuperação de senha:", error.message)
      return false
    }

    return true
  }

  const updatePassword = async (password: string): Promise<boolean> => {
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      console.error("Erro ao atualizar senha:", error.message)
      return false
    }

    await logout()
    return true
  }

  const cancelPasswordRecovery = async () => {
    await logout()
  }

  const setIsCreatingUser = (value: boolean) => {
    isCreatingUserRef.current = value
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isPasswordRecovery,
        login,
        logout,
        requestPasswordReset,
        updatePassword,
        cancelPasswordRecovery,
        loading,
        setIsCreatingUser,
      }}
    >
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

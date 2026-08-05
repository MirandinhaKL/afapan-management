"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { ArrowLeft, Eye, EyeOff, KeyRound, Loader2, Lock, Mail, TreePine } from "lucide-react"
import { toast } from "sonner"

export function LoginForm() {
  const {
    login,
    isPasswordRecovery,
    requestPasswordReset,
    updatePassword,
    cancelPasswordRecovery,
  } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [passwordConfirmation, setPasswordConfirmation] = useState("")
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setErrorMessage(null)

    if (!email || !password) {
      const message = "Preencha todos os campos"
      setErrorMessage(message)
      toast.error(message)
      return
    }

    setIsLoading(true)
    try {
      const success = await login(email, password)
      if (!success) {
        const message = "Credenciais inválidas. Verifique seu e-mail e senha."
        setErrorMessage(message)
        toast.error(message)
      }
    } catch {
      const message = "Erro ao tentar fazer login. Tente novamente mais tarde."
      setErrorMessage(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestPasswordReset = async (event: React.FormEvent) => {
    event.preventDefault()
    setErrorMessage(null)

    if (!email.trim()) {
      const message = "Informe seu e-mail."
      setErrorMessage(message)
      toast.error(message)
      return
    }

    setIsLoading(true)
    try {
      const success = await requestPasswordReset(email.trim())
      if (!success) {
        const message = "Não foi possível enviar o link de recuperação. Tente novamente."
        setErrorMessage(message)
        toast.error(message)
        return
      }

      setResetEmailSent(true)
      toast.success("Link de recuperação enviado.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdatePassword = async (event: React.FormEvent) => {
    event.preventDefault()
    setErrorMessage(null)

    if (password.length < 6) {
      const message = "A nova senha deve ter pelo menos 6 caracteres."
      setErrorMessage(message)
      toast.error(message)
      return
    }

    if (password !== passwordConfirmation) {
      const message = "As senhas não coincidem."
      setErrorMessage(message)
      toast.error(message)
      return
    }

    setIsLoading(true)
    try {
      const success = await updatePassword(password)
      if (!success) {
        const message = "Não foi possível atualizar a senha. Solicite um novo link."
        setErrorMessage(message)
        toast.error(message)
        return
      }

      setPassword("")
      setPasswordConfirmation("")
      toast.success("Senha atualizada. Entre com sua nova senha.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToLogin = async () => {
    setErrorMessage(null)
    setResetEmailSent(false)

    if (isPasswordRecovery) {
      await cancelPasswordRecovery()
      return
    }

    setIsForgotPassword(false)
  }

  const formTitle = isPasswordRecovery
    ? "Definir nova senha"
    : isForgotPassword
      ? "Recuperar senha"
      : "Acessar painel"

  const formDescription = isPasswordRecovery
    ? "Cadastre uma nova senha para acessar sua conta."
    : isForgotPassword
      ? "Informe seu e-mail para receber o link de recuperação."
      : "Entre com suas credenciais para acessar o sistema de gestão."

  return (
    <div className="flex min-h-screen">
      <div className="hidden flex-col justify-between bg-primary p-12 lg:flex lg:w-1/2">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-xl bg-primary-foreground/20 p-2">
            <TreePine className="text-primary-foreground" size={32} />
          </div>
          <span className="text-2xl font-bold text-primary-foreground">AFAPAN</span>
        </div>

        <div className="space-y-6">
          <h1 className="text-balance text-4xl font-bold leading-tight text-primary-foreground">
            Juntos pela preservação do meio ambiente
          </h1>
          <p className="text-pretty text-lg leading-relaxed text-primary-foreground/80">
            Plataforma de gestão administrativa para acompanhar o impacto do programa de compostagem e coordenar nossas ações ambientais.
          </p>
          <div className="flex gap-8 pt-4">
            <div>
              <p className="text-3xl font-bold text-primary-foreground">+35</p>
              <p className="text-sm text-primary-foreground/70">Voluntários</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary-foreground">+2</p>
              <p className="text-sm text-primary-foreground/70">Ton. recicladas</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary-foreground">+15</p>
              <p className="text-sm text-primary-foreground/70">Anos de associação</p>
            </div>
          </div>
        </div>

        <p className="text-sm text-primary-foreground/50">
          Associação Farroupilhense de Proteção ao Ambiente Natural
        </p>
      </div>

      <div className="flex w-full flex-col items-center justify-center bg-background px-6 lg:w-1/2">
        <div className="w-full max-w-md">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="space-y-1 pb-4">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">{formTitle}</h2>
              <CardDescription>{formDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              {isPasswordRecovery ? (
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nova senha</Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="Mínimo de 6 caracteres"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="pl-10"
                        disabled={isLoading}
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password-confirmation">Confirmar nova senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                      <Input
                        id="password-confirmation"
                        type="password"
                        placeholder="Repita a nova senha"
                        value={passwordConfirmation}
                        onChange={(event) => setPasswordConfirmation(event.target.value)}
                        className="pl-10"
                        disabled={isLoading}
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 animate-spin" size={16} />}
                    {isLoading ? "Atualizando..." : "Atualizar senha"}
                  </Button>

                  <Button type="button" variant="ghost" className="w-full" onClick={handleBackToLogin} disabled={isLoading}>
                    <ArrowLeft size={16} />
                    Voltar ao login
                  </Button>
                </form>
              ) : isForgotPassword ? (
                <form onSubmit={handleRequestPasswordReset} className="space-y-4">
                  {resetEmailSent ? (
                    <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm text-foreground">
                      Se o e-mail estiver cadastrado, você receberá um link para criar uma nova senha.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">E-mail</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="seu@email.com.br"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          className="pl-10"
                          disabled={isLoading}
                          autoComplete="email"
                        />
                      </div>
                    </div>
                  )}

                  {!resetEmailSent && (
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 animate-spin" size={16} />}
                      {isLoading ? "Enviando..." : "Enviar link de recuperação"}
                    </Button>
                  )}

                  <Button type="button" variant="ghost" className="w-full" onClick={handleBackToLogin} disabled={isLoading}>
                    <ArrowLeft size={16} />
                    Voltar ao login
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com.br"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="pl-10"
                        disabled={isLoading}
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="password">Senha</Label>
                      <button
                        type="button"
                        className="text-sm font-medium text-primary hover:underline"
                        onClick={() => {
                          setErrorMessage(null)
                          setIsForgotPassword(true)
                        }}
                      >
                        Esqueci minha senha
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Sua senha"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="px-10"
                        disabled={isLoading}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => setShowPassword((visible) => !visible)}
                        disabled={isLoading}
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                        aria-pressed={showPassword}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 animate-spin" size={16} />}
                    {isLoading ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              )}

              {errorMessage && (
                <p className="mt-4 text-sm text-destructive">{errorMessage}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

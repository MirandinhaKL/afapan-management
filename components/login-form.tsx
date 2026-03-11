"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { AfapanLogo } from "./afapan-logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Loader2, Lock, Mail, TreePine } from "lucide-react"
import { toast } from "sonner"

export function LoginForm() {
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error("Preencha todos os campos")
      return
    }

    setIsLoading(true)
    const success = await login(email, password)
    setIsLoading(false)

    if (!success) {
      toast.error("Credenciais invalidas", {
        description: "Verifique seu e-mail e senha.",
      })
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Painel Esquerdo - Branding */}
      <div className="hidden flex-col justify-between bg-primary p-12 lg:flex lg:w-1/2">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-xl bg-primary-foreground/20 p-2">
              <TreePine className="text-primary-foreground" size={32} />
            </div>
            <span className="text-2xl font-bold text-primary-foreground">AFAPAN</span>
          </div>
        </div>

        <div className="space-y-6">
          <h1 className="text-balance text-4xl font-bold leading-tight text-primary-foreground">
            Juntos pela preservacao do meio ambiente
          </h1>
          <p className="text-pretty text-lg leading-relaxed text-primary-foreground/80">
            Plataforma de gestao administrativa para acompanhar o impacto do programa de compostagem e coordenar nossas acoes ambientais.
          </p>
          <div className="flex gap-8 pt-4">
            <div>
              <p className="text-3xl font-bold text-primary-foreground">+35</p>
              <p className="text-sm text-primary-foreground/70">Voluntarios</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary-foreground">+2</p>
              <p className="text-sm text-primary-foreground/70">Ton. recicladas</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary-foreground">+41</p>
              <p className="text-sm text-primary-foreground/70">Anos de associacao</p>
            </div>
          </div>
        </div>

        <p className="text-sm text-primary-foreground/50">
          Associacao Farroupilhense de Protecao ao Ambiente Natural
        </p>
      </div>

      {/* Painel Direito - Formulario */}
      <div className="flex w-full flex-col items-center justify-center bg-background px-6 lg:w-1/2">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden">
            <AfapanLogo size="lg" />
          </div>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="space-y-1 pb-4">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">Acessar painel</h2>
              <CardDescription>
                Entre com suas credenciais para acessar o sistema de gestao.
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Sua senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" size={16} />
                      Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </form>

              <div className="mt-6 rounded-lg border border-border bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Acesso de demonstracao:</strong>
                  <br />
                  E-mail: admin@afapan.org.br
                  <br />
                  Senha: qualquer valor
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

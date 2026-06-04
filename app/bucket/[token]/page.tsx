"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { fetchParticipanteBucketLinkByToken } from "@/lib/supabase-queries"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { CheckCircle, AlertTriangle } from "lucide-react"

interface LinkData {
  id: string
  participante_id: string
  turma_bucket_period_id: string
  token: string
  is_active: boolean
  submitted: boolean
  submitted_at?: string
  participantes?: {
    id: string
    nome: string
    email: string
    telefone?: string
  }
  turma_bucket_periods?: {
    id: string
    periodo_label: string
    data_monitoramento: string
  }
}

export default function BucketForm() {
  const params = useParams()
  const token = params?.token as string

  const [linkData, setLinkData] = useState<LinkData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bucketsInput, setBucketsInput] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submittedBuckets, setSubmittedBuckets] = useState<number | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const buildWhatsAppUrl = (quantidade: number) => {
    const reportPhone = "5554997020020"
    const participanteName = (linkData?.participantes as any)?.nome || "Participante"
    const participanteId = linkData?.participante_id || ""
    const periodoLabel = (linkData?.turma_bucket_periods as any)?.periodo_label || "Este período"
    const periodoId = linkData?.turma_bucket_period_id || ""
    const message = `Registro de baldes AFAPAN

Participante: ${participanteName}
Participante ID: ${participanteId}
Período: ${periodoLabel}
Período ID: ${periodoId}
Token do link: ${token}
Quantidade de baldes: ${quantidade}`

    return `https://wa.me/${reportPhone}?text=${encodeURIComponent(message)}`
  }

  useEffect(() => {
    const loadLinkData = async () => {
      try {
        setLoading(true)
        setError(null)

        if (!token) {
          setError("Link inválido. Token não encontrado.")
          return
        }

        const data = await fetchParticipanteBucketLinkByToken(token as string)
        
        if (!data) {
          setError("Link inválido, expirado ou já foi utilizado.")
          return
        }

        setLinkData(data as LinkData)
      } catch (err) {
        console.error("Erro ao carregar dados:", err)
        setError("Erro ao carregar o formulário. Tente novamente.")
      } finally {
        setLoading(false)
      }
    }

    loadLinkData()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!bucketsInput || bucketsInput.trim() === "") {
      setSubmitError("Por favor, insira a quantidade de baldes.")
      return
    }

    const quantidade = parseInt(bucketsInput, 10)
    if (isNaN(quantidade) || quantidade < 0) {
      setSubmitError("Por favor, insira um número válido.")
      return
    }

    try {
      setSubmitting(true)
      setSubmitError(null)

      window.open(buildWhatsAppUrl(quantidade), "_blank", "noopener,noreferrer")
      setSubmittedBuckets(quantidade)
      setSubmitSuccess(true)
      setBucketsInput("")
    } catch (err) {
      console.error("Erro ao enviar dados:", err)
      setSubmitError(
        err instanceof Error ? err.message : "Erro ao abrir o WhatsApp. Tente novamente."
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-green-50 to-white">
        <div className="text-center">
          <Spinner className="w-12 h-12 mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando formulário...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-green-50 to-white p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Link Inválido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  const participanteName = (linkData?.participantes as any)?.nome || "Participante"
  const periodoLabel = (linkData?.turma_bucket_periods as any)?.periodo_label || "Este período"

  if (submitSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-green-50 to-white p-4">
        <Card className="w-full max-w-md border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              Enviado com Sucesso!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              Obrigado, {participanteName}!
            </p>
            <p className="text-center text-sm">
              Abrimos o WhatsApp com a mensagem preenchida. Envie a mensagem para concluir o registro.
            </p>
            <div className="bg-green-50 p-3 rounded-md text-center">
              <p className="text-sm font-semibold text-green-700">
                {submittedBuckets} balde(s) registrado(s)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!linkData) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-green-50 to-white p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="bg-linear-to-r from-green-600 to-green-700 text-white rounded-t-lg">
          <CardTitle className="text-2xl">AFAPAN - Registro de Baldes</CardTitle>
          <CardDescription className="text-green-100">
            Período: {periodoLabel}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Greeting */}
            <div className="space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-900">
                Olá, <span className="font-bold text-lg">{participanteName}</span>!
              </p>
              <p className="text-sm text-blue-800">
                Bem-vindo ao sistema de registro de baldes coletados.
              </p>
            </div>

            {/* Question */}
            <div className="space-y-3">
              <Label htmlFor="buckets" className="text-base font-semibold text-gray-700">
                Quantos baldes foram coletados neste período?
              </Label>
              <Input
                id="buckets"
                type="number"
                min="0"
                step="1"
                placeholder="Digite o número de baldes"
                value={bucketsInput}
                onChange={(e) => {
                  setBucketsInput(e.target.value)
                  setSubmitError(null)
                }}
                disabled={submitting}
                className="text-lg p-3 h-12"
                required
              />
              <p className="text-xs text-muted-foreground">
                Insira apenas números (ex: 5, 10, 25)
              </p>
            </div>

            {/* Error Alert */}
            {submitError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={submitting || !bucketsInput}
              className="w-full bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-lg h-12 font-semibold"
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <Spinner className="w-4 h-4" />
                  Abrindo WhatsApp...
                </div>
              ) : (
                "Enviar pelo WhatsApp"
              )}
            </Button>

            {/* Footer Info */}
            <div className="text-center space-y-1 pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                O registro será enviado por mensagem de WhatsApp
              </p>
              <p className="text-xs text-muted-foreground">
                AFAPAN - Gestão de Compostagem
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

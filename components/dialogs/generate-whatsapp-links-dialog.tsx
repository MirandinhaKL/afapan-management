import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import {
  AlertCircle,
  CheckCircle2,
  MessageCircle,
  Send,
} from "lucide-react"

interface CampaignResult {
  participanteId: string
  participanteNome?: string
  telefone?: string
  link?: string
  status: "sent" | "skipped" | "error" | "not_configured"
  error?: string
  messageId?: string
}

interface CampaignResponse {
  success: boolean
  configured: boolean
  total: number
  sent: number
  skipped: number
  errors: number
  notConfigured: number
  results: CampaignResult[]
}

interface GenerateWhatsAppLinksDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  turmaId: string
  turmaBucketPeriodId: string
  periodoLabel: string
}

const statusLabel: Record<CampaignResult["status"], string> = {
  sent: "Enviado",
  skipped: "Ignorado",
  error: "Erro",
  not_configured: "Não configurado",
}

const statusVariant: Record<CampaignResult["status"], "default" | "secondary" | "destructive" | "outline"> = {
  sent: "default",
  skipped: "secondary",
  error: "destructive",
  not_configured: "outline",
}

export function GenerateWhatsAppLinksDialog({
  open,
  onOpenChange,
  turmaId,
  turmaBucketPeriodId,
  periodoLabel,
}: GenerateWhatsAppLinksDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [campaign, setCampaign] = useState<CampaignResponse | null>(null)

  const handleSendCampaign = async () => {
    try {
      setLoading(true)
      setError(null)
      setCampaign(null)

      const response = await fetch("/api/whatsapp/campaign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          turmaId,
          turmaBucketPeriodId,
          expiresInDays: 30,
        }),
      })

      const result = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(result?.error || "Erro ao enviar campanha")
      }

      setCampaign(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar campanha")
      console.error("Erro ao enviar campanha:", err)
    } finally {
      setLoading(false)
    }
  }

  const hasMissingConfig = campaign && !campaign.configured

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[82vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-600" />
            Campanha de WhatsApp para Coleta de Baldes
          </DialogTitle>
          <DialogDescription>
            Envie uma mensagem para todos os participantes da turma no período {periodoLabel}.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="rounded-md border bg-muted/30 p-4 space-y-2">
          <p className="text-sm font-medium text-foreground">Como funciona</p>
          <p className="text-sm text-muted-foreground">
            O sistema gera ou reutiliza um link único por participante e dispara o template
            oficial pelo WhatsApp Cloud API. O participante clica no link e informa apenas
            a quantidade de baldes.
          </p>
          <p className="text-sm text-muted-foreground">
            Para enviar de verdade, configure `WHATSAPP_ACCESS_TOKEN`,
            `WHATSAPP_PHONE_NUMBER_ID` e `WHATSAPP_TEMPLATE_NAME` no ambiente do servidor.
          </p>
        </div>

        <Button
          onClick={handleSendCampaign}
          disabled={loading || !turmaId || !turmaBucketPeriodId}
          className="w-full bg-green-600 hover:bg-green-700 text-white h-11 text-base"
        >
          {loading ? (
            <>
              <Spinner className="w-4 h-4 mr-2" />
              Enviando campanha...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Enviar Campanha Para Todos
            </>
          )}
        </Button>

        {campaign && (
          <div className="space-y-4">
            <Alert className={hasMissingConfig ? "border-amber-200 bg-amber-50" : "border-green-200 bg-green-50"}>
              <CheckCircle2 className={`h-4 w-4 ${hasMissingConfig ? "text-amber-600" : "text-green-600"}`} />
              <AlertDescription className={hasMissingConfig ? "text-amber-900" : "text-green-800"}>
                {hasMissingConfig
                  ? "Links preparados, mas as credenciais do WhatsApp ainda não estão configuradas."
                  : "Campanha processada."}
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-xl font-semibold">{campaign.total}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Enviados</p>
                <p className="text-xl font-semibold text-green-700">{campaign.sent}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Sem config.</p>
                <p className="text-xl font-semibold text-amber-700">{campaign.notConfigured}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Erros</p>
                <p className="text-xl font-semibold text-red-700">{campaign.errors}</p>
              </div>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {campaign.results.map((item) => (
                <div
                  key={`${item.participanteId}-${item.status}`}
                  className="rounded-md border p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.participanteNome || item.participanteId}
                      </p>
                      {item.telefone && (
                        <p className="text-xs text-muted-foreground">{item.telefone}</p>
                      )}
                      {item.error && (
                        <p className="text-xs text-destructive mt-1">{item.error}</p>
                      )}
                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-xs text-blue-600 underline break-all"
                        >
                          {item.link}
                        </a>
                      )}
                    </div>
                    <Badge variant={statusVariant[item.status]}>
                      {statusLabel[item.status]}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

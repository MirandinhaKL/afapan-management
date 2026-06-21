import { useEffect, useState } from "react"
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
  ExternalLink,
  MessageCircle,
  Send,
} from "lucide-react"
import { generateBucketLinksForPeriod } from "@/lib/supabase-queries"
import { generateWhatsAppLink, generateWhatsAppMessage } from "@/lib/whatsapp-utils"
import { formatPeriodRange } from "@/lib/date-utils"

interface BucketLink {
  participanteId: string
  participanteNome: string
  telefone?: string
  token: string
  link: string
}

interface GenerateWhatsAppLinksDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  turmaId: string
  turmaBucketPeriodId: string
  periodoLabel: string
  dataInicio?: string
  dataFim?: string
}

export function GenerateWhatsAppLinksDialog({
  open,
  onOpenChange,
  turmaId,
  turmaBucketPeriodId,
  periodoLabel,
  dataInicio,
  dataFim,
}: GenerateWhatsAppLinksDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [links, setLinks] = useState<BucketLink[]>([])
  const [openedIds, setOpenedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!open) return
    setLinks([])
    setOpenedIds(new Set())
    setError(null)
  }, [open])

  const handleGenerateLinks = async () => {
    if (!dataInicio || !dataFim) {
      setError("Configure o início e o fim do trimestre antes de gerar as mensagens.")
      return
    }

    try {
      setLoading(true)
      setError(null)

      const generatedLinks = await generateBucketLinksForPeriod(
        turmaId,
        turmaBucketPeriodId,
        30
      )

      setLinks(generatedLinks)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar links")
      console.error("Erro ao gerar links:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenWhatsApp = (link: BucketLink) => {
    if (!dataInicio || !dataFim) {
      setError("Configure o início e o fim do trimestre antes de abrir o WhatsApp.")
      return
    }

    const whatsappUrl = generateWhatsAppLink(
      link.token,
      link.participanteNome,
      periodoLabel,
      { phoneNumber: link.telefone },
      dataInicio,
      dataFim
    )

    window.open(whatsappUrl, "_blank", "noopener,noreferrer")
    setOpenedIds((prev) => new Set(prev).add(link.participanteId))
  }

  const openedCount = links.filter((link) => openedIds.has(link.participanteId)).length
  const nextLink = links.find((link) => !openedIds.has(link.participanteId))
  const previewMessage = dataInicio && dataFim
    ? generateWhatsAppMessage(
        "link-do-participante",
        "Nome do participante",
        periodoLabel,
        typeof window !== "undefined" ? window.location.origin : undefined,
        dataInicio,
        dataFim
      )
    : "Configure o início e o fim do trimestre na tela de Monitoramento."

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[82vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-600" />
            Mensagens Individuais de WhatsApp
          </DialogTitle>
          <DialogDescription>
            Gere links únicos para o trimestre e abra uma conversa por participante.
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
            O sistema cria ou reutiliza um link único para cada participante. Quando a pessoa
            abrir o link, verá o formulário interno da AFAPAN e a quantidade informada será salva
            no banco de dados.
          </p>
        </div>

        <div className="space-y-2 rounded-md border p-4">
          <p className="text-sm font-medium">Trimestre informado ao participante:</p>
          <p className="text-sm font-medium text-green-700">
            {formatPeriodRange(dataInicio, dataFim, "Datas não configuradas")}
          </p>
        </div>

        <div className="space-y-2 rounded-md border bg-muted/20 p-4">
          <p className="text-sm font-medium">Prévia da mensagem</p>
          <pre className="whitespace-pre-wrap font-sans text-sm text-muted-foreground">
            {previewMessage}
          </pre>
        </div>

        <Button
          onClick={handleGenerateLinks}
          disabled={loading || !turmaId || !turmaBucketPeriodId || !dataInicio || !dataFim}
          className="w-full bg-green-600 hover:bg-green-700 text-white h-11 text-base"
        >
          {loading ? (
            <>
              <Spinner className="w-4 h-4 mr-2" />
              Gerando links...
            </>
          ) : (
            "Gerar links"
          )}
        </Button>

        {links.length > 0 && (
          <div className="space-y-4">
            <div className="space-y-3 rounded-md border border-green-200 bg-green-50/60 p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-green-900">Envio sequencial</p>
                  <p className="text-xs text-green-800">
                    {openedCount} de {links.length} conversa(s) aberta(s)
                  </p>
                </div>
                {nextLink && (
                  <p className="text-sm text-green-800">
                    Próximo: <strong>{nextLink.participanteNome}</strong>
                  </p>
                )}
              </div>

              <Button
                className="w-full bg-green-600 text-white hover:bg-green-700"
                disabled={!nextLink}
                onClick={() => nextLink && handleOpenWhatsApp(nextLink)}
              >
                {nextLink ? (
                  <>
                    <Send className="mr-2 size-4" />
                    Abrir próximo WhatsApp
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 size-4" />
                    Todos os envios foram abertos
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground">
                Após enviar a mensagem no WhatsApp, volte a esta tela e clique novamente para abrir
                o próximo participante.
              </p>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {links.map((link) => {
                const wasOpened = openedIds.has(link.participanteId)

                return (
                  <div
                    key={link.token}
                    className="rounded-md border p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {link.participanteNome}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {link.telefone || "Telefone não informado"}
                        </p>
                        <a
                          href={link.link}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-xs text-blue-600 underline break-all"
                        >
                          {link.link}
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={wasOpened ? "default" : "outline"}>
                          {wasOpened ? "Aberto" : "Pendente"}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenWhatsApp(link)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          WhatsApp
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
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

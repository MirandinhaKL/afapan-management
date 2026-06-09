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
  ExternalLink,
  MessageCircle,
} from "lucide-react"
import { generateBucketLinksForPeriod } from "@/lib/supabase-queries"
import { generateWhatsAppLink } from "@/lib/whatsapp-utils"

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
  const [links, setLinks] = useState<BucketLink[]>([])
  const [openedIds, setOpenedIds] = useState<Set<string>>(new Set())

  const handleGenerateLinks = async () => {
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
    const whatsappUrl = generateWhatsAppLink(
      link.token,
      link.participanteNome,
      periodoLabel,
      { phoneNumber: link.telefone }
    )

    window.open(whatsappUrl, "_blank", "noopener,noreferrer")
    setOpenedIds((prev) => new Set(prev).add(link.participanteId))
  }

  const linksWithPhone = links.filter((link) => link.telefone?.trim())
  const linksWithoutPhone = links.length - linksWithPhone.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[82vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-600" />
            Mensagens Individuais de WhatsApp
          </DialogTitle>
          <DialogDescription>
            Gere links únicos para o período {periodoLabel} e abra uma conversa por participante.
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
            no Supabase.
          </p>
        </div>

        <Button
          onClick={handleGenerateLinks}
          disabled={loading || !turmaId || !turmaBucketPeriodId}
          className="w-full bg-green-600 hover:bg-green-700 text-white h-11 text-base"
        >
          {loading ? (
            <>
              <Spinner className="w-4 h-4 mr-2" />
              Gerando links...
            </>
          ) : (
            "Gerar Links Únicos"
          )}
        </Button>

        {links.length > 0 && (
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {linksWithPhone.length} participante(s) com telefone. {linksWithoutPhone} sem telefone.
              </AlertDescription>
            </Alert>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {links.map((link) => {
                const hasPhone = Boolean(link.telefone?.trim())
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
                        <Badge variant={wasOpened ? "default" : hasPhone ? "outline" : "secondary"}>
                          {wasOpened ? "Aberto" : hasPhone ? "Pendente" : "Sem telefone"}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={!hasPhone}
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

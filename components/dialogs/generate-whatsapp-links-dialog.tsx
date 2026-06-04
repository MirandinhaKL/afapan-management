import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Spinner } from "@/components/ui/spinner"
import {
  Copy,
  Download,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  MessageCircle,
} from "lucide-react"
import {
  generateWhatsAppLink,
  generateWhatsAppMessage,
  copyWhatsAppLinkToClipboard,
  openWhatsAppWeb,
  downloadBucketLinksCSV,
} from "@/lib/whatsapp-utils"
import { generateBucketLinksForPeriod } from "@/lib/supabase-queries"

interface BucketLink {
  participanteId: string
  participanteNome: string
  token: string
  link: string
}

interface GenerateWhatsAppLinksDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  turmaId: string
  turmaBucketPeriodId: string
  periodoLabel: string
  onLinksGenerated?: (links: BucketLink[]) => void
}

export function GenerateWhatsAppLinksDialog({
  open,
  onOpenChange,
  turmaId,
  turmaBucketPeriodId,
  periodoLabel,
  onLinksGenerated,
}: GenerateWhatsAppLinksDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [links, setLinks] = useState<BucketLink[]>([])
  const [selectedLink, setSelectedLink] = useState<BucketLink | null>(null)
  const [copied, setCopied] = useState(false)

  const handleGenerateLinks = async () => {
    try {
      setLoading(true)
      setError(null)

      const generatedLinks = await generateBucketLinksForPeriod(
        turmaId,
        turmaBucketPeriodId,
        30
      )

      const formattedLinks = generatedLinks.map((link) => ({
        participanteId: link.participanteId,
        participanteNome: link.participanteNome,
        token: link.token,
        link: link.link,
      }))

      setLinks(formattedLinks)
      onLinksGenerated?.(formattedLinks)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao gerar links"
      )
      console.error("Erro ao gerar links:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyMessage = async (link: BucketLink) => {
    const success = await copyWhatsAppLinkToClipboard(
      link.token,
      link.participanteNome,
      periodoLabel
    )

    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownloadCSV = () => {
    const csvData = links.map((link) => ({
      participanteNome: link.participanteNome,
      token: link.token,
      periodLabel: periodoLabel,
      link: link.link,
    }))

    downloadBucketLinksCSV(
      csvData,
      `bucket-links-${periodoLabel.replace(/\s+/g, "-")}.csv`
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-600" />
            Gerar Links de WhatsApp para Coleta de Baldes
          </DialogTitle>
          <DialogDescription>
            Crie links únicos para cada participante registrar a quantidade de baldes no período {periodoLabel}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate">Gerar</TabsTrigger>
            <TabsTrigger value="links" disabled={links.length === 0}>
              Links Gerados ({links.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-4 mt-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <p className="font-semibold text-sm text-blue-900">
                Como funciona:
              </p>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>
                  Um link único será criado para cada participante da turma
                </li>
                <li>
                  O link permite que o participante registre a quantidade de baldes
                </li>
                <li>
                  Os dados são salvos automaticamente no banco de dados
                </li>
                <li>
                  Cada link expira em 30 dias (pode ser customizado)
                </li>
              </ul>
            </div>

            <Button
              onClick={handleGenerateLinks}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white h-11 text-base"
            >
              {loading ? (
                <>
                  <Spinner className="w-4 h-4 mr-2" />
                  Gerando links...
                </>
              ) : (
                "Gerar Links Para Todos os Participantes"
              )}
            </Button>

            {links.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                <div className="text-sm text-green-800">
                  <p className="font-semibold">
                    {links.length} link(s) gerado(s) com sucesso!
                  </p>
                  <p className="text-xs mt-1">
                    Vá para a aba "Links Gerados" para enviar via WhatsApp
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="links" className="space-y-4 mt-4">
            {links.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum link gerado ainda. Gere os links primeiro.
              </p>
            ) : (
              <>
                <div className="flex gap-2 mb-4">
                  <Button
                    onClick={handleDownloadCSV}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Baixar CSV
                  </Button>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {links.map((link) => (
                    <div
                      key={link.token}
                      className="border rounded-lg p-3 hover:bg-gray-50 transition"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {link.participanteNome}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono truncate">
                            {link.token}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 break-all">
                            <a
                              href={link.link}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="text-blue-600 hover:text-blue-700 underline"
                            >
                              {link.link}
                            </a>
                          </p>
                        </div>

                        <div className="flex gap-2 shrink-0">
                          <Button
                            onClick={() => handleCopyMessage(link)}
                            size="sm"
                            variant="ghost"
                            title="Copiar mensagem"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => openWhatsAppWeb(link.token, link.participanteNome, periodoLabel)}
                            size="sm"
                            variant="ghost"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="Abrir WhatsApp"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {copied && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Mensagem copiada para a área de transferência!
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>

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

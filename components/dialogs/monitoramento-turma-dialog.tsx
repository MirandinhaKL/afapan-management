import { useEffect, useState } from "react"
import { Calendar, MessageCircle } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { type TurmaCompostagem } from "@/lib/mock-data"
import {
  fetchTurmaBucketPeriods,
  updateTurmaBucketPeriod,
  type TurmaBucketPeriod,
} from "@/lib/supabase-queries"
import { hasFourDigitYear } from "@/lib/date-utils"
import { GenerateWhatsAppLinksDialog } from "./generate-whatsapp-links-dialog"

interface MonitoramentoTurmaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  turma: TurmaCompostagem | null
}

export function MonitoramentoTurmaDialog({
  open,
  onOpenChange,
  turma,
}: MonitoramentoTurmaDialogProps) {
  const [periods, setPeriods] = useState<TurmaBucketPeriod[]>([])
  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<TurmaBucketPeriod | null>(null)
  const [messagesOpen, setMessagesOpen] = useState(false)

  useEffect(() => {
    if (!open || !turma?.id) return

    const loadPeriods = async () => {
      try {
        setLoading(true)
        setPeriods(await fetchTurmaBucketPeriods(turma.id))
      } catch (error) {
        console.error("Erro ao carregar períodos:", error)
        toast.error("Erro ao carregar os períodos de monitoramento")
      } finally {
        setLoading(false)
      }
    }

    void loadPeriods()
  }, [open, turma?.id])

  const updateLocalPeriod = (periodId: string, updates: Partial<TurmaBucketPeriod>) => {
    setPeriods((prev) =>
      prev.map((period) => period.id === periodId ? { ...period, ...updates } : period)
    )
  }

  const handleSave = async (period: TurmaBucketPeriod) => {
    const { data_monitoramento: monitoringDate, data_inicio: startDate, data_fim: endDate } = period

    if (!monitoringDate || !startDate || !endDate) {
      toast.error("Informe a data de monitoramento e o intervalo do período")
      return null
    }
    if (![monitoringDate, startDate, endDate].every(hasFourDigitYear)) {
      toast.error("O ano das datas deve possuir exatamente 4 dígitos")
      return null
    }
    if (endDate < startDate) {
      toast.error("A data final deve ser igual ou posterior à data inicial")
      return null
    }

    try {
      setSavingId(period.id)
      const updated = await updateTurmaBucketPeriod(period.id, {
        data_monitoramento: monitoringDate,
        data_inicio: startDate,
        data_fim: endDate,
      })
      updateLocalPeriod(period.id, updated)
      toast.success(`Período ${period.periodo_numero} atualizado`)
      return updated
    } catch (error) {
      console.error("Erro ao atualizar período:", error)
      toast.error("Erro ao atualizar o período")
      return null
    } finally {
      setSavingId(null)
    }
  }

  const handleOpenMessages = async (period: TurmaBucketPeriod) => {
    const updated = await handleSave(period)
    if (!updated) return
    setSelectedPeriod(updated)
    setMessagesOpen(true)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="size-5 text-primary" />
              Monitoramento: {turma?.nome}
            </DialogTitle>
            <DialogDescription>
              Edite as datas de monitoramento e o intervalo informado aos participantes.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Spinner />
              Carregando períodos...
            </div>
          ) : periods.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhum período de monitoramento definido.
            </p>
          ) : (
            <div className="space-y-4">
              {periods.map((period) => (
                <div key={period.id} className="space-y-4 rounded-lg border p-4">
                  <div>
                    <p className="font-semibold">Período {period.periodo_numero}</p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-1">
                      <Label htmlFor={`monitoring-${period.id}`}>Monitoramento</Label>
                      <Input
                        id={`monitoring-${period.id}`}
                        type="date"
                        max="9999-12-31"
                        value={period.data_monitoramento}
                        onChange={(event) =>
                          updateLocalPeriod(period.id, { data_monitoramento: event.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`start-${period.id}`}>Início do período</Label>
                      <Input
                        id={`start-${period.id}`}
                        type="date"
                        max="9999-12-31"
                        value={period.data_inicio || ""}
                        onChange={(event) =>
                          updateLocalPeriod(period.id, { data_inicio: event.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`end-${period.id}`}>Fim do período</Label>
                      <Input
                        id={`end-${period.id}`}
                        type="date"
                        max="9999-12-31"
                        value={period.data_fim || ""}
                        onChange={(event) =>
                          updateLocalPeriod(period.id, { data_fim: event.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex flex-col-reverse gap-2 border-t pt-3 sm:flex-row sm:justify-end">
                    <Button
                      variant="outline"
                      className="sm:min-w-32"
                      onClick={() => void handleOpenMessages(period)}
                      disabled={savingId === period.id}
                    >
                      <MessageCircle className="mr-2 size-4" />
                      Mensagens
                    </Button>
                    <Button
                      className="sm:min-w-28"
                      onClick={() => void handleSave(period)}
                      disabled={savingId === period.id}
                    >
                      {savingId === period.id && <Spinner className="mr-2" />}
                      {savingId === period.id ? "Salvando..." : "Salvar"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <GenerateWhatsAppLinksDialog
        open={messagesOpen}
        onOpenChange={setMessagesOpen}
        turmaId={turma?.id || ""}
        turmaBucketPeriodId={selectedPeriod?.id || ""}
        periodoLabel={selectedPeriod?.periodo_label || ""}
        dataInicio={selectedPeriod?.data_inicio}
        dataFim={selectedPeriod?.data_fim}
      />
    </>
  )
}

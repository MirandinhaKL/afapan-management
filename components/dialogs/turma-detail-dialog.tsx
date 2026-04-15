import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserMinus, Calendar } from "lucide-react"
import { useState, useEffect } from "react"
import { type Participante, type TurmaCompostagem } from "@/lib/mock-data"
import { type TurmaBucketPeriod, fetchTurmaBucketPeriods } from "@/lib/supabase-queries"

interface TurmaDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  turma: (TurmaCompostagem & { participantes: Participante[] }) | null
  onRemoveParticipant: (participanteId: string, turmaId: string) => void
}

export function TurmaDetailDialog({
  open,
  onOpenChange,
  turma,
  onRemoveParticipant,
}: TurmaDetailDialogProps) {
  const [bucketPeriods, setBucketPeriods] = useState<TurmaBucketPeriod[]>([])
  const [isLoadingPeriods, setIsLoadingPeriods] = useState(false)

  useEffect(() => {
    if (open && turma?.id) {
      const loadPeriods = async () => {
        try {
          setIsLoadingPeriods(true)
          const periods = await fetchTurmaBucketPeriods(turma.id)
          setBucketPeriods(periods)
        } catch (error) {
          console.error("Erro ao carregar períodos:", error)
          setBucketPeriods([])
        } finally {
          setIsLoadingPeriods(false)
        }
      }
      loadPeriods()
    }
  }, [open, turma?.id])
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col gap-0 p-0">
        <div className="px-6 py-4 border-b">
          <DialogTitle>Detalhes da turma: {turma?.nome}</DialogTitle>
          <DialogDescription>
            Participantes da turma e informações gerais.
          </DialogDescription>
        </div>
        <div className="flex-1 overflow-y-auto">
          {turma && (
            <div className="space-y-4 px-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Nome</Label>
                  <p className="text-sm font-medium text-foreground">{turma.nome}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Participantes</Label>
                  <p className="text-sm font-medium text-foreground">{turma.participantes.length}</p>
                </div>
                {turma.descricao && (
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">Descrição</Label>
                    <p className="text-sm font-medium text-foreground">{turma.descricao}</p>
                  </div>
                )}
                <div>
                  <Label className="text-xs text-muted-foreground">Criado em</Label>
                  <p className="text-sm font-medium text-foreground">
                    {new Date(turma.criado_em).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Participantes</Label>
                {turma.participantes.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {turma.participantes.map((participante: Participante) => (
                      <div
                        key={participante.id}
                        className="flex items-center justify-between rounded-lg border border-border/50 p-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">{participante.nome}</p>
                          <p className="text-xs text-muted-foreground">{participante.telefone}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => onRemoveParticipant(participante.id, turma.id)}
                        >
                          <UserMinus size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Nenhum participante nesta turma.
                  </p>
                )}
              </div>

              {/* Datas de Monitoramento de Baldes */}
              <div>
                <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar size={14} />
                  Datas de Monitoramento
                </Label>
                {isLoadingPeriods ? (
                  <p className="mt-2 text-sm text-muted-foreground">Carregando períodos...</p>
                ) : bucketPeriods.length > 0 ? (
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {bucketPeriods.map((period) => (
                      <div
                        key={period.id}
                        className="rounded-lg border border-border/50 p-3 bg-card"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              Período {period.periodo_numero}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {period.periodo_label}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {new Date(period.data_monitoramento).toLocaleDateString("pt-BR")}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Nenhum período de monitoramento definido.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

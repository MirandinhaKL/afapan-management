import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"
import { type Participante, type TurmaCompostagem } from "@/lib/mock-data"

interface AddParticipantDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  turma: (TurmaCompostagem & { participantes: Participante[] }) | null
  participantes: Participante[]
  onAddParticipant: (participanteId: string) => void
}

export function AddParticipantDialog({
  open,
  onOpenChange,
  turma,
  participantes,
  onAddParticipant,
}: AddParticipantDialogProps) {
  const availableParticipantes = participantes.filter(
    (p) => !turma?.participantes.some((sp: Participante) => sp.id === p.id)
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar participante à turma</DialogTitle>
          <DialogDescription>
            Selecione um participante para adicionar à turma "{turma?.nome}".
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="max-h-60 overflow-y-auto space-y-2">
            {availableParticipantes.map((participante: Participante) => (
              <div
                key={participante.id}
                className="flex items-center justify-between rounded-lg border border-border/50 p-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{participante.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    Turma {participante.turma} • {participante.telefone}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddParticipant(participante.id)}
                >
                  <UserPlus size={14} className="mr-1" />
                  Adicionar
                </Button>
              </div>
            ))}
            {availableParticipantes.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">
                Não há participantes para serem associados a esta turma.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

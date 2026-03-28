import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { UserMinus } from "lucide-react"
import { type Participante, type TurmaCompostagem } from "@/lib/mock-data"

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes da turma: {turma?.nome}</DialogTitle>
          <DialogDescription>
            Participantes da turma e informações gerais.
          </DialogDescription>
        </DialogHeader>
        {turma && (
          <div className="space-y-4">
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
                <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

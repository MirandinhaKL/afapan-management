import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { type Participante } from "@/lib/mock-data"

interface ParticipantDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  participante: Participante | null
}

export function ParticipantDetailDialog({
  open,
  onOpenChange,
  participante,
}: ParticipantDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Detalhes do participante</DialogTitle>
          <DialogDescription>
            Informacoes completas e historico de compostagem.
          </DialogDescription>
        </DialogHeader>
        {participante && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Nome</Label>
                <p className="text-sm font-medium text-foreground">{participante.nome}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Turma</Label>
                <p className="text-sm font-medium text-foreground">
                  Turma {participante.turma}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Telefone</Label>
                <p className="text-sm font-medium text-foreground">
                  {participante.telefone}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">E-mail</Label>
                <p className="text-sm font-medium text-foreground">
                  {participante.email}
                </p>
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Historico de baldes</Label>
              {participante.baldes.length > 0 ? (
                <div className="mt-2 space-y-2">
                  {participante.baldes.map((balde) => (
                    <div
                      key={balde.trimestre}
                      className="flex items-center justify-between rounded-lg border border-border/50 p-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{balde.trimestre}</p>
                        <p className="text-xs text-muted-foreground">
                          Registrado em {balde.dataRegistro}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-sm font-bold">
                        {balde.quantidade} baldes
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  Nenhum registro encontrado.
                </p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

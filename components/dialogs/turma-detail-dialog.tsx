import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { UserMinus } from "lucide-react"
import { type Participante, type TurmaCompostagem } from "@/lib/mock-data"
import { requestCompostagemImport } from "@/lib/compostagem-importacao-client"

function ConsultaCpf({ turma, participante }: { turma: string; participante: string }) {
  const [result, setResult] = useState("")
  const [busy, setBusy] = useState(false)
  async function consult() {
    setBusy(true)
    try {
      const query = new URLSearchParams({ turma, participante })
      const { cpf } = await requestCompostagemImport<{ cpf: string | null }>(`?${query}`)
      setResult(cpf ? `CPF ${cpf}` : "CPF não informado.")
    } catch (error) {
      setResult((error as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return result ? <p role="status" className="text-xs">{result}</p> :
    <Button variant="link" size="sm" className="h-auto p-0" disabled={busy} onClick={consult}>Consultar CPF</Button>
}

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
      <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col gap-0 p-0">
        <div className="border-b px-6 py-4">
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
                  <p className="text-sm font-medium">{turma.nome}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Participantes</Label>
                  <p className="text-sm font-medium">{turma.participantes.length}</p>
                </div>
                {turma.descricao && (
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">Descrição</Label>
                    <p className="text-sm font-medium">{turma.descricao}</p>
                  </div>
                )}
                <div>
                  <Label className="text-xs text-muted-foreground">Criado em</Label>
                  <p className="text-sm font-medium">
                    {new Date(turma.criado_em).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Participantes</Label>
                {turma.participantes.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {turma.participantes.map((participante) => (
                      <div
                        key={participante.id}
                        className="flex items-center justify-between rounded-lg border border-border/50 p-3"
                      >
                        <div>
                          <p className="text-sm font-medium">{participante.nome}</p>
                          <p className="text-xs text-muted-foreground">{participante.telefone}</p>
                          {open && <ConsultaCpf key={turma.id} turma={turma.id} participante={participante.id} />}
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
        </div>
      </DialogContent>
    </Dialog>
  )
}

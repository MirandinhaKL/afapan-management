import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { type Participante } from "@/lib/mock-data"
import { type Balde } from "@/lib/supabase-queries"

interface ParticipantDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  participante: Participante | null
  baldes?: Balde[]
}

export function ParticipantDetailDialog({
  open,
  onOpenChange,
  participante,
  baldes = [],
}: ParticipantDetailDialogProps) {

  const currentYear = new Date().getFullYear()
  const recordsThisYear = baldes.filter(b => {
    const recordYear = new Date(b.data_registro).getFullYear()
    return recordYear === currentYear
  })
  const totalThisYear = recordsThisYear.reduce((sum, b) => sum + (b.quantidade || 0), 0)
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle>Detalhes do Participante</DialogTitle>
            <DialogDescription>
              Informações completas e histórico de compostagem.
            </DialogDescription>
          </DialogHeader>
          {participante && (
            <div className="flex-1 overflow-y-auto pr-4 space-y-4">
              {/* Informações Pessoais */}
              <div className="space-y-3 rounded-lg border border-border/50 bg-muted/20 p-4">
                <h3 className="text-sm font-semibold text-foreground">Informações Pessoais</h3>
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
              </div>

              {/* Endereço */}
              <div className="space-y-3 rounded-lg border border-border/50 bg-muted/20 p-4">
                <h3 className="text-sm font-semibold text-foreground">Endereço</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">Rua</Label>
                    <p className="text-sm font-medium text-foreground">
                      {participante.endereco || "Não informado"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Bairro</Label>
                    <p className="text-sm font-medium text-foreground">
                      {participante.bairro || "Não informado"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">CEP</Label>
                    <p className="text-sm font-medium text-foreground">
                      {participante.cep || "Não informado"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Cidade</Label>
                    <p className="text-sm font-medium text-foreground">
                      {participante.cidade || "Não informado"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Estado</Label>
                    <p className="text-sm font-medium text-foreground">
                      {participante.estado || "Não informado"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-lg border border-border/50 bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs text-muted-foreground">Registros este ano ({currentYear})</Label>
                    <p className="text-2xl font-bold text-foreground mt-1">{totalThisYear} baldes</p>
                    <p className="text-xs text-muted-foreground">{recordsThisYear.length} registr{recordsThisYear.length !== 1 ? "os" : "o"} / 4</p>
                  </div>
                  <Badge variant="secondary">{recordsThisYear.length}/4</Badge>
                </div>
              </div>

              {/* Legacy history view */}
              {baldes.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Últimos registros</Label>
                  {baldes.slice(0, 3).length > 0 ? (
                    <div className="mt-2 space-y-2">
                      {baldes.slice(0, 3).map((balde) => (
                        <div
                          key={balde.id}
                          className="flex items-center justify-between rounded-lg border border-border/50 p-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground">{balde.trimestre}</p>
                            <p className="text-xs text-muted-foreground">
                              Registrado em {new Date(balde.data_registro).toLocaleDateString("pt-BR")}
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
              )}

            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

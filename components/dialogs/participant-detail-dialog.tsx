import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"
import { type Participante } from "@/lib/mock-data"
import { type Balde } from "@/lib/supabase-queries"
import { useState } from "react"
import { BucketRecordsDialog } from "@/components/dialogs/bucket-records-dialog"

interface ParticipantDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  participante: Participante | null
  baldes?: Balde[]
  onAddBucketRecord?: (data: { quantidade: number; dataRegistro: string }) => void
  onEditBucketRecord?: (baldeId: string, data: { quantidade: number; dataRegistro: string }) => void
  onDeleteBucketRecord?: (baldeId: string) => void
  isLoadingBuckets?: boolean
}

export function ParticipantDetailDialog({
  open,
  onOpenChange,
  participante,
  baldes = [],
  onAddBucketRecord,
  onEditBucketRecord,
  onDeleteBucketRecord,
  isLoadingBuckets = false,
}: ParticipantDetailDialogProps) {
  const [isBucketsDialogOpen, setIsBucketsDialogOpen] = useState(false)

  const currentYear = new Date().getFullYear()
  const recordsThisYear = baldes.filter(b => {
    const recordYear = new Date(b.data_registro).getFullYear()
    return recordYear === currentYear
  })
  const totalThisYear = recordsThisYear.reduce((sum, b) => sum + (b.quantidade || 0), 0)
  return (
    <>
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

              {/* Bucket Management Button */}
              <Button
                onClick={() => setIsBucketsDialogOpen(true)}
                variant="default"
                className="w-full gap-2"
                disabled={isLoadingBuckets}
              >
                <FileText className="h-4 w-4" />
                Gerenciar Registros de Baldes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bucket Records Dialog */}
      {participante && (
        <BucketRecordsDialog
          open={isBucketsDialogOpen}
          onOpenChange={setIsBucketsDialogOpen}
          participante={participante}
          baldes={baldes}
          onAddRecord={onAddBucketRecord || (() => {})}
          onEditRecord={onEditBucketRecord || (() => {})}
          onDeleteRecord={onDeleteBucketRecord || (() => {})}
          isLoading={isLoadingBuckets}
        />
      )}
    </>
  )
}

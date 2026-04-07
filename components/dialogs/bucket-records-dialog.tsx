"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Edit2 } from "lucide-react"
import { type Participante } from "@/lib/mock-data"
import { type Balde } from "@/lib/supabase-queries"
import { BucketRecordForm } from "@/components/dialogs/bucket-record-form"

interface BucketRecordsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  participante: Participante | null
  baldes: Balde[]
  onAddRecord: (data: { quantidade: number; dataRegistro: string }) => void
  onEditRecord: (baldeId: string, data: { quantidade: number; dataRegistro: string }) => void
  onDeleteRecord: (baldeId: string) => void
  isLoading?: boolean
}

export function BucketRecordsDialog({
  open,
  onOpenChange,
  participante,
  baldes,
  onAddRecord,
  onEditRecord,
  onDeleteRecord,
  isLoading = false,
}: BucketRecordsDialogProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingBalde, setEditingBalde] = useState<Balde | null>(null)

  const handleAddRecord = (data: { quantidade: number; dataRegistro: string }) => {
    onAddRecord(data)
    setIsFormOpen(false)
  }

  const handleEditRecord = (data: { quantidade: number; dataRegistro: string }) => {
    if (editingBalde) {
      onEditRecord(editingBalde.id, data)
      setEditingBalde(null)
      setIsFormOpen(false)
    }
  }

  const handleDeleteClick = (baldeId: string) => {
    if (confirm("Tem certeza que deseja deletar este registro?")) {
      onDeleteRecord(baldeId)
    }
  }

  const currentYear = new Date().getFullYear()
  const recordsThisYear = baldes.filter(b => {
    const recordYear = new Date(b.data_registro).getFullYear()
    return recordYear === currentYear
  })

  const entriesByQuarter = {
    Q1: [] as Balde[],
    Q2: [] as Balde[],
    Q3: [] as Balde[],
    Q4: [] as Balde[],
  }

  recordsThisYear.forEach(b => {
    const quarter = b.trimestre?.split('-')[1] || 'Q1'
    if (quarter in entriesByQuarter) {
      entriesByQuarter[quarter as keyof typeof entriesByQuarter].push(b)
    }
  })

  const totalBaldesThisYear = recordsThisYear.reduce((sum, b) => sum + (b.quantidade || 0), 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registros de Baldes</DialogTitle>
          <DialogDescription>
            Gerenciar registros de baldes para <strong>{participante?.nome}</strong> - Turma{" "}
            <strong>{participante?.turma}</strong>
          </DialogDescription>
        </DialogHeader>

        {isFormOpen ? (
          <BucketRecordForm
            initialData={editingBalde ? {
              quantidade: editingBalde.quantidade,
              dataRegistro: editingBalde.data_registro
            } : undefined}
            onSubmit={editingBalde ? handleEditRecord : handleAddRecord}
            onCancel={() => {
              setIsFormOpen(false)
              setEditingBalde(null)
            }}
            isLoading={isLoading}
            isEditing={!!editingBalde}
          />
        ) : (
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total este ano ({currentYear})</p>
                  <p className="text-2xl font-bold text-foreground">{totalBaldesThisYear} baldes</p>
                  <p className="text-xs text-muted-foreground">
                    {recordsThisYear.length} registr{recordsThisYear.length !== 1 ? "os" : "o"}
                  </p>
                </div>
                <Badge variant="secondary" className="text-lg">
                  {recordsThisYear.length}/4
                </Badge>
              </div>
            </div>

            {/* Quarterly View */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {Object.entries(entriesByQuarter).map(([quarter, entries]) => (
                <div key={quarter}>
                  <h3 className="font-semibold text-sm text-foreground mb-2">{quarter} ({currentYear})</h3>
                  {entries.length > 0 ? (
                    <div className="space-y-2">
                      {entries.map((balde) => (
                        <div
                          key={balde.id}
                          className="flex items-center justify-between rounded-lg border border-border/50 p-3 bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground">{balde.quantidade} baldes</p>
                              <Badge variant="outline" className="text-xs">
                                {new Date(balde.data_registro).toLocaleDateString("pt-BR")}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Registrado há{" "}
                              {Math.floor(
                                (new Date().getTime() - new Date(balde.data_registro).getTime()) /
                                  (1000 * 60 * 60 * 24)
                              )}{" "}
                              dias
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingBalde(balde)
                                setIsFormOpen(true)
                              }}
                              disabled={isLoading}
                              className="h-8 w-8 p-0"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteClick(balde.id)}
                              disabled={isLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border/50 p-3 text-center">
                      <p className="text-sm text-muted-foreground">Sem registros</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Historical Records */}
            {baldes.length > recordsThisYear.length && (
              <details className="border-t border-border/50 pt-4">
                <summary className="cursor-pointer text-sm font-semibold text-muted-foreground hover:text-foreground">
                  Registros anteriores ({baldes.length - recordsThisYear.length})
                </summary>
                <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                  {baldes
                    .filter(b => {
                      const recordYear = new Date(b.data_registro).getFullYear()
                      return recordYear !== currentYear
                    })
                    .map((balde) => (
                      <div
                        key={balde.id}
                        className="flex items-center justify-between rounded-lg border border-border/50 p-3 bg-muted/20 text-sm"
                      >
                        <div>
                          <p className="text-foreground">{balde.quantidade} baldes</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(balde.data_registro).toLocaleDateString("pt-BR")} - {balde.trimestre}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteClick(balde.id)}
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 border-t border-border/50 pt-4">
              {!isFormOpen && recordsThisYear.length < 4 && (
                <Button variant="default" onClick={() => setIsFormOpen(true)} disabled={isLoading}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Registro
                </Button>
              )}
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

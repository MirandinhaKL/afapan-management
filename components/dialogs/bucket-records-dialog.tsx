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
  onAddRecord: (data: { quantidade: number; dataRegistro: string; trimestre?: string }) => void
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

  const handleAddRecord = (data: { quantidade: number; dataRegistro: string; trimestre?: string }) => {
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

  const entriesByQuarter = {
    Q1: [] as Balde[],
    Q2: [] as Balde[],
    Q3: [] as Balde[],
    Q4: [] as Balde[],
  }

  baldes.forEach(b => {
    const quarter = b.trimestre?.split('-')[1] || 'Q1'
    if (quarter in entriesByQuarter) {
      entriesByQuarter[quarter as keyof typeof entriesByQuarter].push(b)
    }
  })

  const totalBaldes = baldes.reduce((sum, b) => sum + (b.quantidade || 0), 0)

  // Determinar o próximo trimestre disponível (primeira vaga livre)
  const getNextAvailableQuarter = (): string | null => {
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'] as const
    for (const quarter of quarters) {
      if (entriesByQuarter[quarter].length === 0) {
        return quarter
      }
    }
    return null
  }

  const nextQuarter = getNextAvailableQuarter()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>Registros de Baldes</DialogTitle>
          <DialogDescription>
            Gerenciar registros de baldes para <strong>{participante?.nome}</strong> - Turma{" "}
            <strong>{participante?.turma}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-4">
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
              autoTrimestre={!editingBalde ? nextQuarter || undefined : undefined}
            />
          ) : (
            <div className="space-y-6">
              {/* Summary Card */}
              <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de registros trimestrais</p>
                    <p className="text-2xl font-bold text-foreground">{totalBaldes} baldes</p>
                    <p className="text-xs text-muted-foreground">
                      {baldes.length} registr{baldes.length !== 1 ? "os" : "o"}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-lg">
                    {baldes.length}/4
                  </Badge>
                </div>
              </div>

              {/* Quarterly View with Scroll */}
              <div className="border border-border/50 rounded-lg bg-muted/20 overflow-hidden max-h-80">
                <div className="space-y-4 p-4 overflow-y-auto max-h-full">
                  {Object.entries(entriesByQuarter).map(([quarter, entries]) => (
                    <div key={quarter}>
                      <h3 className="font-semibold text-sm text-foreground mb-2">{quarter}</h3>
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
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons - Sticky Footer */}
        <div className="shrink-0 flex gap-2 border-t border-border/50 pt-4 mt-4">
          {!isFormOpen && baldes.length < 4 && (
            <Button variant="default" onClick={() => setIsFormOpen(true)} disabled={isLoading}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Registro
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

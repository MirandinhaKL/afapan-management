import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"

interface CreateTurmaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  nome: string
  onNomeChange: (valor: string) => void
  descricao: string
  onDescricaoChange: (valor: string) => void
  datas: { [key: string]: string }
  onDataChange: (periodo: string, data: string) => void
  onCreateTurma: () => Promise<boolean | void> | boolean | void
  isCreating?: boolean
}

export function CreateTurmaDialog({
  open,
  onOpenChange,
  nome,
  onNomeChange,
  descricao,
  onDescricaoChange,
  datas,
  onDataChange,
  onCreateTurma,
  isCreating = false,
}: CreateTurmaDialogProps) {
  const [submitted, setSubmitted] = useState(false)
  const periodos = [
    { key: "data1", label: "Periodo 1", numero: 1 },
    { key: "data2", label: "Periodo 2", numero: 2 },
    { key: "data3", label: "Periodo 3", numero: 3 },
    { key: "data4", label: "Periodo 4", numero: 4 },
  ]

  const nomeInvalido = submitted && !nome.trim()
  const datasInvalidas = submitted && periodos.some((periodo) => !datas[periodo.key]?.trim())

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSubmitted(false)
    }
    onOpenChange(newOpen)
  }

  const handleCreate = async () => {
    setSubmitted(true)
    await onCreateTurma()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-screen overflow-y-auto max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar nova turma</DialogTitle>
          <DialogDescription>
            Crie uma turma para organizar participantes da compostagem e defina as 4 datas de coleta de dados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="turma-name">Nome da turma *</Label>
            <Input
              id="turma-name"
              value={nome}
              onChange={(event) => onNomeChange(event.target.value)}
              placeholder="Ex: Turma Centro"
              aria-invalid={nomeInvalido}
            />
            {nomeInvalido && (
              <p className="text-xs text-destructive">Informe o nome da turma.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="turma-description">Descricao</Label>
            <Input
              id="turma-description"
              value={descricao}
              onChange={(event) => onDescricaoChange(event.target.value)}
              placeholder="Descricao opcional da turma"
            />
          </div>

          <div className="border-t pt-4">
            <Label className="mb-4 flex items-center gap-2">
              <Calendar size={16} />
              <span>Datas de monitoramento de baldes *</span>
            </Label>
            {datasInvalidas && (
              <p className="mb-3 text-xs text-destructive">
                Informe as 4 datas de monitoramento antes de criar a turma.
              </p>
            )}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {periodos.map((periodo) => (
                <div key={periodo.key} className="space-y-1">
                  <Label htmlFor={`data-${periodo.numero}`} className="text-sm">
                    {periodo.label}
                  </Label>
                  <Input
                    id={`data-${periodo.numero}`}
                    type="date"
                    value={datas[periodo.key] || ""}
                    onChange={(event) => onDataChange(periodo.key, event.target.value)}
                    aria-invalid={submitted && !datas[periodo.key]?.trim()}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isCreating}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? "Criando..." : "Criar Turma"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

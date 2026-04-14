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
  onCreateTurma: () => void
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
}: CreateTurmaDialogProps) {
  const periodos = [
    { key: 'data1', label: 'Período 1 (Jan-Mar)', numero: 1 },
    { key: 'data2', label: 'Período 2 (Apr-Jun)', numero: 2 },
    { key: 'data3', label: 'Período 3 (Jul-Sep)', numero: 3 },
    { key: 'data4', label: 'Período 4 (Oct-Dec)', numero: 4 },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              onChange={(e) => onNomeChange(e.target.value)}
              placeholder="Ex: Turma Centro"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="turma-description">Descrição</Label>
            <Input
              id="turma-description"
              value={descricao}
              onChange={(e) => onDescricaoChange(e.target.value)}
              placeholder="Descrição opcional da turma"
            />
          </div>

          <div className="border-t pt-4">
            <Label className="flex items-center gap-2 mb-4">
              <Calendar size={16} />
              <span>Datas de monitoramento de baldes *</span>
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {periodos.map((periodo) => (
                <div key={periodo.key} className="space-y-1">
                  <Label htmlFor={`data-${periodo.numero}`} className="text-sm">
                    {periodo.label}
                  </Label>
                  <Input
                    id={`data-${periodo.numero}`}
                    type="date"
                    value={datas[periodo.key] || ''}
                    onChange={(e) => onDataChange(periodo.key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onCreateTurma}>Criar Turma</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

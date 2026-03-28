import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface CreateTurmaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  nome: string
  onNomeChange: (valor: string) => void
  descricao: string
  onDescricaoChange: (valor: string) => void
  onCreateTurma: () => void
}

export function CreateTurmaDialog({
  open,
  onOpenChange,
  nome,
  onNomeChange,
  descricao,
  onDescricaoChange,
  onCreateTurma,
}: CreateTurmaDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar nova turma</DialogTitle>
          <DialogDescription>
            Crie uma turma para organizar participantes da compostagem.
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

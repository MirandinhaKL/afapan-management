import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { type Participante } from "@/lib/mock-data"

interface RegisterBucketsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  participante: Participante | null
  quantidade: string
  onQuantidadeChange: (valor: string) => void
  onRegister: () => void
  trimestre: string
}

export function RegisterBucketsDialog({
  open,
  onOpenChange,
  participante,
  quantidade,
  onQuantidadeChange,
  onRegister,
  trimestre,
}: RegisterBucketsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar baldes</DialogTitle>
          <DialogDescription>
            Registrar manualmente a quantidade de baldes para{" "}
            <strong>{participante?.nome}</strong> no trimestre {trimestre}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="quantidade-baldes">Quantidade de baldes</Label>
            <Input
              id="quantidade-baldes"
              type="number"
              min="0"
              value={quantidade}
              onChange={(e) => onQuantidadeChange(e.target.value)}
              placeholder="Ex: 8"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onRegister}>Registrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

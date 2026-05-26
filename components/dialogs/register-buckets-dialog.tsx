import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type Participante } from "@/lib/mock-data"

interface RegisterBucketsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  participante: Participante | null
  quantidade: string
  onQuantidadeChange: (valor: string) => void
  registroIndex: number
  onRegistroChange: (index: number) => void
  onRegister: () => void
  trimestre: string
}

export function RegisterBucketsDialog({
  open,
  onOpenChange,
  participante,
  quantidade,
  onQuantidadeChange,
  registroIndex,
  onRegistroChange,
  onRegister,
}: RegisterBucketsDialogProps) {
  const registros = (() => {
    const slots: Array<Participante["baldes"][number] | undefined> = Array.from(
      { length: 4 },
      () => undefined
    )
    const registrosOrdenados = [...(participante?.baldes || [])].sort((a, b) => {
      const dataA = a.dataRegistro || a.trimestre
      const dataB = b.dataRegistro || b.trimestre
      return `${dataA}-${a.trimestre}`.localeCompare(`${dataB}-${b.trimestre}`)
    })
    const registrosSemSlot: Participante["baldes"] = []

    registrosOrdenados.forEach((registro) => {
      const slotMatch = registro.trimestre.match(/-R([1-4])$/)
      const slotIndex = slotMatch ? Number(slotMatch[1]) - 1 : -1

      if (slotIndex >= 0 && !slots[slotIndex]) {
        slots[slotIndex] = registro
      } else {
        registrosSemSlot.push(registro)
      }
    })

    registrosSemSlot.forEach((registro) => {
      const slotIndex = slots.findIndex((slot) => !slot)
      if (slotIndex >= 0) {
        slots[slotIndex] = registro
      }
    })

    return slots.map((registro, index) => ({
      index,
      quantidade: registro?.quantidade,
    }))
  })()

  const handleRegistroChange = (value: string) => {
    const index = Number(value)
    const registro = registros[index]

    onRegistroChange(index)
    onQuantidadeChange(registro.quantidade !== undefined ? String(registro.quantidade) : "")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar baldes</DialogTitle>
          <DialogDescription>
            Registrar manualmente a quantidade de baldes para{" "}
            <strong>{participante?.nome}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="registro-baldes">Registro da campanha</Label>
            <Select value={String(registroIndex)} onValueChange={handleRegistroChange}>
              <SelectTrigger id="registro-baldes">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {registros.map((registro) => (
                  <SelectItem key={registro.index} value={String(registro.index)}>
                    Registro {registro.index + 1}
                    {registro.quantidade !== undefined ? ` - ${registro.quantidade} baldes` : " - sem valor"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
          <Button onClick={onRegister}>Salvar registro {registroIndex + 1}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

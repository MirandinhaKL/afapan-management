import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { type Participante } from "@/lib/mock-data"
import { type TurmaBucketPeriod } from "@/lib/supabase-queries"
import { toast } from "sonner"

interface RegistroForm {
  index: number
  quantidade: string
  data: string
  periodo: TurmaBucketPeriod | undefined
}

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
  turmaPeriodos?: TurmaBucketPeriod[]
  onSalvarTodos?: (registros: RegistroForm[]) => Promise<void>
}

function getRegistrosCampanhaSlots(participante: Participante) {
  const slots: Array<Participante["baldes"][number] | undefined> = Array.from(
    { length: 4 },
    () => undefined
  )
  const registrosSemSlot: Participante["baldes"] = []

  ;[...participante.baldes]
    .sort((a, b) => {
      const dataA = a.dataRegistro || a.trimestre
      const dataB = b.dataRegistro || b.trimestre
      return `${dataA}-${a.trimestre}`.localeCompare(`${dataB}-${b.trimestre}`)
    })
    .forEach((registro) => {
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

  return slots
}

export function RegisterBucketsDialog({
  open,
  onOpenChange,
  participante,
  turmaPeriodos = [],
  onSalvarTodos,
}: RegisterBucketsDialogProps) {
  const [registros, setRegistros] = useState<RegistroForm[]>([])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!open || !participante) return

    const registrosExistentes = getRegistrosCampanhaSlots(participante)

    setRegistros(
      Array.from({ length: 4 }, (_, index) => {
        const periodo = turmaPeriodos[index]
        const registroExistente = registrosExistentes[index]

        return {
          index,
          quantidade: registroExistente?.quantidade.toString() || "",
          data: registroExistente?.dataRegistro || periodo?.data_monitoramento || "",
          periodo,
        }
      })
    )
  }, [open, participante, turmaPeriodos])

  const handleQuantidadeChange = (index: number, valor: string) => {
    setRegistros((prev) =>
      prev.map((registro) =>
        registro.index === index ? { ...registro, quantidade: valor } : registro
      )
    )
  }

  const handleSalvarTodos = async () => {
    const registrosPreenchidos = registros.filter((registro) => registro.quantidade.trim() !== "")

    if (registrosPreenchidos.length === 0) {
      toast.error("Preencha pelo menos uma quantidade de baldes")
      return
    }

    for (const registro of registrosPreenchidos) {
      const quantidade = Number(registro.quantidade)
      if (!Number.isInteger(quantidade) || quantidade < 0) {
        toast.error(`Quantidade invalida no registro ${registro.index + 1}`)
        return
      }
    }

    if (!onSalvarTodos) return

    try {
      setIsSaving(true)
      await onSalvarTodos(registros)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Registrar Baldes</DialogTitle>
          <DialogDescription>
            Informe os registros de baldes de <strong>{participante?.nome}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="hidden grid-cols-[110px_1fr_140px] gap-3 px-1 text-xs font-medium text-muted-foreground sm:grid">
            <span>Registro</span>
            <span>Data</span>
            <span>Baldes</span>
          </div>

          {registros.map((registro) => (
            <div
              key={registro.index}
              className="grid gap-2 rounded-md border border-border/60 p-3 sm:grid-cols-[110px_1fr_140px] sm:items-end sm:gap-3"
            >
              <div>
                <Label className="text-xs text-muted-foreground sm:hidden">Registro</Label>
                <p className="text-sm font-medium text-foreground">Registro {registro.index + 1}</p>
                {registro.periodo?.periodo_label && (
                  <p className="text-xs text-muted-foreground">{registro.periodo.periodo_label}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor={`data-${registro.index}`} className="text-xs text-muted-foreground sm:hidden">
                  Data
                </Label>
                <Input
                  id={`data-${registro.index}`}
                  type={registro.data ? "date" : "text"}
                  value={registro.data || "Sem data configurada"}
                  disabled
                  className="h-9 bg-muted"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor={`quantidade-${registro.index}`} className="text-xs text-muted-foreground sm:hidden">
                  Baldes
                </Label>
                <Input
                  id={`quantidade-${registro.index}`}
                  type="number"
                  min="0"
                  value={registro.quantidade}
                  onChange={(event) => handleQuantidadeChange(registro.index, event.target.value)}
                  placeholder="0"
                  className="h-9"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSalvarTodos} disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar registros"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

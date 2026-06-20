import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"
import { hasFourDigitYear } from "@/lib/date-utils"

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
    { key: "data1", label: "Período 1", numero: 1 },
    { key: "data2", label: "Período 2", numero: 2 },
    { key: "data3", label: "Período 3", numero: 3 },
    { key: "data4", label: "Período 4", numero: 4 },
  ]
  const datasMonitoramento = periodos.map((periodo) => datas[periodo.key]?.trim() || "")
  const datasPreenchidas = datasMonitoramento.every((data) => data !== "")
  const datasComAnoValido = datasMonitoramento.every((data) => !data || hasFourDigitYear(data))
  const datasEmOrdem = datasMonitoramento.every((data, index) => (
    index === 0 || data > datasMonitoramento[index - 1]
  ))

  const nomeInvalido = submitted && !nome.trim()
  const datasInvalidas = submitted && !datasPreenchidas
  const anosInvalidos = submitted && datasPreenchidas && !datasComAnoValido
  const datasForaDeOrdem = submitted && datasPreenchidas && !datasEmOrdem

  useEffect(() => {
    if (open) {
      setSubmitted(false)
    }
  }, [open])

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSubmitted(false)
    }
    onOpenChange(newOpen)
  }

  const handleCreate = async () => {
    setSubmitted(true)
    if (!nome.trim() || !datasPreenchidas || !datasComAnoValido || !datasEmOrdem) {
      return
    }
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
            <Label htmlFor="turma-description">Descrição</Label>
            <Input
              id="turma-description"
              value={descricao}
              onChange={(event) => onDescricaoChange(event.target.value)}
              placeholder="Descrição opcional da turma"
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
            {datasForaDeOrdem && (
              <p className="mb-3 text-xs text-destructive">
                As datas devem estar em ordem crescente: Período 1, Período 2, Período 3 e Período 4.
              </p>
            )}
            {anosInvalidos && (
              <p className="mb-3 text-xs text-destructive">
                O ano deve possuir exatamente 4 dígitos.
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
                    max="9999-12-31"
                    value={datas[periodo.key] || ""}
                    onChange={(event) => {
                      const value = event.target.value
                      if (!value || hasFourDigitYear(value)) {
                        onDataChange(periodo.key, value)
                      } else {
                        event.currentTarget.value = datas[periodo.key] || ""
                      }
                    }}
                    aria-invalid={submitted && (
                      !datas[periodo.key]?.trim()
                      || !hasFourDigitYear(datas[periodo.key])
                      || datasForaDeOrdem
                    )}
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

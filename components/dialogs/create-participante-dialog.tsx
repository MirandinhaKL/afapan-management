import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { type Turma, type TurmaCompostagem } from "@/lib/mock-data"

interface CreateParticipanteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  turmas: Turma[]
  turmasCompostagem: (TurmaCompostagem & { participantes: any[] })[]
  currentTurmaFilter: string
  onCreateParticipante: (data: {
    nome: string
    telefone: string
    email: string
    turma: string
    turmaCompostagem: string
  }) => void
}

export function CreateParticipanteDialog({
  open,
  onOpenChange,
  turmas,
  turmasCompostagem,
  currentTurmaFilter,
  onCreateParticipante,
}: CreateParticipanteDialogProps) {
  const [nome, setNome] = useState("")
  const [telefone, setTelefone] = useState("")
  const [email, setEmail] = useState("")
  const [turma, setTurma] = useState("")

  const handleCreate = () => {
    if (!nome.trim() || !telefone.trim() || !email.trim() || !turma) {
      return
    }

    onCreateParticipante({
      nome: nome.trim(),
      telefone: telefone.trim(),
      email: email.trim(),
      turma: currentTurmaFilter,
      turmaCompostagem: turma,
    })

    setNome("")
    setTelefone("")
    setEmail("")
    setTurma("")
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setNome("")
      setTelefone("")
      setEmail("")
      setTurma("")
    }
    onOpenChange(newOpen)
  }

  const isFormValid = nome.trim() && telefone.trim() && email.trim() && turma

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo participante</DialogTitle>
          <DialogDescription>
            Adicione um novo participante ao programa de compostagem.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              placeholder="Nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              placeholder="(11) 98765-4321"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              placeholder="email@example.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="turma">Turma de Compostagem</Label>
            <Select value={turma} onValueChange={setTurma}>
              <SelectTrigger id="turma">
                <SelectValue placeholder="Selecione uma turma de compostagem" />
              </SelectTrigger>
              <SelectContent>
                {turmasCompostagem.length > 0 ? (
                  turmasCompostagem.map((t) => (
                    <SelectItem key={t.id} value={t.nome}>
                      {t.nome}
                      {t.descricao && ` - ${t.descricao}`}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>
                    Nenhuma turma de compostagem disponível
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-4">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={!isFormValid}>
            Criar participante
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

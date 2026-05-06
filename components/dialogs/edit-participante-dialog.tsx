import { useState, useEffect } from "react"
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
import { type Participante, type Turma } from "@/lib/mock-data"

interface EditParticipanteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  participante: Participante | null
  turmas: Turma[]
  onEditParticipante: (data: {
    nome: string
    telefone: string
    email: string
    turma: string
    endereco?: string
    bairro?: string
    cidade?: string
    estado?: string
    cep?: string
  }) => void
}

export function EditParticipanteDialog({
  open,
  onOpenChange,
  participante,
  turmas,
  onEditParticipante,
}: EditParticipanteDialogProps) {
  const [nome, setNome] = useState("")
  const [telefone, setTelefone] = useState("")
  const [email, setEmail] = useState("")
  const [turma, setTurma] = useState("")
  const [endereco, setEndereco] = useState("")
  const [bairro, setBairro] = useState("")
  const [cidade, setCidade] = useState("")
  const [estado, setEstado] = useState("")
  const [cep, setCep] = useState("")

  useEffect(() => {
    if (participante && open) {
      setNome(participante.nome)
      setTelefone(participante.telefone)
      setEmail(participante.email)
      setTurma(participante.turma)
      setEndereco(participante.endereco || "")
      setBairro(participante.bairro || "")
      setCidade(participante.cidade || "")
      setEstado(participante.estado || "")
      setCep(participante.cep || "")
    }
  }, [participante, open])

  const handleSave = () => {
    if (!nome.trim() || !telefone.trim() || !email.trim() || !turma) {
      return
    }

    onEditParticipante({
      nome: nome.trim(),
      telefone: telefone.trim(),
      email: email.trim(),
      turma,
      endereco: endereco.trim() || undefined,
      bairro: bairro.trim() || undefined,
      cidade: cidade.trim() || undefined,
      estado: estado.trim() || undefined,
      cep: cep.trim() || undefined,
    })

    handleOpenChange(false)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setNome("")
      setTelefone("")
      setEmail("")
      setTurma("")
      setEndereco("")
      setBairro("")
      setCidade("")
      setEstado("")
      setCep("")
    }
    onOpenChange(newOpen)
  }

  const isFormValid = nome.trim() && telefone.trim() && email.trim() && turma

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar participante</DialogTitle>
          <DialogDescription>
            Atualize as informações do participante.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Dados Pessoais */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">DADOS PESSOAIS</h3>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  placeholder="Nome completo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
              </div>
            </div>
          </div>

          {/* Turma */}
          <div className="space-y-2">
            <Label htmlFor="turma">Turma</Label>
            <Select value={turma} onValueChange={setTurma}>
              <SelectTrigger id="turma">
                <SelectValue placeholder="Selecione uma turma" />
              </SelectTrigger>
              <SelectContent>
                {turmas.length > 0 ? (
                  turmas.map((t) => (
                    <SelectItem key={t.id} value={t.nome}>
                      {t.nome}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>
                    Nenhuma turma disponível
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Endereço */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">ENDEREÇO</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="endereco">Rua/Avenida</Label>
                  <Input
                    id="endereco"
                    placeholder="Endereço"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    placeholder="Bairro"
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    placeholder="Cidade"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    placeholder="SP"
                    maxLength={2}
                    value={estado}
                    onChange={(e) => setEstado(e.target.value.toUpperCase())}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    placeholder="12345-678"
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-4">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!isFormValid}>
            Salvar alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

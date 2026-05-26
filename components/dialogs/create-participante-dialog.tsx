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
import { toast } from "sonner"
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
    endereco?: string
    bairro?: string
    cidade?: string
    estado?: string
    cep?: string
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
  const [telefoneTouched, setTelefoneTouched] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)
  const [turma, setTurma] = useState("")
  const [endereco, setEndereco] = useState("")
  const [bairro, setBairro] = useState("")
  const [cidade, setCidade] = useState("Farroupilha")
  const [estado, setEstado] = useState("RS")
  const [cep, setCep] = useState("")

  const getTelefoneDigits = (valor: string) => {
    const digits = valor.replace(/\D/g, "")

    if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) {
      return digits.slice(2)
    }

    return digits
  }

  const formatTelefone = (valor: string) => {
    const digits = getTelefoneDigits(valor).slice(0, 11)

    if (digits.length <= 2) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    if (digits.length <= 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
    }

    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }

  const isValidTelefone = (valor: string) => {
    const digits = getTelefoneDigits(valor)

    if (digits.length !== 10 && digits.length !== 11) return false
    if (digits.startsWith("00")) return false

    return true
  }

  const isValidEmail = (valor: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim())
  }

  const telefoneInvalido = telefoneTouched && telefone.trim() !== "" && !isValidTelefone(telefone)
  const emailInvalido = emailTouched && email.trim() !== "" && !isValidEmail(email)

  const handleCreate = () => {
    // Validação detalhada
    if (!nome.trim()) {
      toast.error("Nome é obrigatório")
      return
    }
    if (!telefone.trim()) {
      toast.error("Telefone é obrigatório")
      return
    }
    if (!email.trim()) {
      toast.error("E-mail é obrigatório")
      return
    }
    if (!isValidTelefone(telefone)) {
      toast.error("Telefone invalido", {
        description: "Informe um telefone com DDD, com 10 ou 11 digitos.",
      })
      return
    }
    if (!isValidEmail(email)) {
      toast.error("E-mail invalido", {
        description: "Informe um e-mail no formato nome@dominio.com.",
      })
      return
    }
    if (!turma) {
      toast.error("Turma de Compostagem é obrigatória")
      return
    }

    console.log("Criando participante:", {
      nome: nome.trim(),
      telefone: telefone.trim(),
      email: email.trim(),
      turma: currentTurmaFilter,
      turmaCompostagem: turma,
    })

    onCreateParticipante({
      nome: nome.trim(),
      telefone: telefone.trim(),
      email: email.trim(),
      turma: currentTurmaFilter,
      turmaCompostagem: turma,
      endereco: endereco.trim() || undefined,
      bairro: bairro.trim() || undefined,
      cidade: cidade.trim() || undefined,
      estado: estado.trim() || undefined,
      cep: cep.trim() || undefined,
    })

    setNome("")
    setTelefone("")
    setEmail("")
    setTelefoneTouched(false)
    setEmailTouched(false)
    setTurma("")
    setEndereco("")
    setBairro("")
    setCidade("Farroupilha")
    setEstado("RS")
    setCep("")
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setNome("")
      setTelefone("")
      setEmail("")
      setTelefoneTouched(false)
      setEmailTouched(false)
      setTurma("")
      setEndereco("")
      setBairro("")
      setCidade("Farroupilha")
      setEstado("RS")
      setCep("95180-000")
    }
    onOpenChange(newOpen)
  }

  const isFormValid =
    nome.trim() &&
    telefone.trim() &&
    email.trim() &&
    turma &&
    isValidTelefone(telefone) &&
    isValidEmail(email)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo participante</DialogTitle>
          <DialogDescription>
            Adicione um novo participante ao programa de compostagem.
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
                    type="tel"
                    inputMode="tel"
                    value={telefone}
                    onChange={(e) => setTelefone(formatTelefone(e.target.value))}
                    onBlur={() => setTelefoneTouched(true)}
                    aria-invalid={telefoneInvalido}
                  />
                  {telefoneInvalido && (
                    <p className="text-xs text-destructive">
                      Informe DDD + telefone, com 10 ou 11 digitos.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    placeholder="email@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setEmailTouched(true)}
                    aria-invalid={emailInvalido}
                  />
                  {emailInvalido && (
                    <p className="text-xs text-destructive">
                      Informe um e-mail valido, como nome@dominio.com.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Turma */}
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

          {/* Endereço */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">ENDEREÇO</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    placeholder="Rua Exemplo, 123"
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
          <Button 
            onClick={handleCreate} 
            disabled={!isFormValid}
            className={!isFormValid ? "opacity-50 cursor-not-allowed" : ""}
          >
            Criar participante
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

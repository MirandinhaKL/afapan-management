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
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
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
  const [telefoneTouched, setTelefoneTouched] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)
  const [turma, setTurma] = useState("")
  const [endereco, setEndereco] = useState("")
  const [bairro, setBairro] = useState("")
  const [cidade, setCidade] = useState("")
  const [estado, setEstado] = useState("")
  const [cep, setCep] = useState("")
  const [cepTouched, setCepTouched] = useState(false)

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

  const formatCep = (valor: string) => {
    const digits = valor.replace(/\D/g, "").slice(0, 8)

    if (digits.length <= 5) return digits
    return `${digits.slice(0, 5)}-${digits.slice(5)}`
  }

  const isValidCep = (valor: string) => {
    const digits = valor.replace(/\D/g, "")
    return digits.length === 8
  }

  const telefoneInvalido = telefoneTouched && telefone.trim() !== "" && !isValidTelefone(telefone)
  const emailInvalido = emailTouched && email.trim() !== "" && !isValidEmail(email)
  const cepInvalido = cepTouched && cep.trim() !== "" && !isValidCep(cep)

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
      setTelefoneTouched(false)
      setEmailTouched(false)
      setCepTouched(false)
    }
  }, [participante, open])

  const handleSave = () => {
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
      toast.error("Telefone inválido", {
        description: "Informe um telefone com DDD, com 10 ou 11 dígitos.",
      })
      return
    }
    if (!isValidEmail(email)) {
      toast.error("E-mail inválido", {
        description: "Informe um e-mail no formato nome@dominio.com.",
      })
      return
    }
    if (!turma) {
      toast.error("Turma é obrigatória")
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
      setTelefoneTouched(false)
      setEmailTouched(false)
      setCepTouched(false)
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
          <DialogTitle>Editar participante</DialogTitle>
          <DialogDescription>
            Atualize as informações do participante.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Dados Pessoais */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">DADOS PESSOAIS</h3>
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
                        Informe DDD + telefone, com 10 ou 11 dígitos.
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
                        Informe um e-mail válido, como nome@dominio.com.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Turma */}
              <div className="space-y-2 mt-4">
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
            </CardContent>
          </Card>

          {/* Endereço */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">ENDEREÇO</h3>
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
                      placeholder="95180-072"
                      value={cep}
                      onChange={(e) => setCep(formatCep(e.target.value))}
                      onBlur={() => setCepTouched(true)}
                      aria-invalid={cepInvalido}
                    />
                    {cepInvalido && (
                      <p className="text-xs text-destructive">
                        CEP inválido. Use o formato XXXXX-XXX (8 dígitos).
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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

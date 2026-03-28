"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type Participante, type Turma, type TurmaCompostagem } from "@/lib/mock-data"
import { fetchParticipantesWithBaldes, fetchTurmas, createOrUpdateBalde, fetchTurmasWithParticipantes, createTurmaCompostagem, updateTurmaCompostagem, deleteTurmaCompostagem, addParticipanteToTurma, removeParticipanteFromTurma } from "@/lib/supabase-queries"
import { ExportButton } from "@/components/export-button"
import { exportPDF, exportCSV } from "@/lib/export-utils"
import {
  Search,
  Send,
  CheckCircle2,
  Clock,
  Users,
  Trash2,
  Filter,
  Eye,
  Recycle,
  Plus,
  UserPlus,
  UserMinus,
  Group,
} from "lucide-react"
import { toast } from "sonner"

const TRIMESTRE_ATUAL = "2026-Q1"

export function CompostagemPage() {
  const [participantes, setParticipantes] = useState<Participante[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [turmasCompostagem, setTurmasCompostagem] = useState<(TurmaCompostagem & { participantes: Participante[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"todos" | "preenchido" | "pendente">("todos")
  const [turmaFilter, setTurmaFilter] = useState<string>("")
  const [selectedParticipante, setSelectedParticipante] = useState<Participante | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [registerQuantidade, setRegisterQuantidade] = useState("")

  // Group management states
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [newGroupDescription, setNewGroupDescription] = useState("")
  const [selectedGroup, setSelectedGroup] = useState<(Grupo & { participantes: Participante[] }) | null>(null)
  const [isGroupDetailOpen, setIsGroupDetailOpen] = useState(false)
  const [isAddParticipantOpen, setIsAddParticipantOpen] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [participantesData, turmasData, turmasCompostagemData] = await Promise.all([
          fetchParticipantesWithBaldes(),
          fetchTurmas(),
          fetchTurmasWithParticipantes()
        ])
        setParticipantes(participantesData)
        setTurmas(turmasData)
        setTurmasCompostagem(turmasCompostagemData)
        if (turmasData.length > 0) {
          setTurmaFilter(turmasData[0].semestre)
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
        toast.error('Erro ao carregar dados do Supabase')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const filteredParticipantes = useMemo(() => {
    return participantes
      .filter((p) => p.turma === turmaFilter)
      .filter(
        (p) =>
          p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.telefone.includes(searchTerm)
      )
      .filter((p) => {
        if (statusFilter === "todos") return true
        const temRegistro = p.baldes.some((b) => b.trimestre === TRIMESTRE_ATUAL)
        return statusFilter === "preenchido" ? temRegistro : !temRegistro
      })
  }, [participantes, searchTerm, statusFilter, turmaFilter])

  const stats = useMemo(() => {
    const turmaParticipantes = participantes.filter((p) => p.turma === turmaFilter)
    const preenchidos = turmaParticipantes.filter((p) =>
      p.baldes.some((b) => b.trimestre === TRIMESTRE_ATUAL)
    )
    const totalBaldes = preenchidos.reduce((acc, p) => {
      const balde = p.baldes.find((b) => b.trimestre === TRIMESTRE_ATUAL)
      return acc + (balde?.quantidade || 0)
    }, 0)

    return {
      total: turmaParticipantes.length,
      preenchidos: preenchidos.length,
      pendentes: turmaParticipantes.length - preenchidos.length,
      totalBaldes,
    }
  }, [participantes, turmaFilter])

  const getStatus = (participante: Participante) => {
    return participante.baldes.some((b) => b.trimestre === TRIMESTRE_ATUAL)
  }

  const handleGerarLink = (participante: Participante) => {
    const link = `https://tally.so/r/compostagem?nome=${encodeURIComponent(participante.nome)}&turma=${participante.turma}&trimestre=${TRIMESTRE_ATUAL}`
    const mensagem = `Ola ${participante.nome.split(" ")[0]}! Preencha o formulario de compostagem do trimestre: ${link}`
    const whatsappUrl = `https://wa.me/55${participante.telefone.replace(/\D/g, "")}?text=${encodeURIComponent(mensagem)}`

    window.open(whatsappUrl, "_blank")
    toast.success(`Link gerado para ${participante.nome}`, {
      description: "A janela do WhatsApp foi aberta.",
    })
  }

  const handleRegistrarManual = async () => {
    if (!selectedParticipante || !registerQuantidade) {
      toast.error("Informe a quantidade de baldes")
      return
    }

    const qtd = parseInt(registerQuantidade)
    if (isNaN(qtd) || qtd < 0) {
      toast.error("Quantidade inválida")
      return
    }

    try {
      await createOrUpdateBalde(selectedParticipante.id, TRIMESTRE_ATUAL, qtd)

      // Update local state
      setParticipantes((prev) =>
        prev.map((p) => {
          if (p.id !== selectedParticipante.id) return p
          const baldesAtualizados = p.baldes.filter((b) => b.trimestre !== TRIMESTRE_ATUAL)
          baldesAtualizados.push({
            trimestre: TRIMESTRE_ATUAL,
            quantidade: qtd,
            dataRegistro: new Date().toISOString().split("T")[0],
          })
          return { ...p, baldes: baldesAtualizados }
        })
      )

      toast.success(`Registro salvo para ${selectedParticipante.nome}`, {
        description: `${qtd} baldes registrados para ${TRIMESTRE_ATUAL}.`,
      })
      setIsRegisterOpen(false)
      setRegisterQuantidade("")
    } catch (error) {
      console.error('Erro ao registrar baldes:', error)
      toast.error('Erro ao salvar registro')
    }
  }

  // Turma management functions
  const handleCreateTurma = async () => {
    if (!newGroupName.trim()) {
      toast.error("Nome da turma é obrigatório")
      return
    }

    try {
      const newTurma = await createTurmaCompostagem({
        nome: newGroupName.trim(),
        descricao: newGroupDescription.trim() || undefined,
        ativo: true
      })

      setTurmasCompostagem(prev => [...prev, { ...newTurma, participantes: [] }])
      toast.success(`Turma "${newTurma.nome}" criada com sucesso`)
      setIsCreateGroupOpen(false)
      setNewGroupName("")
      setNewGroupDescription("")
    } catch (error) {
      console.error('Erro ao criar turma:', error)
      toast.error('Erro ao criar turma')
    }
  }

  const handleDeleteTurma = async (turmaId: string) => {
    try {
      await deleteTurmaCompostagem(turmaId)
      setTurmasCompostagem(prev => prev.filter(t => t.id !== turmaId))
      toast.success('Turma deletada com sucesso')
    } catch (error) {
      console.error('Erro ao deletar turma:', error)
      toast.error('Erro ao deletar turma')
    }
  }

  const handleAddParticipantToTurma = async (participanteId: string) => {
    if (!selectedGroup) return

    try {
      await addParticipanteToTurma(participanteId, selectedGroup.id)
      
      const participante = participantes.find(p => p.id === participanteId)
      if (participante) {
        setTurmasCompostagem(prev => prev.map(t => 
          t.id === selectedGroup.id 
            ? { ...t, participantes: [...t.participantes, participante] }
            : t
        ))
        toast.success(`${participante.nome} adicionado à turma`)
      }
      setIsAddParticipantOpen(false)
    } catch (error) {
      console.error('Erro ao adicionar participante:', error)
      toast.error('Erro ao adicionar participante')
    }
  }

  const handleRemoveParticipantFromTurma = async (participanteId: string, turmaId: string) => {
    try {
      await removeParticipanteFromTurma(participanteId, turmaId)
      
      setTurmasCompostagem(prev => prev.map(t => 
        t.id === turmaId 
          ? { ...t, participantes: t.participantes.filter(p => p.id !== participanteId) }
          : t
      ))
      toast.success('Participante removido da turma')
    } catch (error) {
      console.error('Erro ao remover participante:', error)
      toast.error('Erro ao remover participante')
    }
  }

  const openTurmaDetail = (turma: TurmaCompostagem & { participantes: Participante[] }) => {
    setSelectedGroup(turma)
    setIsGroupDetailOpen(true)
  }

  const openAddParticipant = (turma: TurmaCompostagem & { participantes: Participante[] }) => {
    setSelectedGroup(turma)
    setIsAddParticipantOpen(true)
  }

  const handleExportPDF = () => {
    const headers = ["Nome", "Telefone", "E-mail", "Turma", "Status", "Baldes"]
    const rows = filteredParticipantes.map((p) => {
      const preenchido = getStatus(p)
      const baldeAtual = p.baldes.find((b) => b.trimestre === TRIMESTRE_ATUAL)
      return [
        p.nome,
        p.telefone,
        p.email,
        `Turma ${p.turma}`,
        preenchido ? "Preenchido" : "Pendente",
        baldeAtual ? baldeAtual.quantidade : 0,
      ]
    })

    exportPDF({
      filename: `afapan-compostagem-${turmaFilter}-${TRIMESTRE_ATUAL}`,
      title: `Relatorio de Compostagem - Turma ${turmaFilter}`,
      subtitle: `Trimestre ${TRIMESTRE_ATUAL} - ${filteredParticipantes.length} participantes listados`,
      headers,
      rows,
      orientation: "landscape",
      summaryItems: [
        { label: "Total participantes", value: String(stats.total) },
        { label: "Preenchidos", value: String(stats.preenchidos) },
        { label: "Pendentes", value: String(stats.pendentes) },
        { label: "Baldes no trimestre", value: String(stats.totalBaldes) },
      ],
    })
    toast.success("PDF de compostagem gerado com sucesso")
  }

  const handleExportCSV = () => {
    const headers = ["Nome", "Telefone", "E-mail", "Turma", "Status", "Baldes", "Data Registro"]
    const rows = filteredParticipantes.map((p) => {
      const preenchido = getStatus(p)
      const baldeAtual = p.baldes.find((b) => b.trimestre === TRIMESTRE_ATUAL)
      return [
        p.nome,
        p.telefone,
        p.email,
        `Turma ${p.turma}`,
        preenchido ? "Preenchido" : "Pendente",
        baldeAtual ? baldeAtual.quantidade : 0,
        baldeAtual ? baldeAtual.dataRegistro : "",
      ]
    })

    exportCSV({
      filename: `afapan-compostagem-${turmaFilter}-${TRIMESTRE_ATUAL}`,
      headers,
      rows,
    })
    toast.success("CSV de compostagem gerado com sucesso")
  }

  const openDetail = (participante: Participante) => {
    setSelectedParticipante(participante)
    setIsDetailOpen(true)
  }

  const openRegister = (participante: Participante) => {
    setSelectedParticipante(participante)
    const baldeAtual = participante.baldes.find((b) => b.trimestre === TRIMESTRE_ATUAL)
    setRegisterQuantidade(baldeAtual ? String(baldeAtual.quantidade) : "")
    setIsRegisterOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Compostagem</h2>
          <p className="text-muted-foreground">
            Gerenciamento do programa Compostando Juntos - {TRIMESTRE_ATUAL}
          </p>
        </div>
      </div>

      <Tabs defaultValue="participantes" className="space-y-6">
        <TabsList>
          <TabsTrigger value="participantes">Participantes</TabsTrigger>
          <TabsTrigger value="turmas">Turmas</TabsTrigger>
        </TabsList>

        <TabsContent value="participantes" className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div></div>
            <ExportButton onExportPDF={handleExportPDF} onExportCSV={handleExportCSV} />
          </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-lg bg-primary/10 p-3">
              <Users size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total participantes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-lg bg-success/10 p-3">
              <CheckCircle2 size={20} className="text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.preenchidos}</p>
              <p className="text-xs text-muted-foreground">Preenchidos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-lg bg-warning/10 p-3">
              <Clock size={20} className="text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.pendentes}</p>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-lg bg-primary/10 p-3">
              <Trash2 size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.totalBaldes}</p>
              <p className="text-xs text-muted-foreground">Baldes no trimestre</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Recycle size={18} className="text-primary" />
                Participantes do programa
              </CardTitle>
              <CardDescription>
                Acompanhe o preenchimento dos dados trimestrais de compostagem.
              </CardDescription>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Select value={turmaFilter} onValueChange={setTurmaFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {turmas.map((turma) => (
                    <SelectItem key={turma.id} value={turma.semestre}>
                      {turma.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Buscar por nome ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
            >
              <TabsList>
                <TabsTrigger value="todos" className="gap-1.5">
                  <Filter size={14} />
                  Todos
                </TabsTrigger>
                <TabsTrigger value="preenchido" className="gap-1.5">
                  <CheckCircle2 size={14} />
                  Preenchidos
                </TabsTrigger>
                <TabsTrigger value="pendente" className="gap-1.5">
                  <Clock size={14} />
                  Pendentes
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Progress Bar */}
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">
                Progresso do trimestre {TRIMESTRE_ATUAL}
              </span>
              <span className="font-bold text-primary">
                {stats.total > 0 ? Math.round((stats.preenchidos / stats.total) * 100) : 0}%
              </span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{
                  width: `${stats.total > 0 ? (stats.preenchidos / stats.total) * 100 : 0}%`,
                }}
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {stats.preenchidos} de {stats.total} participantes informaram seus dados
            </p>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participante</TableHead>
                  <TableHead className="hidden md:table-cell">Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Baldes</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      Carregando participantes...
                    </TableCell>
                  </TableRow>
                ) : filteredParticipantes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      Nenhum participante encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredParticipantes.map((participante) => {
                    const preenchido = getStatus(participante)
                    const baldeAtual = participante.baldes.find(
                      (b) => b.trimestre === TRIMESTRE_ATUAL
                    )
                    return (
                      <TableRow key={participante.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${
                                preenchido
                                  ? "bg-success/10 text-success"
                                  : "bg-warning/10 text-warning"
                              }`}
                            >
                              {participante.nome
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{participante.nome}</p>
                              <p className="text-xs text-muted-foreground md:hidden">
                                {participante.telefone}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground md:table-cell">
                          {participante.telefone}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              preenchido
                                ? "border-success/30 bg-success/10 text-success"
                                : "border-warning/30 bg-warning/10 text-warning"
                            }
                          >
                            {preenchido ? "Preenchido" : "Pendente"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {baldeAtual ? (
                            <span className="font-semibold text-foreground">
                              {baldeAtual.quantidade}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openDetail(participante)}
                            >
                              <Eye size={14} />
                              <span className="sr-only">Ver detalhes de {participante.nome}</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openRegister(participante)}
                            >
                              <Recycle size={14} />
                              <span className="sr-only">Registrar baldes de {participante.nome}</span>
                            </Button>
                            {!preenchido && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-primary hover:text-primary"
                                onClick={() => handleGerarLink(participante)}
                              >
                                <Send size={14} />
                                <span className="sr-only">
                                  Enviar link para {participante.nome}
                                </span>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="turmas" className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold">Turmas de Compostagem</h3>
              <p className="text-sm text-muted-foreground">
                Organize participantes em turmas para atividades de compostagem
              </p>
            </div>
            <Button onClick={() => setIsCreateGroupOpen(true)}>
              <Plus size={16} className="mr-2" />
              Nova Turma
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <div className="col-span-full text-center py-8">Carregando turmas...</div>
            ) : turmasCompostagem.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                Nenhuma turma criada ainda.
              </div>
            ) : (
              turmasCompostagem.map((turma) => (
                <Card key={turma.id} className="border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Group size={18} className="text-primary" />
                        <CardTitle className="text-base">{turma.nome}</CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteTurma(turma.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                    {turma.descricao && (
                      <CardDescription>{turma.descricao}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Participantes:</span>
                      <Badge variant="secondary">{turma.participantes.length}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openTurmaDetail(turma)}
                      >
                        <Eye size={14} className="mr-1" />
                        Ver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openAddParticipant(turma)}
                      >
                        <UserPlus size={14} className="mr-1" />
                        Adicionar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do participante</DialogTitle>
            <DialogDescription>
              Informacoes completas e historico de compostagem.
            </DialogDescription>
          </DialogHeader>
          {selectedParticipante && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Nome</Label>
                  <p className="text-sm font-medium text-foreground">{selectedParticipante.nome}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Turma</Label>
                  <p className="text-sm font-medium text-foreground">
                    Turma {selectedParticipante.turma}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Telefone</Label>
                  <p className="text-sm font-medium text-foreground">
                    {selectedParticipante.telefone}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">E-mail</Label>
                  <p className="text-sm font-medium text-foreground">
                    {selectedParticipante.email}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Historico de baldes</Label>
                {selectedParticipante.baldes.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {selectedParticipante.baldes.map((balde) => (
                      <div
                        key={balde.trimestre}
                        className="flex items-center justify-between rounded-lg border border-border/50 p-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">{balde.trimestre}</p>
                          <p className="text-xs text-muted-foreground">
                            Registrado em {balde.dataRegistro}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-sm font-bold">
                          {balde.quantidade} baldes
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Nenhum registro encontrado.
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Register Buckets Dialog */}
      <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar baldes</DialogTitle>
            <DialogDescription>
              Registrar manualmente a quantidade de baldes para{" "}
              <strong>{selectedParticipante?.nome}</strong> no trimestre {TRIMESTRE_ATUAL}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="quantidade-baldes">Quantidade de baldes</Label>
              <Input
                id="quantidade-baldes"
                type="number"
                min="0"
                value={registerQuantidade}
                onChange={(e) => setRegisterQuantidade(e.target.value)}
                placeholder="Ex: 8"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRegisterOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRegistrarManual}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Turma Dialog */}
      <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar nova turma</DialogTitle>
            <DialogDescription>
              Crie uma turma para organizar participantes da compostagem.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="group-name">Nome da turma *</Label>
              <Input
                id="group-name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Ex: Turma Centro"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-description">Descrição</Label>
              <Input
                id="group-description"
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                placeholder="Descrição opcional da turma"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateGroupOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateTurma}>Criar Turma</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Turma Detail Dialog */}
      <Dialog open={isGroupDetailOpen} onOpenChange={setIsGroupDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da turma: {selectedGroup?.nome}</DialogTitle>
            <DialogDescription>
              Participantes da turma e informações gerais.
            </DialogDescription>
          </DialogHeader>
          {selectedGroup && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Nome</Label>
                  <p className="text-sm font-medium text-foreground">{selectedGroup.nome}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Participantes</Label>
                  <p className="text-sm font-medium text-foreground">{selectedGroup.participantes.length}</p>
                </div>
                {selectedGroup.descricao && (
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">Descrição</Label>
                    <p className="text-sm font-medium text-foreground">{selectedGroup.descricao}</p>
                  </div>
                )}
                <div>
                  <Label className="text-xs text-muted-foreground">Criado em</Label>
                  <p className="text-sm font-medium text-foreground">
                    {new Date(selectedGroup.criado_em).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Participantes</Label>
                {selectedGroup.participantes.length > 0 ? (
                  <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                    {selectedGroup.participantes.map((participante) => (
                      <div
                        key={participante.id}
                        className="flex items-center justify-between rounded-lg border border-border/50 p-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">{participante.nome}</p>
                          <p className="text-xs text-muted-foreground">{participante.telefone}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleRemoveParticipantFromGroup(participante.id, selectedGroup.id)}
                        >
                          <UserMinus size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Nenhum participante nesta turma.
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Participant Dialog */}
      <Dialog open={isAddParticipantOpen} onOpenChange={setIsAddParticipantOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar participante à turma</DialogTitle>
            <DialogDescription>
              Selecione um participante para adicionar à turma "{selectedGroup?.nome}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="max-h-60 overflow-y-auto space-y-2">
              {participantes
                .filter(p => !selectedGroup?.participantes.some(sp => sp.id === p.id))
                .map((participante) => (
                  <div
                    key={participante.id}
                    className="flex items-center justify-between rounded-lg border border-border/50 p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{participante.nome}</p>
                      <p className="text-xs text-muted-foreground">Turma {participante.turma} • {participante.telefone}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddParticipantToGroup(participante.id)}
                    >
                      <UserPlus size={14} className="mr-1" />
                      Adicionar
                    </Button>
                  </div>
                ))}
              {participantes.filter(p => !selectedGroup?.participantes.some(sp => sp.id === p.id)).length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  Todos os participantes já estão nesta turma.
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

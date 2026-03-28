import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
} from "lucide-react"
import { type Participante, type Turma } from "@/lib/mock-data"
import { ExportButton } from "@/components/export-button"
import { exportPDF, exportCSV } from "@/lib/export-utils"

interface ParticipantesTabProps {
  filteredParticipantes: Participante[]
  stats: {
    total: number
    preenchidos: number
    pendentes: number
    totalBaldes: number
  }
  searchTerm: string
  onSearchChange: (term: string) => void
  statusFilter: "todos" | "preenchido" | "pendente"
  onStatusFilterChange: (status: "todos" | "preenchido" | "pendente") => void
  turmaFilter: string
  onTurmaFilterChange: (turma: string) => void
  turmas: Turma[]
  loading: boolean
  getStatus: (participante: Participante) => boolean
  onOpenDetail: (participante: Participante) => void
  onOpenRegister: (participante: Participante) => void
  onGerarLink: (participante: Participante) => void
  trimestre: string
}

export function ParticipantesTab({
  filteredParticipantes,
  stats,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  turmaFilter,
  onTurmaFilterChange,
  turmas,
  loading,
  getStatus,
  onOpenDetail,
  onOpenRegister,
  onGerarLink,
  trimestre,
}: ParticipantesTabProps) {
  const handleExportPDF = () => {
    const headers = ["Nome", "Telefone", "E-mail", "Turma", "Status", "Baldes"]
    const rows = filteredParticipantes.map((p) => {
      const preenchido = getStatus(p)
      const baldeAtual = p.baldes.find((b) => b.trimestre === trimestre)
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
      filename: `afapan-compostagem-${turmaFilter}-${trimestre}`,
      title: `Relatorio de Compostagem - Turma ${turmaFilter}`,
      subtitle: `Trimestre ${trimestre} - ${filteredParticipantes.length} participantes listados`,
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
  }

  const handleExportCSV = () => {
    const headers = ["Nome", "Telefone", "E-mail", "Turma", "Status", "Baldes", "Data Registro"]
    const rows = filteredParticipantes.map((p) => {
      const preenchido = getStatus(p)
      const baldeAtual = p.baldes.find((b) => b.trimestre === trimestre)
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
      filename: `afapan-compostagem-${turmaFilter}-${trimestre}`,
      headers,
      rows,
    })
  }

  return (
    <div className="space-y-6">
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
              <Select value={turmaFilter} onValueChange={onTurmaFilterChange}>
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
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={statusFilter} onValueChange={(v) => onStatusFilterChange(v as typeof statusFilter)}>
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
                Progresso do trimestre {trimestre}
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
                    const baldeAtual = participante.baldes.find((b) => b.trimestre === trimestre)
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
                              onClick={() => onOpenDetail(participante)}
                            >
                              <Eye size={14} />
                              <span className="sr-only">Ver detalhes de {participante.nome}</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => onOpenRegister(participante)}
                            >
                              <Recycle size={14} />
                              <span className="sr-only">Registrar baldes de {participante.nome}</span>
                            </Button>
                            {!preenchido && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-primary hover:text-primary"
                                onClick={() => onGerarLink(participante)}
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
    </div>
  )
}

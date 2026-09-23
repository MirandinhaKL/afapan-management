"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Archive, Boxes, CalendarDays, Eye, Pencil, Plus, RotateCcw, Scale, Users } from "lucide-react"
import { toast } from "sonner"
import { CreateEcoDriveCampaignDialog } from "@/components/dialogs/create-eco-drive-campaign-dialog"
import { EcoDriveCampaignDetailsDialog } from "@/components/dialogs/eco-drive-campaign-details-dialog"
import { ExportButton } from "@/components/export-button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { exportCSV, exportPDF } from "@/lib/export-utils"
import {
  calculateEcoDriveStats,
  getEcoDriveCampaignTotals,
  getEcoDriveLocationLabel,
  type CreateEcoDriveCampaignInput,
  type EcoDriveArchiveFilter,
  type EcoDriveCampaign,
  type EcoDriveCampaignFilters,
} from "@/lib/eco-drive"
import {
  createEcoDriveCampaign,
  fetchEcoDriveCampaigns,
  fetchEcoDriveCampaignsPage,
  getEcoDriveMutationError,
  setEcoDriveCampaignArchived,
  updateEcoDriveCampaign,
} from "@/lib/eco-drive-queries"

const PAGE_SIZE = 10
const formatKg = (value: number) => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value)
const formatDate = (value: string) => value.split("-").reverse().join("/")

export function EcoDrivePage() {
  const [campaigns, setCampaigns] = useState<EcoDriveCampaign[]>([])
  const [statsCampaigns, setStatsCampaigns] = useState<EcoDriveCampaign[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<EcoDriveCampaign | null>(null)
  const [details, setDetails] = useState<EcoDriveCampaign | null>(null)
  const [confirming, setConfirming] = useState<EcoDriveCampaign | null>(null)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<"all" | "planejada" | "concluida">("all")
  const [year, setYear] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [archive, setArchive] = useState<EcoDriveArchiveFilter>("active")

  const filters = useMemo<EcoDriveCampaignFilters>(() => ({
    search, status, year: year ? Number(year) : undefined, dateFrom, dateTo, archive,
  }), [search, status, year, dateFrom, dateTo, archive])

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const [result, active] = await Promise.all([
        fetchEcoDriveCampaignsPage(filters, page, PAGE_SIZE),
        fetchEcoDriveCampaigns({ archive: "active" }),
      ])
      setCampaigns(result.campaigns)
      setTotal(result.total)
      setStatsCampaigns(active)
      if (page > 1 && result.campaigns.length === 0) setPage(page - 1)
    } catch (error) {
      console.error("Erro ao carregar campanhas Eco Drive:", error)
      toast.error("Não foi possível carregar as campanhas do Eco Drive")
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  useEffect(() => { void load() }, [load])
  useEffect(() => { setPage(1) }, [search, status, year, dateFrom, dateTo, archive])

  const stats = useMemo(() => calculateEcoDriveStats(statsCampaigns), [statsCampaigns])
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const handleSave = async (input: CreateEcoDriveCampaignInput) => {
    try {
      setSaving(true)
      if (editing) {
        if (!editing.updatedAt) throw new Error("A campanha não possui versão para edição.")
        await updateEcoDriveCampaign({ ...input, id: editing.id, expectedUpdatedAt: editing.updatedAt })
        toast.success("Campanha atualizada com sucesso!")
      } else {
        await createEcoDriveCampaign(input)
        toast.success("Campanha Eco Drive salva com sucesso!")
      }
      await load()
      setEditing(null)
      return true
    } catch (error) {
      toast.error(editing ? "Não foi possível atualizar a campanha" : "Não foi possível salvar a campanha", { description: getEcoDriveMutationError(error) })
      return false
    } finally { setSaving(false) }
  }

  const handleArchive = async () => {
    if (!confirming) return
    try {
      setSaving(true)
      const restoring = Boolean(confirming.archivedAt)
      await setEcoDriveCampaignArchived(confirming, !restoring)
      toast.success(restoring ? "Campanha restaurada com sucesso!" : "Campanha arquivada com sucesso!")
      setConfirming(null)
      await load()
    } catch (error) {
      toast.error("Não foi possível alterar o arquivamento", { description: getEcoDriveMutationError(error) })
    } finally { setSaving(false) }
  }

  const exportRows = async (kind: "csv" | "pdf") => {
    try {
      const data = await fetchEcoDriveCampaigns(filters)
      const rows = data.map((campaign) => {
        const totals = getEcoDriveCampaignTotals(campaign)
        return [campaign.name, formatDate(campaign.eventDate), getEcoDriveLocationLabel(campaign.location), campaign.status === "concluida" ? "Concluída" : "Planejada", campaign.volunteerCount, formatKg(totals.kg), totals.units]
      })
      const headers = ["Campanha", "Data", "Local", "Status", "Voluntários", "Kg", "Unidades"]
      const filterDescription = `Busca: ${search || "todas"}; status: ${status}; ano: ${year || "todos"}; período: ${dateFrom || "início"} a ${dateTo || "fim"}; registros: ${archive}`
      if (kind === "csv") exportCSV({ filename: "relatorio-eco-drive", headers, rows })
      else {
        const reportStats = calculateEcoDriveStats(data.filter((item) => !item.archivedAt))
        exportPDF({ filename: "relatorio-eco-drive", title: "Relatório Eco Drive", subtitle: filterDescription, headers, rows, orientation: "landscape", summaryItems: [
          { label: "Campanhas ativas", value: String(reportStats.campaigns) },
          { label: "Total coletado", value: `${formatKg(reportStats.totalKg)} kg` },
          { label: "Itens", value: String(reportStats.totalUnits) },
          { label: "Voluntários", value: String(reportStats.totalVolunteers) },
        ] })
      }
    } catch (error) { toast.error("Não foi possível gerar o relatório", { description: getEcoDriveMutationError(error) }) }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><h2 className="text-2xl font-bold tracking-tight">Eco Drive</h2><p className="text-muted-foreground">Campanhas mensais de coleta e reciclagem em Farroupilha.</p></div>
        <div className="flex gap-2"><ExportButton onExportPDF={() => void exportRows("pdf")} onExportCSV={() => void exportRows("csv")} /><Button onClick={() => { setEditing(null); setFormOpen(true) }}><Plus size={16} />Nova campanha</Button></div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "Campanhas", value: stats.campaigns, note: `${stats.completedCampaigns} concluídas`, Icon: CalendarDays },
          { title: "Total coletado", value: `${formatKg(stats.totalKg)} kg`, note: "Somente campanhas concluídas", Icon: Scale },
          { title: "Itens por unidade", value: stats.totalUnits, note: "Em campanhas concluídas", Icon: Boxes },
          { title: "Voluntários", value: stats.totalVolunteers, note: "Nas campanhas concluídas", Icon: Users },
        ].map(({ title, value, note, Icon }) => <Card key={title}><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">{title}</CardTitle><Icon size={16} className="text-muted-foreground" /></CardHeader><CardContent><p className="text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{note}</p></CardContent></Card>)}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Campanhas cadastradas</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <Input className="md:col-span-2" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome ou local" aria-label="Buscar campanhas" />
            <Select value={status} onValueChange={(value: typeof status) => setStatus(value)}><SelectTrigger aria-label="Filtrar por status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos os status</SelectItem><SelectItem value="planejada">Planejada</SelectItem><SelectItem value="concluida">Concluída</SelectItem></SelectContent></Select>
            <Input type="number" min="2000" max="2100" value={year} onChange={(e) => setYear(e.target.value)} placeholder="Ano" aria-label="Filtrar por ano" />
            <Select value={archive} onValueChange={(value: EcoDriveArchiveFilter) => setArchive(value)}><SelectTrigger aria-label="Filtrar arquivamento"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Ativas</SelectItem><SelectItem value="archived">Arquivadas</SelectItem><SelectItem value="all">Todas</SelectItem></SelectContent></Select>
            <Button variant="outline" onClick={() => { setSearch(""); setStatus("all"); setYear(""); setDateFrom(""); setDateTo(""); setArchive("active") }}>Limpar filtros</Button>
            <div className="md:col-span-3 xl:col-span-3"><label className="mb-1 block text-xs text-muted-foreground" htmlFor="eco-date-from">Data inicial</label><Input id="eco-date-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></div>
            <div className="md:col-span-3 xl:col-span-3"><label className="mb-1 block text-xs text-muted-foreground" htmlFor="eco-date-to">Data final</label><Input id="eco-date-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></div>
          </div>
          {loading ? <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div> : campaigns.length === 0 ? <div className="py-10 text-center"><Boxes className="mx-auto mb-3 text-muted-foreground" /><p className="font-medium">Nenhuma campanha encontrada</p></div> : <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Campanha</TableHead><TableHead>Data</TableHead><TableHead>Local</TableHead><TableHead className="text-right">Voluntários</TableHead><TableHead className="text-right">Coleta</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader><TableBody>{campaigns.map((campaign) => {
            const totals = getEcoDriveCampaignTotals(campaign)
            return <TableRow key={campaign.id}><TableCell className="font-medium">{campaign.name}</TableCell><TableCell>{formatDate(campaign.eventDate)}</TableCell><TableCell>{getEcoDriveLocationLabel(campaign.location)}</TableCell><TableCell className="text-right">{campaign.volunteerCount}</TableCell><TableCell className="text-right font-medium">{formatKg(totals.kg)} kg<span className="block text-xs font-normal text-muted-foreground">{totals.units} un.</span></TableCell><TableCell><Badge variant={campaign.status === "concluida" ? "default" : "secondary"}>{campaign.status === "concluida" ? "Concluída" : "Planejada"}</Badge></TableCell><TableCell><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" aria-label={`Ver ${campaign.name}`} onClick={() => setDetails(campaign)}><Eye size={16} /></Button><Button variant="ghost" size="icon" aria-label={`Editar ${campaign.name}`} onClick={() => { setEditing(campaign); setFormOpen(true) }}><Pencil size={16} /></Button><Button variant="ghost" size="icon" aria-label={`${campaign.archivedAt ? "Restaurar" : "Arquivar"} ${campaign.name}`} onClick={() => setConfirming(campaign)}>{campaign.archivedAt ? <RotateCcw size={16} /> : <Archive size={16} />}</Button></div></TableCell></TableRow>
          })}</TableBody></Table></div>}
          <div className="flex items-center justify-between text-sm"><span>{total} campanha(s)</span><div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>Anterior</Button><span>Página {page} de {totalPages}</span><Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>Próxima</Button></div></div>
        </CardContent>
      </Card>

      <CreateEcoDriveCampaignDialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) setEditing(null) }} onCreate={handleSave} onSave={handleSave} campaign={editing} isSaving={saving} />
      <EcoDriveCampaignDetailsDialog campaign={details} open={Boolean(details)} onOpenChange={(open) => { if (!open) setDetails(null) }} />
      <AlertDialog open={Boolean(confirming)} onOpenChange={(open) => { if (!open) setConfirming(null) }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{confirming?.archivedAt ? "Restaurar campanha?" : "Arquivar campanha?"}</AlertDialogTitle><AlertDialogDescription>{confirming ? `${confirming.name}, de ${formatDate(confirming.eventDate)}. ${confirming.archivedAt ? "Ela voltará à listagem ativa." : "Ela deixará a listagem e os indicadores ativos, mas seus dados serão preservados."}` : ""}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel><AlertDialogAction disabled={saving} onClick={(event) => { event.preventDefault(); void handleArchive() }}>{saving ? "Salvando..." : confirming?.archivedAt ? "Restaurar" : "Arquivar"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  )
}

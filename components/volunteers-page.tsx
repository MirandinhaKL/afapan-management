"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Archive, Check, ChevronDown, ChevronUp, Copy, Eye, HeartHandshake, Pencil, Plus, RotateCcw, SlidersHorizontal } from "lucide-react"
import { toast } from "sonner"
import { VolunteerDetailsDialog } from "@/components/dialogs/volunteer-details-dialog"
import { VolunteerFormDialog } from "@/components/dialogs/volunteer-form-dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { copyTextToClipboard } from "@/lib/clipboard"
import { VOLUNTEER_REGISTRATION_PATH } from "@/lib/volunteer-registration"
import {
  VOLUNTEER_ACTIVITIES,
  VOLUNTEER_FREQUENCIES,
  calculateAge,
  formatActivityStart,
  formatBirthday,
  type Volunteer,
  type VolunteerActivity,
  type VolunteerFilters,
  type VolunteerFrequency,
  type VolunteerInput,
  type VolunteerStatus,
} from "@/lib/volunteers"
import { fetchVolunteers, getVolunteerMutationError, saveAssistedVolunteer, setVolunteerArchived, setVolunteerStatus } from "@/lib/volunteer-queries"

const PAGE_SIZE = 10
const statusLabel: Record<VolunteerStatus, string> = { aguardando_validacao: "Aguardando validação", ativo: "Ativo", sem_confirmacao: "Sem confirmação", inativo: "Inativo" }

export function VolunteersPage() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [editing, setEditing] = useState<Volunteer | null>(null)
  const [details, setDetails] = useState<Volunteer | null>(null)
  const [confirming, setConfirming] = useState<Volunteer | null>(null)
  const [registrationUrl, setRegistrationUrl] = useState("")
  const [copyStatus, setCopyStatus] = useState<"idle" | "copying" | "success" | "error">("idle")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<VolunteerStatus | "all">("all")
  const [city, setCity] = useState("")
  const [neighborhood, setNeighborhood] = useState("")
  const [activity, setActivity] = useState<VolunteerActivity | "all">("all")
  const [frequency, setFrequency] = useState<VolunteerFrequency | "all">("all")
  const [archive, setArchive] = useState<"active" | "archived" | "all">("active")

  const filters = useMemo<VolunteerFilters>(() => ({ search, status, city, neighborhood, activity, frequency, archive }), [search, status, city, neighborhood, activity, frequency, archive])
  const activeFilterCount = [Boolean(search.trim()), status !== "all", Boolean(city.trim()), Boolean(neighborhood.trim()), activity !== "all", frequency !== "all", archive !== "active"].filter(Boolean).length

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const result = await fetchVolunteers(filters, page, PAGE_SIZE)
      setVolunteers(result.volunteers)
      setTotal(result.total)
      if (page > 1 && !result.volunteers.length) setPage(page - 1)
    } catch (error) {
      toast.error("Não foi possível carregar os voluntários", { description: getVolunteerMutationError(error) })
    } finally { setLoading(false) }
  }, [filters, page])

  useEffect(() => { void load() }, [load])
  useEffect(() => { setRegistrationUrl(new URL(VOLUNTEER_REGISTRATION_PATH, window.location.origin).href) }, [])
  useEffect(() => setPage(1), [search, status, city, neighborhood, activity, frequency, archive])

  const clearFilters = () => {
    setSearch(""); setStatus("all"); setCity(""); setNeighborhood(""); setActivity("all"); setFrequency("all"); setArchive("active")
  }
  const save = async (input: VolunteerInput & { status?: VolunteerStatus }) => {
    try {
      setSaving(true)
      await saveAssistedVolunteer({ ...input, id: editing?.id, expectedUpdatedAt: editing?.updatedAt })
      toast.success(editing ? "Voluntário atualizado!" : "Voluntário cadastrado!")
      await load()
      return true
    } catch (error) {
      toast.error("Não foi possível salvar", { description: getVolunteerMutationError(error) })
      return false
    } finally { setSaving(false) }
  }
  const changeStatus = async (volunteer: Volunteer, next: VolunteerStatus) => {
    try { await setVolunteerStatus(volunteer, next); toast.success("Situação atualizada!"); await load() }
    catch (error) { toast.error("Não foi possível atualizar", { description: getVolunteerMutationError(error) }) }
  }
  const archiveVolunteer = async () => {
    if (!confirming) return
    try {
      setSaving(true)
      await setVolunteerArchived(confirming, !confirming.archivedAt)
      toast.success(confirming.archivedAt ? "Voluntário restaurado!" : "Voluntário arquivado!")
      setConfirming(null)
      await load()
    } catch (error) { toast.error("Não foi possível concluir", { description: getVolunteerMutationError(error) }) }
    finally { setSaving(false) }
  }
  const copyLink = async () => {
    setCopyStatus("copying")
    const copied = await copyTextToClipboard(new URL(VOLUNTEER_REGISTRATION_PATH, window.location.origin).href)
    if (copied) {
      setCopyStatus("success")
      toast.success("Link copiado com sucesso!")
      return
    }

    setCopyStatus("error")
    toast.error("Não foi possível copiar o link", {
      description: "Copie manualmente o endereço exibido em Link do formulário.",
    })
  }
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:justify-between"><div><h2 className="text-2xl font-bold">Voluntários</h2><p className="text-muted-foreground">Cadastro e gestão dos voluntários da AFAPAN.</p></div><div className="flex flex-wrap items-center gap-2"><Button type="button" variant="outline" onClick={() => void copyLink()} disabled={copyStatus === "copying"}>{copyStatus === "success" ? <Check size={16} /> : <Copy size={16} />}{copyStatus === "copying" ? "Copiando..." : copyStatus === "success" ? "Link copiado!" : "Copiar link"}</Button><Button type="button" onClick={() => { setEditing(null); setFormOpen(true) }}><Plus size={16} />Cadastrar</Button></div></div>
    <section className="space-y-2 rounded-lg border bg-muted/20 p-4" aria-label="Link do formulário"><p className="font-medium">Link do formulário</p><a href={registrationUrl || VOLUNTEER_REGISTRATION_PATH} target="_blank" rel="noopener noreferrer" className="block break-all text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4" aria-label="Abrir formulário de cadastro em uma nova aba">{registrationUrl || VOLUNTEER_REGISTRATION_PATH}</a><span className={copyStatus === "error" ? "block text-sm text-destructive" : "sr-only"} role="status" aria-live="polite">{copyStatus === "success" ? "O link foi copiado com sucesso." : copyStatus === "error" ? "Não foi possível copiar o link. Copie manualmente o endereço exibido acima." : ""}</span></section>
    <Card><CardHeader className="flex-row items-center justify-between"><CardTitle className="text-lg">Cadastros</CardTitle><Button variant="outline" onClick={() => setFiltersOpen((open) => !open)} aria-expanded={filtersOpen} aria-controls="volunteer-filters"><SlidersHorizontal size={16} />Filtros{activeFilterCount > 0 && <Badge className="ml-1" aria-label={`${activeFilterCount} filtros ativos`}>{activeFilterCount}</Badge>}{filtersOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</Button></CardHeader><CardContent className="space-y-4">
      {filtersOpen && <div id="volunteer-filters" className="grid gap-3 rounded-lg border bg-muted/20 p-4 md:grid-cols-3 xl:grid-cols-4"><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar nome ou telefone" aria-label="Buscar nome ou telefone" /><Select value={status} onValueChange={(value: VolunteerStatus | "all") => setStatus(value)}><SelectTrigger aria-label="Situação"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas as situações</SelectItem>{Object.entries(statusLabel).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select><Input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Cidade" aria-label="Cidade" /><Input value={neighborhood} onChange={(event) => setNeighborhood(event.target.value)} placeholder="Bairro" aria-label="Bairro" /><Select value={activity} onValueChange={(value: VolunteerActivity | "all") => setActivity(value)}><SelectTrigger aria-label="Atividade"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas as atividades</SelectItem>{VOLUNTEER_ACTIVITIES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select><Select value={frequency} onValueChange={(value: VolunteerFrequency | "all") => setFrequency(value)}><SelectTrigger aria-label="Frequência"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas as frequências</SelectItem>{VOLUNTEER_FREQUENCIES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select><Select value={archive} onValueChange={(value: "active" | "archived" | "all") => setArchive(value)}><SelectTrigger aria-label="Arquivamento"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Não arquivados</SelectItem><SelectItem value="archived">Arquivados</SelectItem><SelectItem value="all">Todos</SelectItem></SelectContent></Select><Button variant="outline" onClick={clearFilters}>Limpar filtros</Button></div>}
      {loading ? <><Skeleton className="h-10" /><Skeleton className="h-10" /></> : !volunteers.length ? <div className="py-10 text-center"><HeartHandshake className="mx-auto mb-2" /><p>Nenhum voluntário encontrado.</p></div> : <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Voluntário</TableHead><TableHead>Telefone</TableHead><TableHead>Idade</TableHead><TableHead>Aniversário</TableHead><TableHead>Início AFAPAN</TableHead><TableHead>Situação</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader><TableBody>{volunteers.map((volunteer) => <TableRow key={volunteer.id}><TableCell className="font-medium">{volunteer.firstName} {volunteer.lastName}</TableCell><TableCell>{volunteer.phone}</TableCell><TableCell>{calculateAge(volunteer.birthDate)} anos</TableCell><TableCell>{formatBirthday(volunteer.birthDate)}</TableCell><TableCell>{formatActivityStart(volunteer.activityStartMonth, volunteer.activityStartYear)}</TableCell><TableCell><Select value={volunteer.status} onValueChange={(next: VolunteerStatus) => void changeStatus(volunteer, next)}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(statusLabel).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></TableCell><TableCell><div className="flex"><Button variant="ghost" size="icon" onClick={() => setDetails(volunteer)} aria-label={`Ver ${volunteer.firstName}`}><Eye size={16} /></Button><Button variant="ghost" size="icon" onClick={() => { setEditing(volunteer); setFormOpen(true) }} aria-label={`Editar ${volunteer.firstName}`}><Pencil size={16} /></Button><Button variant="ghost" size="icon" onClick={() => setConfirming(volunteer)} aria-label={`${volunteer.archivedAt ? "Restaurar" : "Arquivar"} ${volunteer.firstName}`}>{volunteer.archivedAt ? <RotateCcw size={16} /> : <Archive size={16} />}</Button></div></TableCell></TableRow>)}</TableBody></Table></div>}
      <div className="flex justify-between text-sm"><span>{total} registro(s)</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Anterior</Button><span>{page} de {pages}</span><Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((current) => current + 1)}>Próxima</Button></div></div>
    </CardContent></Card>
    <VolunteerFormDialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) setEditing(null) }} volunteer={editing} onSave={save} saving={saving} />
    <VolunteerDetailsDialog volunteer={details} open={Boolean(details)} onOpenChange={(open) => { if (!open) setDetails(null) }} />
    <AlertDialog open={Boolean(confirming)} onOpenChange={(open) => { if (!open) setConfirming(null) }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{confirming?.archivedAt ? "Restaurar voluntário?" : "Arquivar voluntário?"}</AlertDialogTitle><AlertDialogDescription>{confirming?.firstName} {confirming?.lastName}. O histórico será preservado.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={(event) => { event.preventDefault(); void archiveVolunteer() }}>{saving ? "Salvando..." : confirming?.archivedAt ? "Restaurar" : "Arquivar"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>
}

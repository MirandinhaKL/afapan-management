"use client"

import { useEffect, useState, type FormEvent } from "react"
import { ArrowLeft, Loader2 } from "lucide-react"
import { z } from "zod"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ConectaCatalogPage } from "@/components/conecta-catalog-page"
import { ConectaCertificateActions } from "@/components/conecta-certificate-actions"
import { supabase } from "@/lib/supabase"

const status = z.enum(["pending", "approved", "rejected", "returned"])
const labels = { pending: "Pendente", approved: "Aprovada", rejected: "Recusada", returned: "Devolvida" }
const summary = z.object({ id: z.string().uuid(), name: z.string(), status, modality: z.string(), starts_on: z.string(), ends_on: z.string(), sent: z.boolean() })
const listing = z.object({ items: z.array(summary), total: z.number().int().nonnegative(), pending: z.number().int().nonnegative() })
const detailSchema = summary.omit({ sent: true }).extend({
  cpf: z.string(), email: z.string(), phone: z.string(), institution: z.string(), course: z.string(),
  instagram: z.string().nullable(), activity_reference: z.string().nullable(),
  mode: z.enum(["checklist", "free"]), revision: z.number().int().positive(), approved_minutes: z.number().nullable(),
  report: z.string(), declared_tasks: z.array(z.string()), declared_minutes: z.number().nullable(),
  tasks: z.array(z.object({ id: z.string().uuid(), label: z.string(), minutes: z.number().int().positive() })),
  attachments: z.array(z.object({ id: z.string().uuid(), mime: z.string(), bytes: z.number() })),
  decisions: z.array(z.object({ revision: z.number(), decision: status, reason: z.string().nullable(), minutes: z.number().nullable(), created_at: z.string(), recognized_tasks: z.array(z.string()) })),
  history: z.array(summary.omit({ name: true, sent: true }).extend({ minutes: z.number().nullable() })),
  modality_minutes: z.number().nonnegative(),
})
type Detail = z.infer<typeof detailSchema>
const period = (start: string, end: string) => {
  const format = (value: string) => value.split("-").reverse().join("/")
  return start === end ? format(start) : `${format(start)} a ${format(end)}`
}
const duration = (minutes: number) => `${Math.floor(minutes / 60)} h ${minutes % 60} min`

function ApplicationReview({ item, close, refresh }: { item: Detail; close: () => void; refresh: () => void }) {
  const [chosen, setChosen] = useState(item.declared_tasks)
  const [minutes, setMinutes] = useState(String(item.declared_minutes ?? ""))
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)
  const total = item.mode === "free" ? Number(minutes) : item.tasks.filter(task => chosen.includes(task.id)).reduce((sum, task) => sum + task.minutes, 0)
  async function decide(decision: "approved" | "rejected") {
    if (busy) return
    setError(""); setBusy(true)
    try {
      if (decision === "rejected" && !reason.trim()) { setError("Informe o motivo da recusa."); return }
      if (decision === "approved" && (!Number.isSafeInteger(total) || total <= 0 || total > 2_147_483_647)) { setError("Confira as tarefas ou a carga em minutos."); return }
      const { error } = await supabase.rpc("conecta_review_application", {
        p_id: item.id, p_revision: item.revision, p_decision: decision,
        p_tasks: decision === "approved" && item.mode === "checklist" ? chosen : [],
        p_minutes: decision === "approved" && item.mode === "free" ? total : null,
        p_reason: reason || null,
      })
      if (error) { setError(error.code === "40001" ? "A solicitação mudou. Volte à lista e abra a versão atual." : error.code === "22023" ? "Confira as tarefas e justifique eventuais ajustes." : "Não foi possível registrar a decisão."); return }
      refresh()
    } catch { setError("Não foi possível registrar a decisão.") }
    finally { setBusy(false) }
  }
  async function download(id: string) {
    if (downloading) return
    setDownloading(id)
    setError("")
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) throw new Error()
      const response = await fetch("/api/conecta/internal/evidence", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ id, applicationId: item.id }) })
      if (!response.ok) throw new Error()
      const { url: signedUrl, filename } = await response.json()
      const url = new URL(signedUrl)
      if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) throw new Error()
      const file = await fetch(url.href)
      if (!file.ok) throw new Error()
      const downloadUrl = URL.createObjectURL(await file.blob())
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 60_000)
    } catch { setError("Não foi possível baixar o comprovante.") }
    finally { setDownloading(null) }
  }
  async function requestCorrection() {
    if (busy) return
    if (!reason.trim()) { setError("Informe a orientação para correção."); return }
    setError(""); setBusy(true)
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) throw new Error("Entre novamente.")
      const response = await fetch("/api/conecta/internal/correction", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: item.id, revision: item.revision, reason }),
      })
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? "Não foi possível solicitar a correção.")
      refresh()
    } catch (error) { setError(error instanceof Error ? error.message : "Não foi possível solicitar a correção.") }
    finally { setBusy(false) }
  }
  const studentFields = [
    ["CPF", item.cpf], ["E-mail", item.email], ["WhatsApp", item.phone],
    ["Instituição", item.institution], ["Curso", item.course], ["Instagram", item.instagram],
    ["Turma, ação ou local", item.activity_reference],
  ]

  return <div className="space-y-4">
    <Button variant="outline" onClick={close}><ArrowLeft aria-hidden="true" />Voltar à lista</Button>
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="min-w-0 break-words text-xl font-semibold">{item.name}</h2>
          <Badge variant={item.status === "approved" ? "default" : item.status === "rejected" ? "destructive" : "secondary"}>
            {labels[item.status]}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{item.modality} · {period(item.starts_on, item.ends_on)}</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3">
          <h3 className="font-semibold">Dados do estudante</h3>
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
            {studentFields.filter(([, value]) => value).map(([label, value]) => <div key={label} className="min-w-0">
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="break-words">{value}</dd>
            </div>)}
          </dl>
        </div>
        <div className="space-y-2 rounded-lg bg-muted/50 p-4">
          <h3 className="font-semibold">Relato do estudante</h3>
          <p className="whitespace-pre-wrap break-words text-sm">{item.report}</p>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="border-b">
        <h2 className="font-semibold">Comprovantes e histórico</h2>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-2">
        <div className="min-w-0 space-y-3">
          <h3 className="font-semibold">Comprovantes da atividade</h3>
          {item.attachments.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum comprovante anexado.</p> : <>
            <p className="text-sm text-muted-foreground">Arquivos enviados pelo estudante para análise da atividade.</p>
            <div className="flex flex-wrap gap-2">
              {item.attachments.map((file, index) => <Button key={file.id} variant="outline" disabled={downloading !== null} onClick={() => void download(file.id)}>
                {downloading === file.id && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                {downloading === file.id ? "Baixando comprovante…" : item.attachments.length === 1 ? "Baixar comprovante" : `Baixar comprovante ${index + 1}`}
              </Button>)}
            </div>
          </>}
        </div>
        <div className="min-w-0 space-y-3 border-t pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <h3 className="font-semibold">Histórico de solicitações</h3>
          <p className="text-sm text-muted-foreground">Total reconhecido nesta modalidade <span className="font-semibold text-foreground">{duration(item.modality_minutes)}</span></p>
          {item.history.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma outra solicitação no histórico.</p> :
            <ul className="divide-y rounded-md border">
              {item.history.map(row => <li key={row.id} className="space-y-1 px-3 py-2 text-sm">
                <p className="break-words font-medium">{row.modality}</p>
                <p className="text-muted-foreground">{period(row.starts_on, row.ends_on)} · {labels[row.status]}{row.minutes ? ` · ${duration(row.minutes)}` : ""}</p>
              </li>)}
            </ul>}
          {item.decisions.length > 0 && <div className="space-y-2 border-t pt-3">
            <h3 className="font-semibold">Decisões registradas</h3>
            {item.decisions.map(decision => <div key={decision.revision} className="text-sm">
              <p>{labels[decision.decision]} · revisão {decision.revision}{decision.minutes ? ` · ${duration(decision.minutes)}` : ""}</p>
              {decision.reason && <p className="whitespace-pre-wrap break-words text-muted-foreground">{decision.reason}</p>}
            </div>)}
          </div>}
        </div>
      </CardContent>
    </Card>
    {downloading && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div role="status" className="flex flex-col items-center gap-4 rounded-xl bg-background p-8 text-center shadow-xl">
        <Loader2 className="size-10 animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" />
        <p className="font-semibold">Baixando comprovante da atividade. Aguarde.</p>
      </div>
    </div>}
    {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
    {item.status === "pending" && <Card>
      <CardHeader className="border-b"><h2 id="conecta-review-title" className="font-semibold">Conferência da equipe</h2></CardHeader>
      <CardContent>
        <fieldset disabled={busy} aria-labelledby="conecta-review-title" className="space-y-4">
          {item.mode === "checklist" ? <div className="divide-y rounded-md border">
            {item.tasks.map(task => <label key={task.id} className="flex items-start gap-3 px-3 py-3">
              <input type="checkbox" className="mt-1 shrink-0" checked={chosen.includes(task.id)} onChange={event => setChosen(current => event.target.checked ? [...current, task.id] : current.filter(id => id !== task.id))} />
              <span className="min-w-0 space-y-1">
                <span className="block break-words text-sm font-medium">{task.label}</span>
                <span className="block text-sm text-muted-foreground">{duration(task.minutes)}{item.declared_tasks.includes(task.id) ? " · Informada pelo aluno" : ""}</span>
              </span>
            </label>)}
          </div> : <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Tempo informado: {duration(item.declared_minutes ?? 0)}</p>
            <Label htmlFor="review-minutes">Tempo conferido (minutos)</Label>
            <Input id="review-minutes" className="max-w-xs" type="number" min={1} step={1} value={minutes} onChange={event => setMinutes(event.target.value)} />
          </div>}
          <p className="rounded-md bg-primary/5 px-3 py-2 text-sm">Tempo a reconhecer <span className="font-semibold text-primary">{duration(total)}</span></p>
          <div className="space-y-2">
            <Label htmlFor="review-reason">Justificativa para ajustes ou recusa</Label>
            <Textarea id="review-reason" maxLength={3000} value={reason} onChange={event => setReason(event.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2 border-t pt-4">
            <Button onClick={() => void decide("approved")}>Aprovar</Button>
            <Button variant="outline" onClick={() => void decide("rejected")}>Recusar</Button>
            <Button variant="outline" onClick={() => void requestCorrection()}>Devolver para correção</Button>
          </div>
        </fieldset>
      </CardContent>
    </Card>}
    {(item.status === "rejected" || item.status === "returned") && <Card>
      <CardHeader className="border-b"><h2 className="font-semibold">Correção da solicitação</h2></CardHeader>
      <CardContent>
        <fieldset disabled={busy} className="space-y-3">
          {item.status === "returned" && <p className="text-sm text-muted-foreground">O pedido de envio da orientação foi registrado.</p>}
          <div className="space-y-2">
            <Label htmlFor="correction-reason">Orientação para correção</Label>
            <Textarea id="correction-reason" maxLength={3000} value={reason} onChange={event => setReason(event.target.value)} />
          </div>
          <Button variant="outline" onClick={() => void requestCorrection()}>{item.status === "returned" ? "Renovar link de correção" : "Permitir correção"}</Button>
        </fieldset>
      </CardContent>
    </Card>}
    {item.status === "approved" && <Card>
      <CardContent><ConectaCertificateActions key={item.id} applicationId={item.id} /></CardContent>
    </Card>}
  </div>
}

function ConectaApplications() {
  const [state, setState] = useState<z.infer<typeof listing> | null>(null)
  const [filter, setFilter] = useState("pending")
  const [search, setSearch] = useState("")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<Detail | null>(null)
  const [retry, setRetry] = useState(0)
  const [error, setError] = useState("")
  useEffect(() => {
    let cancelled = false
    setError("")
    if (selectedId) setDetail(null); else setState(null)
    async function load() {
      try {
        if (selectedId) {
          const { data, error } = await supabase.rpc("conecta_get_application", { p_id: selectedId })
          if (error) throw error
          const item = detailSchema.parse(data)
          if (!cancelled) setDetail(item)
        } else {
          const { data, error } = await supabase.rpc("conecta_list_applications", { p_query: query, p_status: filter, p_offset: page * 20 })
          if (error) throw error
          const result = listing.parse(data)
          if (!cancelled) setState(result)
        }
      } catch { if (!cancelled) setError("Não foi possível carregar as solicitações. Confira o acesso e tente novamente.") }
    }
    void load()
    return () => { cancelled = true }
  }, [selectedId, query, filter, page, retry])
  if (error) return <div className="space-y-3"><p role="alert">{error}</p><Button onClick={() => setRetry(value => value + 1)}>Tentar novamente</Button>{selectedId && <Button variant="outline" onClick={() => setSelectedId(null)}>Voltar à lista</Button>}</div>
  if (selectedId) return detail ? <ApplicationReview key={`${detail.id}:${detail.revision}:${detail.status}`} item={detail} close={() => setSelectedId(null)} refresh={() => setRetry(value => value + 1)} /> : <p role="status">Carregando solicitação...</p>
  return <section className="space-y-4">
    <form className="flex flex-wrap items-end gap-3" onSubmit={(event: FormEvent) => { event.preventDefault(); setQuery(search.trim()); setPage(0) }}>
      <div><Label htmlFor="conecta-search">Buscar por nome ou CPF</Label><Input id="conecta-search" maxLength={160} value={search} onChange={event => setSearch(event.target.value)} /></div>
      <Button type="submit" variant="outline">Buscar</Button>
      <div><Label htmlFor="conecta-status">Situação</Label><select id="conecta-status" className="w-full rounded-md border bg-background p-2" value={filter} onChange={event => { setFilter(event.target.value); setPage(0) }}>
        <option value="pending">Pendentes</option><option value="approved">Aprovadas sem envio</option><option value="sent">Certificados enviados</option><option value="rejected">Recusadas</option><option value="returned">Devolvidas</option><option value="all">Todas</option>
      </select></div>
    </form>
    {!state ? <p role="status">Carregando solicitações...</p> : <>
      <p className="text-sm text-muted-foreground">{state.pending} aguardando análise · {state.total} resultado(s)</p>
      {!state.items.length && <p>Nenhuma solicitação encontrada.</p>}
      {state.items.map(row => <Card key={row.id}><CardContent className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">{row.name}</p><p>{row.modality} · {period(row.starts_on,row.ends_on)} · {row.sent ? "Certificado enviado" : labels[row.status]}</p></div><Button variant="outline" onClick={() => setSelectedId(row.id)}>Ver solicitação</Button></CardContent></Card>)}
      <div className="flex gap-2"><Button variant="outline" disabled={page === 0} onClick={() => setPage(value => value - 1)}>Anterior</Button><Button variant="outline" disabled={(page + 1) * 20 >= state.total} onClick={() => setPage(value => value + 1)}>Próxima</Button></div>
    </>}
  </section>
}

export function ConectaPage() {
  const [section, setSection] = useState<"applications" | "catalog">("applications")
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center gap-2">
      <Button variant={section === "applications" ? "default" : "outline"} aria-pressed={section === "applications"} onClick={() => setSection("applications")}>Solicitações</Button>
      <Button variant={section === "catalog" ? "default" : "outline"} aria-pressed={section === "catalog"} onClick={() => setSection("catalog")}>Catálogo</Button>
      <a className="ml-auto text-sm text-primary underline" href="/conecta/atividades" target="_blank" rel="noopener noreferrer">Abrir formulário público</a>
    </div>
    {section === "catalog" ? <ConectaCatalogPage /> : <ConectaApplications />}
  </div>
}

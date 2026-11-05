"use client"

import { useEffect, useState, type FormEvent } from "react"
import { z } from "zod"
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
    setError("")
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) throw new Error()
      const response = await fetch("/api/conecta/internal/evidence", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ id }) })
      if (!response.ok) throw new Error()
      const url = new URL((await response.json()).url)
      if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) throw new Error()
      window.location.assign(url.href)
    } catch { setError("Não foi possível baixar o comprovante.") }
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
  return <Card><CardHeader><Button className="w-fit" variant="outline" onClick={close}>Voltar à lista</Button><CardTitle>{item.name}</CardTitle><p>{item.modality} · {period(item.starts_on, item.ends_on)} · {labels[item.status]}</p></CardHeader><CardContent className="space-y-5">
    <dl className="grid gap-2 sm:grid-cols-2">{[["CPF",item.cpf],["E-mail",item.email],["WhatsApp",item.phone],["Instituição",item.institution],["Curso",item.course],["Instagram",item.instagram],["Turma, ação ou local",item.activity_reference]].filter(([,value]) => value).map(([label,value]) => <div key={label}><dt className="text-sm text-muted-foreground">{label}</dt><dd className="break-all">{value}</dd></div>)}</dl>
    <div><h3 className="font-semibold">Relato do estudante</h3><p className="whitespace-pre-wrap break-words">{item.report}</p></div>
    {item.status === "returned" && <p className="text-sm text-muted-foreground">O pedido de envio da orientação foi registrado.</p>}
    {item.status === "approved" && <ConectaCertificateActions key={item.id} applicationId={item.id} />}
    <div className="space-y-2"><h3 className="font-semibold">Comprovantes</h3>{item.attachments.map((file, index) => <Button key={file.id} className="mr-2" variant="outline" onClick={() => void download(file.id)}>Baixar comprovante {index + 1}</Button>)}</div>
    <div><h3 className="font-semibold">Histórico na modalidade</h3><p>Total reconhecido: {duration(item.modality_minutes)}</p>{item.history.map(row => <p key={row.id} className="text-sm">{row.modality} · {period(row.starts_on,row.ends_on)} · {labels[row.status]}{row.minutes ? ` · ${duration(row.minutes)}` : ""}</p>)}</div>
    {item.decisions.length > 0 && <div><h3 className="font-semibold">Decisões registradas</h3>{item.decisions.map(decision => <div key={decision.revision} className="text-sm"><p>{labels[decision.decision]} · revisão {decision.revision}{decision.minutes ? ` · ${duration(decision.minutes)}` : ""}</p>{decision.reason && <p>{decision.reason}</p>}</div>)}</div>}
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {item.status === "pending" && <fieldset disabled={busy} className="space-y-3"><legend className="font-semibold">Conferência da equipe</legend>
      {item.mode === "checklist" ? item.tasks.map(task => <label key={task.id} className="flex items-start gap-2">
        <input type="checkbox" checked={chosen.includes(task.id)} onChange={event => setChosen(current => event.target.checked ? [...current, task.id] : current.filter(id => id !== task.id))} />
        <span>{task.label} · {duration(task.minutes)}{item.declared_tasks.includes(task.id) ? " · Informada pelo aluno" : ""}</span>
      </label>) : <div><p>Tempo informado: {duration(item.declared_minutes ?? 0)}</p><Label htmlFor="review-minutes">Tempo conferido (minutos)</Label><Input id="review-minutes" type="number" min={1} step={1} value={minutes} onChange={event => setMinutes(event.target.value)} /></div>}
      <p>Tempo a reconhecer: {duration(total)}</p>
      <div><Label htmlFor="review-reason">Justificativa para ajustes ou recusa</Label><Textarea id="review-reason" maxLength={3000} value={reason} onChange={event => setReason(event.target.value)} /></div>
      <div className="flex flex-wrap gap-2"><Button onClick={() => void decide("approved")}>Aprovar</Button><Button variant="outline" onClick={() => void decide("rejected")}>Recusar</Button><Button variant="outline" onClick={() => void requestCorrection()}>Devolver para correção</Button></div>
    </fieldset>}
    {(item.status === "rejected" || item.status === "returned") && <fieldset disabled={busy} className="space-y-2">
      <Label htmlFor="correction-reason">Orientação para correção</Label><Textarea id="correction-reason" maxLength={3000} value={reason} onChange={event => setReason(event.target.value)} />
      <Button variant="outline" onClick={() => void requestCorrection()}>{item.status === "returned" ? "Renovar link de correção" : "Permitir correção"}</Button>
    </fieldset>}
  </CardContent></Card>
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

"use client"

import { useEffect, useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { catalogSchema, modalityRpcPayload, type CatalogModality } from "@/lib/conecta/catalog"
import { supabase } from "@/lib/supabase"

type Draft = {
  name: string; description: string; projectId: string; projectName: string;
  mode: "checklist" | "free"; tasks: { label: string; minutes: string }[];
}
const initialDraft = (): Draft => ({ name: "", description: "", projectId: "", projectName: "", mode: "checklist", tasks: [{ label: "", minutes: "" }] })

export function ConectaCatalogPage() {
  const [rows, setRows] = useState<CatalogModality[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [draft, setDraft] = useState<Draft | null>(null)
  const [editing, setEditing] = useState<CatalogModality | undefined>()
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    let ignore = false
    async function load() {
      setLoading(true)
      try {
        const { data, error } = await supabase.rpc("conecta_read_catalog", { p_internal: true })
        if (error) throw error
        const result = catalogSchema.parse(data)
        if (!ignore) { setRows(result); setError("") }
      } catch {
        if (!ignore) setError("Não foi possível carregar o catálogo. Confira o acesso e tente novamente.")
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    void load()
    return () => { ignore = true }
  }, [revision])
  const projects = [...new Map(rows.map(row => [row.projectId, row.project])).entries()]
  const change = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft(current => current ? { ...current, [key]: value } : null)
  function edit(row: CatalogModality) {
    setEditing(row)
    setDraft({ name: row.name, description: row.description, projectId: row.projectId, projectName: "", mode: row.mode, tasks: row.tasks.map(task => ({ label: task.label, minutes: String(task.minutes) })) })
    setError("")
  }
  async function save(event: FormEvent) {
    event.preventDefault()
    if (!draft || saving) return
    setError(""); setNotice("")
    let payload
    try {
      payload = modalityRpcPayload({ ...draft, projectId: draft.projectId || undefined, tasks: draft.mode === "free" ? [] : draft.tasks.map(task => ({ ...task, minutes: Number(task.minutes) })) }, editing)
    } catch {
      setError("Confira projeto, nome, descrição e a carga em minutos de cada tarefa.")
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.rpc("conecta_save_modality", payload)
      if (error) { setError(error.code === "40001" ? "A modalidade foi alterada por outro usuário. Atualize o catálogo antes de editar novamente." : "Não foi possível salvar a modalidade."); return }
      setDraft(null); setEditing(undefined); setNotice("Modalidade salva."); setRevision(value => value + 1)
    } catch {
      setError("Não foi possível salvar a modalidade.")
    } finally { setSaving(false) }
  }
  async function toggle(row: CatalogModality) {
    if (saving) return
    setSaving(true); setError(""); setNotice("")
    try {
      const { error } = await supabase.rpc("conecta_set_modality_active", { p_id: row.id, p_active: !row.active })
      if (error) throw error
      setNotice(row.active ? "Modalidade retirada do catálogo público." : "Modalidade publicada."); setRevision(value => value + 1)
    } catch {
      setError("Não foi possível atualizar a publicação.")
    } finally { setSaving(false) }
  }
  return <section className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="text-2xl font-bold">Conecta AFAPAN</h2><p className="text-muted-foreground">Catálogo de atividades complementares</p></div>
      <Button type="button" disabled={saving || loading || Boolean(draft)} onClick={() => { setEditing(undefined); setDraft(initialDraft()); setError("") }}>Nova modalidade</Button>
    </div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <p role="status" className="text-sm">{loading ? "Carregando catálogo..." : notice}</p>
    {!loading && error && !draft && <Button variant="outline" onClick={() => setRevision(value => value + 1)}>Tentar novamente</Button>}
    {draft && <Card><CardHeader><CardTitle>{editing ? "Nova versão da modalidade" : "Nova modalidade"}</CardTitle></CardHeader><CardContent>
      <form onSubmit={save} className="space-y-4">
        <fieldset disabled={saving} className="space-y-4">
          <div><Label htmlFor="conecta-project">Projeto</Label><select id="conecta-project" className="w-full rounded-md border bg-background p-2" disabled={Boolean(editing)} value={draft.projectId} onChange={event => change("projectId", event.target.value)}><option value="">Novo projeto</option>{projects.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></div>
          {!draft.projectId && <div><Label htmlFor="conecta-project-name">Nome do projeto</Label><Input id="conecta-project-name" required maxLength={160} value={draft.projectName} onChange={event => change("projectName", event.target.value)} /></div>}
          <div><Label htmlFor="conecta-name">Nome da modalidade</Label><Input id="conecta-name" required maxLength={160} value={draft.name} onChange={event => change("name", event.target.value)} /></div>
          <div><Label htmlFor="conecta-description">Descrição</Label><Textarea id="conecta-description" maxLength={3000} value={draft.description} onChange={event => change("description", event.target.value)} /></div>
          <div><Label htmlFor="conecta-mode">Forma de registro</Label><select id="conecta-mode" className="w-full rounded-md border bg-background p-2" value={draft.mode} onChange={event => change("mode", event.target.value === "free" ? "free" : "checklist")}><option value="checklist">Checklist de tarefas</option><option value="free">Descrição e horas livres</option></select></div>
          {draft.mode === "checklist" && <fieldset className="space-y-3"><legend className="font-medium">Tarefas</legend>
            {draft.tasks.map((task, index) => <div key={index} className="grid gap-2 sm:grid-cols-[1fr_9rem_auto]">
              <div><Label htmlFor={`conecta-task-${index}`}>Tarefa {index + 1}</Label><Input id={`conecta-task-${index}`} required maxLength={500} value={task.label} onChange={event => change("tasks", draft.tasks.map((row, i) => i === index ? { ...row, label: event.target.value } : row))} /></div>
              <div><Label htmlFor={`conecta-minutes-${index}`}>Minutos</Label><Input id={`conecta-minutes-${index}`} required type="number" min={1} max={9999999} step={1} value={task.minutes} onChange={event => change("tasks", draft.tasks.map((row, i) => i === index ? { ...row, minutes: event.target.value } : row))} /></div>
              <Button className="self-end" type="button" variant="outline" disabled={draft.tasks.length === 1} aria-label={`Remover tarefa ${index + 1}`} onClick={() => change("tasks", draft.tasks.filter((_, i) => i !== index))}>Remover</Button>
            </div>)}
            <Button type="button" variant="outline" disabled={draft.tasks.length >= 100} onClick={() => change("tasks", [...draft.tasks, { label: "", minutes: "" }])}>Adicionar tarefa</Button>
          </fieldset>}
        </fieldset>
        <div className="flex gap-2"><Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar modalidade"}</Button><Button type="button" variant="outline" disabled={saving} onClick={() => { setDraft(null); setEditing(undefined) }}>Cancelar</Button></div>
      </form>
    </CardContent></Card>}
    {!loading && !rows.length && !error && <p>Nenhuma modalidade cadastrada.</p>}
    <div className="grid gap-4 md:grid-cols-2">{rows.map(row => <Card key={row.id}><CardHeader><CardTitle>{row.name}</CardTitle><p className="text-sm text-muted-foreground">{row.project} · Versão {row.version} · {row.active ? "Publicada" : "Retirada"}</p></CardHeader><CardContent className="space-y-3">
      {row.description && <p>{row.description}</p>}
      <p>{row.mode === "free" ? "Horas informadas e conferidas" : `${row.tasks.length} tarefa(s) · ${row.tasks.reduce((sum, task) => sum + task.minutes, 0)} min`}</p>
      <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={saving || Boolean(draft)} onClick={() => edit(row)}>Editar</Button><Button variant="outline" disabled={saving || Boolean(draft)} onClick={() => void toggle(row)}>{row.active ? "Retirar publicação" : "Publicar modalidade"}</Button></div>
    </CardContent></Card>)}</div>
  </section>
}

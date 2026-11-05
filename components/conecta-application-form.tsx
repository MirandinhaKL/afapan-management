"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import { applicationSchema, recognizedMinutes } from "@/lib/conecta/domain"
import { catalogSchema } from "@/lib/conecta/catalog"
import { uploadRequestSchema } from "@/lib/conecta/uploads"

const publicCatalog = z.array(catalogSchema.element.pick({ versionId: true, project: true, name: true, description: true, mode: true, tasks: true }))
const reservationSchema = z.object({ token: z.string(), files: z.array(z.object({ id: z.string().uuid(), path: z.string(), uploadToken: z.string() })) })
const fields = [
  ["name", "Nome completo", "text", 160], ["cpf", "CPF", "text", 20], ["birthDate", "Data de nascimento", "date", 10],
  ["phone", "WhatsApp", "tel", 24], ["email", "E-mail", "email", 254], ["institution", "Instituição de ensino", "text", 160],
  ["course", "Curso", "text", 160], ["instagram", "Instagram (opcional)", "text", 80],
  ["startDate", "Início da atividade", "date", 10], ["endDate", "Fim da atividade", "date", 10],
  ["activityReference", "Turma, ação ou local (opcional)", "text", 160],
] as const

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  return digits.replace(/^(\d{3})(\d)/, "$1.$2").replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2")
}
function formatWhatsapp(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  const split = digits.length === 11 ? 7 : 6
  return `(${digits.slice(0, 2)}) ${digits.slice(2, split)}-${digits.slice(split)}`
}

async function post(url: string, body: unknown) {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
  const result = await response.json().catch(() => null)
  if (!response.ok) throw new Error(typeof result?.error === "string" ? result.error : "Não foi possível concluir o envio.")
  return result
}

export function ConectaApplicationForm() {
  const [catalog, setCatalog] = useState<z.infer<typeof publicCatalog> | null>(null)
  const [catalogError, setCatalogError] = useState(false)
  const [reload, setReload] = useState(0)
  const [versionId, setVersionId] = useState("")
  const [selected, setSelected] = useState<string[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [cpfValue, setCpfValue] = useState("")
  const [phoneValue, setPhoneValue] = useState("")
  const lock = useRef(false)
  const attempt = useRef<{ input: string; files: File[]; token: string; ids: string[] } | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    setCatalogError(false)
    void fetch("/api/conecta/catalog", { cache: "no-store", signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error("Catálogo indisponível")
        const data = publicCatalog.parse(await response.json())
        if (!controller.signal.aborted) setCatalog(data)
      }).catch(() => { if (!controller.signal.aborted) setCatalogError(true) })
    return () => controller.abort()
  }, [reload])
  const modality = catalog?.find(item => item.versionId === versionId)
  const minutes = modality?.tasks.filter(task => selected.includes(task.id)).reduce((sum, task) => sum + task.minutes, 0) ?? 0
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (lock.current || !modality) return
    setError("")
    const form = new FormData(event.currentTarget)
    const input = { ...Object.fromEntries(fields.map(([key]) => [key, String(form.get(key) ?? "")])),
      cpf: cpfValue.replace(/\D/g, ""), phone: phoneValue.replace(/\D/g, ""),
      report: String(form.get("report") ?? ""), modalityVersion: modality.versionId, tasks: selected,
      ...(modality.mode === "free" ? { declaredMinutes: Number(form.get("hours")) * 60 + Number(form.get("minutes")) } : {}),
    }
    const metadata = uploadRequestSchema.safeParse({ files: files.map(file => ({ mime: file.type, bytes: file.size })) })
    if (!metadata.success) { setError("Anexe de 1 a 5 comprovantes válidos, respeitando os limites de formato e tamanho."); return }
    const validated = applicationSchema.safeParse({ ...input, attachments: files.map((_, index) => `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`) })
    if (!validated.success) { setError(validated.error.issues[0]?.message ?? "Confira os dados informados."); return }
    try { recognizedMinutes(modality.mode === "free" ? { mode: "free" } : { mode: "checklist", tasks: modality.tasks }, selected, input.declaredMinutes) }
    catch (error) { setError(error instanceof Error ? error.message : "Confira as tarefas e horas."); return }
    lock.current = true
    setBusy(true)
    try {
      const key = JSON.stringify(input)
      let pending = attempt.current
      if (!pending || pending.input !== key || pending.files.length !== files.length || pending.files.some((file, i) => file !== files[i])) {
        const reservation = reservationSchema.parse(await post("/api/conecta/uploads", metadata.data))
        if (reservation.files.length !== files.length) throw new Error("Não foi possível preparar os comprovantes.")
        for (const [index, destination] of reservation.files.entries()) {
          const { error } = await supabase.storage.from("conecta-documents").uploadToSignedUrl(destination.path, destination.uploadToken, files[index], { upsert: false })
          if (error) throw new Error("Não foi possível enviar um comprovante. Confira sua conexão e tente novamente.")
        }
        pending = { input: key, files, token: reservation.token, ids: reservation.files.map(file => file.id) }
        attempt.current = pending
      }
      try {
        const result = await post("/api/conecta/submit", { token: pending.token, application: { ...input, attachments: pending.ids } })
        if (result?.success !== true) throw new Error("Não foi possível confirmar o registro. Tente novamente.")
      } catch (error) {
        if (error instanceof Error && error.message.includes("Sessão de comprovantes expirada")) attempt.current = null
        throw error
      }
      setSent(true)
    } catch (error) { setError(error instanceof Error ? error.message : "Não foi possível registrar a atividade.") }
    finally { lock.current = false; setBusy(false) }
  }

  if (sent) return <Card><CardContent className="space-y-3"><h2 className="text-xl font-semibold">Atividade recebida</h2><p>O pedido está aguardando análise da equipe.</p><Button variant="outline" onClick={() => { attempt.current = null; setVersionId(""); setSelected([]); setFiles([]); setSent(false) }}>Registrar outra atividade</Button></CardContent></Card>
  if (catalogError) return <div className="space-y-3"><p role="alert">Não foi possível carregar as modalidades.</p><Button onClick={() => setReload(value => value + 1)}>Tentar novamente</Button></div>
  if (!catalog) return <p role="status">Carregando modalidades...</p>
  if (!catalog.length) return <p>Nenhuma modalidade está disponível para envio no momento.</p>
  return <Card><CardContent>
    <form onSubmit={submit} className="space-y-5">
      <fieldset disabled={busy} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">{fields.map(([key, label, type, max]) =>
          <div key={key} className="space-y-2"><Label htmlFor={`application-${key}`}>{label}</Label><Input id={`application-${key}`} name={key} type={type} maxLength={max} required={key !== "instagram" && key !== "activityReference"}
            value={key === "cpf" ? cpfValue : key === "phone" ? phoneValue : undefined}
            inputMode={key === "cpf" || key === "phone" ? "numeric" : undefined}
            autoComplete={key === "cpf" ? "off" : key === "phone" ? "tel" : key === "email" ? "email" : undefined}
            onChange={key === "cpf" ? event => setCpfValue(formatCpf(event.target.value)) : key === "phone" ? event => setPhoneValue(formatWhatsapp(event.target.value)) : undefined}
          /></div>
        )}</div>
        <div className="space-y-2"><Label htmlFor="application-modality">Modalidade</Label><select id="application-modality" required className="w-full rounded-md border bg-background p-2" value={versionId} onChange={event => { setVersionId(event.target.value); setSelected([]) }}>
          <option value="">Selecione</option>{catalog.map(item => <option key={item.versionId} value={item.versionId}>{item.project} · {item.name}</option>)}
        </select></div>
        {modality?.description && <p>{modality.description}</p>}
        {modality?.mode === "checklist" && <fieldset className="space-y-2"><legend className="font-medium">Tarefas que você realizou</legend>{modality.tasks.map(task => <label key={task.id} className="flex items-start gap-2 rounded-md border p-3">
          <input type="checkbox" className="mt-1" checked={selected.includes(task.id)} onChange={event => setSelected(current => event.target.checked ? [...current, task.id] : current.filter(id => id !== task.id))} />
          <span>{task.label} · {task.minutes} min</span>
        </label>)}<p className="text-sm text-muted-foreground">Tempo informado: {Math.floor(minutes / 60)} h {minutes % 60} min. A equipe fará a conferência.</p></fieldset>}
        {modality?.mode === "free" && <div className="grid grid-cols-2 gap-4"><div><Label htmlFor="application-hours">Horas realizadas</Label><Input id="application-hours" name="hours" type="number" min={0} step={1} defaultValue={0} required /></div><div><Label htmlFor="application-minutes">Minutos adicionais</Label><Input id="application-minutes" name="minutes" type="number" min={0} max={59} step={1} defaultValue={0} required /></div></div>}
        <div><Label htmlFor="application-report">Descreva o que você realizou</Label><Textarea id="application-report" name="report" required maxLength={5000} /></div>
        <div><Label htmlFor="application-evidence">Comprovantes obrigatórios</Label><Input id="application-evidence" type="file" multiple required accept="image/jpeg,image/png,image/webp,application/pdf,video/mp4,video/webm" onChange={event => setFiles(Array.from(event.target.files ?? []))} /><p className="text-sm text-muted-foreground">Até 5 arquivos: imagem (10 MB), PDF (15 MB) ou vídeo (50 MB), com até 100 MB no total.</p></div>
      </fieldset>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button disabled={busy || !modality} type="submit">{busy ? "Enviando..." : "Enviar para validação"}</Button>
    </form>
  </CardContent></Card>
}

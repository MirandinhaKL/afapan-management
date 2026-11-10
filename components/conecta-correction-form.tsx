"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import { correctionTokenSchema } from "@/lib/conecta/domain"
import { uploadRequestSchema } from "@/lib/conecta/uploads"

const detailSchema = z.object({
  name: z.string(), mode: z.enum(["checklist","free"]), report: z.string(),
  selected: z.array(z.string()), minutes: z.number().nullable(), reason: z.string().nullable(),
  tasks: z.array(z.object({ id: z.string(), label: z.string(), minutes: z.number() })),
})
const reservationSchema = z.object({ token: correctionTokenSchema, files: z.array(z.object({ id: z.string().uuid(), path: z.string(), uploadToken: z.string() })) })
async function post(path: string, input: unknown) {
  const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) })
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(typeof data?.error === "string" ? data.error : "Não foi possível continuar.")
  return data
}
export function ConectaCorrectionForm() {
  const secret = useRef<string | null>(null)
  const lock = useRef(false)
  const attempt = useRef<{ token: string; ids: string[]; files: File[] } | null>(null)
  const [detail, setDetail] = useState<z.infer<typeof detailSchema> | null>(null)
  const [tasks, setTasks] = useState<string[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let current = true
    const token = secret.current ?? window.location.hash.slice(1)
    if (!correctionTokenSchema.safeParse(token).success) { setError("Link de correção indisponível."); return }
    secret.current = token
    window.history.replaceState(null, "", window.location.pathname)
    setError("")
    void post("/api/conecta/correction", { token }).then(data => {
      const result = detailSchema.parse(data)
      if (current) { setDetail(result); setTasks(result.selected) }
    }).catch(() => { if (current) setError("Não foi possível abrir o link. Ele pode estar indisponível ou expirado.") })
    return () => { current = false }
  }, [retry])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!detail || !secret.current || lock.current) return
    const form = new FormData(event.currentTarget)
    const metadata = uploadRequestSchema.safeParse({ files: files.map(file => ({ mime: file.type, bytes: file.size })) })
    if (!metadata.success) { setError("Anexe de 1 a 5 comprovantes válidos."); return }
    lock.current = true; setBusy(true); setError("")
    try {
      let upload = attempt.current
      if (!upload || upload.files !== files) {
        const reservation = reservationSchema.parse(await post("/api/conecta/uploads", metadata.data))
        if (reservation.files.length !== files.length) throw new Error("Não foi possível preparar os comprovantes.")
        for (const [i, destination] of reservation.files.entries()) {
          const { error } = await supabase.storage.from("conecta-documents").uploadToSignedUrl(destination.path, destination.uploadToken, files[i], { upsert: false })
          if (error) throw new Error("Não foi possível enviar um comprovante.")
        }
        upload = { token: reservation.token, ids: reservation.files.map(file => file.id), files }
        attempt.current = upload
      }
      const result = await post("/api/conecta/submit", { token: upload.token, correctionToken: secret.current,
        application: { report: String(form.get("report") ?? ""), attachments: upload.ids, tasks,
          ...(detail.mode === "free" ? { declaredMinutes: Number(form.get("minutes")) } : {}) },
      })
      if (result?.success !== true) throw new Error("Não foi possível confirmar a correção.")
      setSent(true)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível enviar a correção."
      if (message.includes("expirada") || message.includes("já utilizada")) attempt.current = null
      setError(message)
    } finally { lock.current = false; setBusy(false) }
  }
  if (sent) return <p role="status">Correção recebida. A solicitação voltou para análise.</p>
  if (!detail) return error ? <div className="space-y-2"><p role="alert">{error}</p><Button onClick={() => setRetry(value => value + 1)}>Tentar novamente</Button></div> : <p role="status">Abrindo solicitação...</p>
  return <form onSubmit={submit} className="space-y-4">
    <h2 className="text-xl font-semibold">{detail.name}</h2>
    {detail.reason && <p className="whitespace-pre-wrap">Orientação da equipe: {detail.reason}</p>}
    <fieldset disabled={busy} className="space-y-4">
      <div><Label htmlFor="correction-report">Relato atualizado</Label><Textarea id="correction-report" name="report" defaultValue={detail.report} required maxLength={5000} /></div>
      {detail.mode === "checklist" ? <fieldset className="space-y-2"><legend>Tarefas realizadas</legend>{detail.tasks.map(task => <label key={task.id} className="flex items-start gap-2"><input type="checkbox" checked={tasks.includes(task.id)} onChange={event => setTasks(current => event.target.checked ? [...current, task.id] : current.filter(id => id !== task.id))} /><span>{task.label} · {task.minutes} min</span></label>)}</fieldset> :
        <div><Label htmlFor="correction-minutes">Tempo realizado (minutos)</Label><Input id="correction-minutes" type="number" name="minutes" min={1} step={1} defaultValue={detail.minutes ?? undefined} required /></div>}
      <div className="space-y-2"><Label htmlFor="correction-files">Comprovantes da revisão</Label><Input id="correction-files" type="file" className="h-auto py-2 file:mr-4 file:rounded-md file:bg-muted file:px-3 file:py-1" multiple required accept="image/jpeg,image/png,image/webp,application/pdf,video/mp4,video/webm" onChange={event => setFiles(Array.from(event.target.files ?? []))} /><p className="text-sm text-muted-foreground">Até 5 arquivos, com no máximo 50 MB no total. Os comprovantes anteriores permanecem no histórico.</p></div>
    </fieldset>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <Button type="submit" disabled={busy}>{busy ? "Enviando..." : "Enviar correção"}</Button>
  </form>
}

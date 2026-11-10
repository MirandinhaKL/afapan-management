"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"

type Certificate = {
  id: string
  code: string
  generated: boolean
  published: boolean
  invalidated: boolean
  invalidationReason?: string | null
}

async function certificateRequest(action: "status" | "generate" | "download" | "invalidate", id: string, reason?: string, signal?: AbortSignal) {
  const { data } = await supabase.auth.getSession()
  if (!data.session) throw new Error("Entre novamente para acessar o certificado.")
  const response = await fetch("/api/conecta/internal/certificate", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` },
    body: JSON.stringify({ action, id, reason }),
    signal,
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error)
  return result
}

export function ConectaCertificateActions({ applicationId }: { applicationId: string }) {
  const [certificate, setCertificate] = useState<Certificate | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<"generate" | "download" | "invalidate" | null>(null)
  const busy = processing !== null
  const [error, setError] = useState("")
  const [reason, setReason] = useState("")
  const [confirming, setConfirming] = useState(false)
  const [reload, setReload] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    void certificateRequest("status", applicationId, undefined, controller.signal)
      .then(result => { if (!controller.signal.aborted) setCertificate(result.certificate) })
      .catch(error => { if (!controller.signal.aborted) setError(error.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [applicationId, reload])

  async function act(action: "generate" | "invalidate") {
    if (busy) return
    setProcessing(action === "generate" && certificate?.generated && !certificate.invalidated ? "download" : action)
    setError("")
    try {
      if (action === "generate") {
        const { url, filename } = await certificateRequest(certificate?.generated && !certificate.invalidated ? "download" : action, applicationId)
        const response = await fetch(url)
        if (!response.ok) throw new Error("Não foi possível baixar o PDF. Tente novamente.")
        const blob = await response.blob()
        const downloadUrl = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = downloadUrl
        link.download = filename
        document.body.appendChild(link)
        link.click()
        link.remove()
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 60_000)
      } else if (certificate) {
        await certificateRequest(action, certificate.id, reason.trim())
        setConfirming(false)
        setReason("")
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Não foi possível atualizar o certificado.")
    } finally {
      setReload(value => value + 1)
      setProcessing(null)
    }
  }

  return <section className="space-y-3" aria-busy={busy}>
    <h3 className="font-semibold">Certificado</h3>
    {loading ? <p role="status">Carregando emissão...</p> : <>
      {certificate && <p>Código {certificate.code.match(/.{4}/g)?.join("-")} · {certificate.invalidated ? "Invalidado" : certificate.published ? "Publicado" : "Aguardando assinatura"}</p>}
      {certificate?.invalidated && certificate.invalidationReason && <div className="space-y-1 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm">
        <p className="font-semibold">Motivo da invalidação</p>
        <p className="whitespace-pre-wrap break-words">{certificate.invalidationReason}</p>
      </div>}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={busy} onClick={() => void act("generate")}>
          {(processing === "generate" || processing === "download") && <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
          {processing === "generate" ? "Gerando certificado…" : processing === "download" ? "Preparando download…" : certificate?.invalidated ? "Gerar nova emissão" : certificate?.generated ? "Baixar certificado" : "Gerar certificado"}
        </Button>
        {certificate && !certificate.invalidated && !confirming &&
          <Button type="button" variant="outline" disabled={busy} onClick={() => setConfirming(true)}>Invalidar emissão</Button>}
      </div>
      {confirming && <form className="space-y-2" onSubmit={event => { event.preventDefault(); if (reason.trim()) void act("invalidate") }}>
        <Label htmlFor="conecta-certificate-invalidation">Motivo da invalidação</Label>
        <Textarea id="conecta-certificate-invalidation" required maxLength={3000} value={reason} onChange={event => setReason(event.target.value)} disabled={busy} />
        <Button type="submit" variant="destructive" disabled={busy || !reason.trim()}>Confirmar invalidação</Button>
        <Button type="button" variant="ghost" disabled={busy} onClick={() => setConfirming(false)}>Cancelar</Button>
      </form>}
    </>}
    {busy && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div role="status" className="flex max-w-sm flex-col items-center gap-4 rounded-xl bg-background p-8 text-center shadow-xl">
        <Loader2 className="size-10 animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" />
        <p className="font-semibold">{processing === "generate" ? "Gerando certificado. Aguarde a conclusão." : processing === "download" ? "Preparando o PDF para download. Aguarde." : "Invalidando emissão. Aguarde."}</p>
      </div>
    </div>}
    {error && <p role="alert" className="text-destructive">{error}</p>}
  </section>
}

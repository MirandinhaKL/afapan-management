"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"

type Certificate = { id: string; code: string; generated: boolean; published: boolean; invalidated: boolean }

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
  const [busy, setBusy] = useState(false)
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
    setBusy(true)
    setError("")
    try {
      if (action === "generate") {
        const { url } = await certificateRequest(certificate?.generated && !certificate.invalidated ? "download" : action, applicationId)
        window.location.assign(url)
      } else if (certificate) {
        await certificateRequest(action, certificate.id, reason.trim())
        setConfirming(false)
        setReason("")
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Não foi possível atualizar o certificado.")
    } finally {
      setReload(value => value + 1)
      setBusy(false)
    }
  }

  return <section className="space-y-3">
    <h3 className="font-semibold">Certificado</h3>
    {loading ? <p role="status">Carregando emissão...</p> : <>
      {certificate && <p>Código {certificate.code.match(/.{4}/g)?.join("-")} · {certificate.invalidated ? "Invalidado" : certificate.published ? "Publicado" : "Aguardando assinatura"}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={busy} onClick={() => void act("generate")}>
          {certificate?.invalidated ? "Gerar nova emissão" : certificate?.generated ? "Baixar PDF original" : "Gerar certificado"}
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
    {error && <p role="alert" className="text-destructive">{error}</p>}
  </section>
}

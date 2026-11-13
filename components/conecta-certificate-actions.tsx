"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import { signedCertificateLimit } from "@/lib/conecta/signed-certificate"

type Certificate = {
  id: string
  code: string
  generated: boolean
  published: boolean
  invalidated: boolean
  invalidationReason?: string | null
}

async function requestCertificate(path: string, body: object, signal?: AbortSignal) {
  const { data } = await supabase.auth.getSession()
  if (!data.session) throw new Error("Entre novamente para acessar o certificado.")
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` },
    body: JSON.stringify(body),
    signal,
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error)
  return result
}

async function savePdf(url: string, filename: string) {
  const response = await fetch(url)
  if (!response.ok) throw new Error("Não foi possível baixar o PDF. Tente novamente.")
  const downloadUrl = URL.createObjectURL(await response.blob())
  const link = document.createElement("a")
  link.href = downloadUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 60_000)
}

const certificateEndpoint = "/api/conecta/internal/certificate"
const signedEndpoint = "/api/conecta/internal/signed-certificate"
const progressMessages = {
  generate: "Gerando certificado. Aguarde a conclusão.",
  download: "Preparando o PDF para download. Aguarde.",
  invalidate: "Invalidando emissão. Aguarde.",
  "attach-signed": "Enviando e conferindo o PDF assinado. Aguarde.",
  "download-signed": "Preparando o PDF assinado para download. Aguarde.",
}

export function ConectaCertificateActions({ applicationId }: { applicationId: string }) {
  const [certificate, setCertificate] = useState<Certificate | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<keyof typeof progressMessages | null>(null)
  const busy = processing !== null
  const [error, setError] = useState("")
  const [reason, setReason] = useState("")
  const [confirming, setConfirming] = useState(false)
  const [reload, setReload] = useState(0)
  const [signedFile, setSignedFile] = useState<File | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const uploaded = useRef<{ certificateId: string; uploadId: string } | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    void requestCertificate(certificateEndpoint, { action: "status", id: applicationId }, controller.signal)
      .then(result => { if (!controller.signal.aborted) setCertificate(result.certificate) })
      .catch(error => { if (!controller.signal.aborted) setError(error.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [applicationId, reload])

  async function act(action: "generate" | "invalidate" | "attach-signed" | "download-signed") {
    if (busy) return
    setProcessing(action === "generate" && certificate?.generated && !certificate.invalidated ? "download" : action)
    setError("")
    try {
      if (action === "generate") {
        const requestAction = certificate?.generated && !certificate.invalidated ? "download" : action
        const { url, filename } = await requestCertificate(certificateEndpoint, { action: requestAction, id: applicationId })
        await savePdf(url, filename)
      } else if (action === "invalidate" && certificate) {
        await requestCertificate(certificateEndpoint, { action, id: certificate.id, reason: reason.trim() })
        setConfirming(false)
        setReason("")
        uploaded.current = null
        setSignedFile(null)
        setConfirmed(false)
      } else if (action === "download-signed" && certificate) {
        const { url, filename } = await requestCertificate(signedEndpoint, { action: "download", applicationId, certificateId: certificate.id })
        await savePdf(url, filename)
      } else if (action === "attach-signed" && certificate && signedFile && confirmed) {
        const ids = { applicationId, certificateId: certificate.id }
        if (uploaded.current?.certificateId !== certificate.id) {
          const { uploadId, path, token } = await requestCertificate(signedEndpoint, { action: "reserve", ...ids, bytes: signedFile.size })
          const result = await supabase.storage.from("conecta-documents").uploadToSignedUrl(path, token, signedFile, { contentType: "application/pdf", upsert: false })
          if (result.error) throw new Error("Não foi possível enviar o PDF assinado. Tente novamente.")
          uploaded.current = { certificateId: certificate.id, uploadId }
        }
        await requestCertificate(signedEndpoint, { action: "confirm", ...ids, uploadId: uploaded.current.uploadId, confirmed })
        uploaded.current = null
        setSignedFile(null)
        setConfirmed(false)
        setReload(value => value + 1)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Não foi possível atualizar o certificado.")
    } finally {
      if (action !== "attach-signed") setReload(value => value + 1)
      setProcessing(null)
    }
  }

  return <section className="space-y-3" aria-busy={busy}>
    <h3 className="font-semibold">Certificado</h3>
    {loading ? <p role="status">Carregando emissão...</p> : <>
      {certificate && <p>Código {certificate.code.match(/.{4}/g)?.join("-")} · {certificate.invalidated ? "Invalidado" : certificate.published ? "Assinado e conferido" : "Aguardando assinatura"}</p>}
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
        {certificate?.published && !certificate.invalidated &&
          <Button type="button" variant="outline" disabled={busy} onClick={() => void act("download-signed")}>Baixar PDF assinado</Button>}
      </div>
      {certificate?.generated && !certificate.published && !certificate.invalidated &&
        <fieldset className="space-y-3 rounded-md border p-4" disabled={busy || confirming}>
          <legend className="px-1 font-semibold">PDF assinado</legend>
          <p className="text-sm text-muted-foreground">Assine o PDF original fora do sistema. Confira o código e os dados da emissão no arquivo assinado antes de anexá-lo.</p>
          <div className="space-y-2">
            <Label htmlFor="conecta-signed-certificate">Selecionar PDF assinado (até 10 MB)</Label>
            <Input id="conecta-signed-certificate" type="file" accept="application/pdf,.pdf" onChange={event => {
              const file = event.target.files?.[0] ?? null
              uploaded.current = null
              setConfirmed(false)
              if (file && (!/\.pdf$/i.test(file.name) || file.size === 0 || file.size > signedCertificateLimit)) {
                setError("Selecione um PDF de até 10 MB.")
                setSignedFile(null)
                event.target.value = ""
                return
              }
              setError("")
              setSignedFile(file)
            }} />
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input className="mt-1" type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} />
            <span>Conferi que o PDF está assinado e corresponde a esta emissão.</span>
          </label>
          <Button type="button" disabled={!signedFile || !confirmed} onClick={() => void act("attach-signed")}>Anexar e confirmar PDF assinado</Button>
        </fieldset>}
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
        <p className="font-semibold">{processing && progressMessages[processing]}</p>
      </div>
    </div>}
    {error && <p role="alert" className="text-destructive">{error}</p>}
  </section>
}

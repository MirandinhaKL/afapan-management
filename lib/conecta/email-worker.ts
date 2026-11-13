import { createHash, randomUUID } from "node:crypto"
import { z } from "zod"
import { certificateFilename } from "./certificate"
import { conectaBucket, correctionToken, sha256 } from "./http-server"
import { signedCertificateLimit } from "./signed-certificate"
import type { createSupabaseServiceClient } from "@/lib/supabase-server"

const contextSchema = z.discriminatedUnion("purpose", [
  z.object({
    purpose: z.enum(["certificate", "resend"]),
    eventKey: z.string(), recipient: z.string().email(),
    name: z.string(), modality: z.string(), code: z.string().regex(/^[A-F0-9]{32}$/),
    signedKey: z.string().startsWith("certificates/"), signedHash: z.string().regex(/^[a-f0-9]{64}$/),
  }),
  z.object({
    purpose: z.literal("correction"), eventKey: z.string(), recipient: z.string().email(), reason: z.string(),
    correctionId: z.string().uuid(), tokenHash: z.string().regex(/^[a-f0-9]{64}$/),
  }),
  z.object({ purpose: z.literal("rejection"), eventKey: z.string(), recipient: z.string().email(), reason: z.string() }),
])
type Context = z.infer<typeof contextSchema>
type Result = "accepted" | "failed" | "uncertain"
type Message = {
  recipient: string
  eventKey: string
  subject: string
  html: string
  attachment?: { filename: string; bytes: Uint8Array }
}
export type EmailProvider = { send: (message: Message) => Promise<Result> }

export const simulatedEmailProvider: EmailProvider = {
  async send() { return "accepted" },
}

const entities: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }
const escape = (value: string) => value.replace(/[&<>"']/g, character => entities[character])

export function emailMessage(context: Context, origin: string, attachment?: Message["attachment"]): Message {
  const { recipient, eventKey } = context
  if (context.purpose === "correction") {
    const url = new URL("/conecta/solicitacoes/corrigir", origin)
    const token = correctionToken(context.correctionId)
    if (sha256(token) !== context.tokenHash) throw new Error("Chave do link de correção divergente")
    url.hash = token
    return {
      recipient, eventKey, subject: "Conecta AFAPAN · Ajuste sua solicitação",
      html: `<p>A equipe da AFAPAN solicitou uma correção.</p><p>${escape(context.reason)}</p><p><a href="${escape(url.href)}">Corrigir solicitação</a></p>`,
    }
  }
  if (context.purpose === "rejection") return {
    recipient, eventKey, subject: "Conecta AFAPAN · Resultado da análise",
    html: `<p>Sua solicitação foi recusada pela equipe.</p><p>${escape(context.reason)}</p>`,
  }
  if (!attachment) throw new Error("Certificado assinado indisponível")
  const url = new URL("/conecta/certificados/validar", origin)
  url.searchParams.set("codigo", context.code)
  return {
    recipient, eventKey, subject: "Conecta AFAPAN · Certificado assinado",
    html: `<p>Segue o certificado assinado de ${escape(context.name)} para a atividade ${escape(context.modality)}.</p><p>Código: ${context.code}</p><p><a href="${escape(url.href)}">Consultar certificado</a></p>`,
    attachment,
  }
}

type Service = ReturnType<typeof createSupabaseServiceClient>
export async function runEmailSimulation(service: Service, origin: string, provider = simulatedEmailProvider) {
  const lease = randomUUID()
  const claim = await service.rpc("conecta_claim_email_simulation", { p_lease: lease })
  if (claim.error) throw claim.error
  if (!claim.data) return { status: "idle" } as const
  const jobId = z.string().uuid().parse(claim.data)
  const args = { p_id: jobId, p_lease: lease }

  async function context() {
    const response = await service.rpc("conecta_email_simulation_context", args)
    if (response.error) throw response.error
    return response.data === null ? null : contextSchema.parse(response.data)
  }

  let result: Result | "cancelled" = "failed"
  try {
    const initial = await context()
    if (!initial) {
      result = "cancelled"
    } else {
      let attachment: Message["attachment"]
      if (initial.purpose === "certificate" || initial.purpose === "resend") {
        const signed = await service.storage.from(conectaBucket).createSignedUrl(initial.signedKey, 60)
        if (signed.error) throw signed.error
        const response = await fetch(signed.data.signedUrl, { cache: "no-store", signal: AbortSignal.timeout(30_000) })
        if (!response.ok) throw new Error("PDF indisponível")
        const blob = await response.blob()
        if (blob.size === 0 || blob.size > signedCertificateLimit) throw new Error("PDF fora do limite")
        const bytes = new Uint8Array(await blob.arrayBuffer())
        if (createHash("sha256").update(bytes).digest("hex") !== initial.signedHash) throw new Error("Hash do PDF divergente")
        attachment = { filename: certificateFilename(initial.name).replace(/\.pdf$/, "-assinado.pdf"), bytes }
      }
      const latest = await context()
      if (!latest || JSON.stringify(latest) !== JSON.stringify(initial)) {
        result = "cancelled"
      } else {
        const message = emailMessage(latest, origin, attachment)
        try {
          result = await provider.send(message)
        } catch {
          result = "uncertain"
        }
      }
    }
  } catch {
    result = "failed"
  }
  const finish = await service.rpc("conecta_finish_email_simulation", { ...args, p_result: result })
  if (finish.error) throw finish.error
  return { jobId, status: finish.data === true ? result : "uncertain" }
}

import { createHash, randomBytes } from "node:crypto"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { z } from "zod"
import { createSupabaseServiceClient } from "@/lib/supabase-server"
import { certificateFilename, certificateSnapshot, renderCertificate } from "@/lib/conecta/certificate"
import { conectaBucket, conectaResponse, readSmallJson } from "@/lib/conecta/http-server"
import { conectaInternalSession } from "@/lib/conecta/internal-server"

const id = z.string().uuid()
const inputSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("status"), id }).strict(),
  z.object({ action: z.literal("generate"), id }).strict(),
  z.object({ action: z.literal("download"), id }).strict(),
  z.object({ action: z.literal("invalidate"), id, reason: z.string().trim().min(1).max(3000) }).strict(),
])
const reservationSchema = z.object({
  id, snapshot: certificateSnapshot, path: z.string().nullable(), sha256: z.string().nullable(),
})
const digest = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex")

export async function POST(request: Request) {
  const input = inputSchema.safeParse(await readSmallJson(request).catch(() => null))
  if (!input.success) return conectaResponse({ error: "Dados do certificado inválidos." }, 400)
  try {
    const session = await conectaInternalSession(request)
    if (!session) return conectaResponse({ error: "Entre novamente para acessar o certificado." }, 401)
    const { action, id } = input.data
    const { client, userId } = session
    if (action === "status") {
      const result = await client.rpc("conecta_certificate_status", { p_id: id })
      if (result.error) throw result.error
      return conectaResponse({ certificate: result.data })
    }
    if (input.data.action === "invalidate") {
      const result = await client.rpc("conecta_invalidate_certificate", { p_id: id, p_reason: input.data.reason })
      if (result.error) throw result.error
      return conectaResponse({ success: true })
    }
    if (action === "download") {
      const result = await client.rpc("conecta_certificate_status", { p_id: id })
      if (result.error) throw result.error
      const current = z.object({ id: z.string().uuid(), generated: z.literal(true), invalidated: z.literal(false) }).safeParse(result.data)
      if (!current.success) return conectaResponse({ error: "O PDF da emissão vigente está indisponível." }, 409)
      const application = await client.rpc("conecta_get_application", { p_id: id })
      if (application.error) throw application.error
      const filename = certificateFilename(z.object({ name: z.string() }).parse(application.data).name)
      const path = `certificates/${current.data.id}/original.pdf`
      const signed = await createSupabaseServiceClient().storage.from(conectaBucket)
        .createSignedUrl(path, 60, { download: filename })
      if (signed.error) throw signed.error
      return conectaResponse({ url: signed.data.signedUrl, filename })
    }
    const supabase = createSupabaseServiceClient()
    const reserved = await supabase.rpc("conecta_reserve_certificate", {
      p_id: id, p_actor: userId, p_code: randomBytes(16).toString("hex").toUpperCase(),
      p_config: { city: process.env.CONECTA_CERTIFICATE_CITY ?? "Farroupilha, RS" },
    })
    if (reserved.error?.code === "22023") return conectaResponse({ error: "A solicitação não está aprovada ou não foi possível identificar quem aprovou as horas." }, 503)
    if (reserved.error) throw reserved.error
    const certificate = reservationSchema.parse(reserved.data)
    const path = `certificates/${certificate.id}/original.pdf`
    const bucket = supabase.storage.from(conectaBucket)
    if (!certificate.path) {
      const existing = await bucket.download(path)
      let hash: string
      if (existing.data) {
        hash = digest(new Uint8Array(await existing.data.arrayBuffer()))
      } else {
        const logo = await readFile(join(process.cwd(), "public", "afapan-favicon-master.png"))
        const bytes = renderCertificate(certificate.snapshot, logo)
        hash = digest(bytes)
        const uploaded = await bucket.upload(path, bytes, { contentType: "application/pdf", upsert: false })
        if (uploaded.error) {
          const concurrent = await bucket.download(path)
          if (!concurrent.data || digest(new Uint8Array(await concurrent.data.arrayBuffer())) !== hash) throw uploaded.error
        }
      }
      const finalized = await supabase.rpc("conecta_finish_certificate", { p_id: certificate.id, p_hash: hash })
      if (finalized.error) throw finalized.error
    }
    const filename = certificateFilename(certificate.snapshot.name)
    const signed = await bucket.createSignedUrl(path, 60, { download: filename })
    if (signed.error) throw signed.error
    return conectaResponse({ url: signed.data.signedUrl, filename })
  } catch (error) {
    const code = (error as { code?: string })?.code
    if (code === "42501") return conectaResponse({ error: "Acesso interno necessário." }, 403)
    if (code === "40001") return conectaResponse({ error: "A emissão ou a solicitação foi alterada. Atualize a página." }, 409)
    return conectaResponse({ error: "Não foi possível concluir a operação do certificado." }, 503)
  }
}

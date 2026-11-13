import { createHash, randomUUID } from "node:crypto"
import { PDFDocument } from "pdf-lib"
import { z } from "zod"
import { certificateFilename } from "@/lib/conecta/certificate"
import { conectaBucket, conectaResponse, readSmallJson } from "@/lib/conecta/http-server"
import { conectaInternalSession } from "@/lib/conecta/internal-server"
import { signedCertificateLimit } from "@/lib/conecta/signed-certificate"
import { createSupabaseServiceClient } from "@/lib/supabase-server"

const uuid = z.string().uuid()
const ids = { applicationId: uuid, certificateId: uuid }
const inputSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("reserve"), ...ids, bytes: z.number().int().positive().max(signedCertificateLimit) }).strict(),
  z.object({ action: z.literal("confirm"), ...ids, uploadId: uuid, confirmed: z.literal(true) }).strict(),
  z.object({ action: z.literal("download"), ...ids }).strict(),
])
const contextSchema = z.object({ originalHash: z.string(), signedKey: z.string().nullable(), name: z.string() })

async function readPdf(response: Response) {
  if (!response.ok || !response.body) return null
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let length = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      length += value.length
      if (length > signedCertificateLimit) return null
      chunks.push(value)
    }
  } finally {
    await reader.cancel().catch(() => {})
    reader.releaseLock()
  }
  const bytes = Buffer.concat(chunks, length)
  if (!bytes.subarray(0, 5).equals(Buffer.from("%PDF-")) ||
      !/%%EOF\s*$/.test(bytes.subarray(-1024).toString("latin1"))) return null
  try {
    const pdf = await PDFDocument.load(bytes, { updateMetadata: false, throwOnInvalidObject: true })
    return pdf.getPageCount() > 0 ? bytes : null
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  const input = inputSchema.safeParse(await readSmallJson(request).catch(() => null))
  if (!input.success) return conectaResponse({ error: "Selecione um PDF de até 10 MB e confirme a conferência." }, 400)
  const { action, applicationId, certificateId } = input.data
  try {
    const session = await conectaInternalSession(request)
    if (!session) return conectaResponse({ error: "Entre novamente para acessar o certificado." }, 401)
    const service = createSupabaseServiceClient()
    const args = { p_application: applicationId, p_certificate: certificateId, p_actor: session.userId }
    const context = await service.rpc("conecta_signed_certificate_context", args)
    if (context.error) throw context.error
    if (!context.data) return conectaResponse({ error: "A emissão está indisponível. Atualize a solicitação." }, 409)
    const certificate = contextSchema.parse(context.data)
    const bucket = service.storage.from(conectaBucket)
    if (action === "download") {
      if (!certificate.signedKey) return conectaResponse({ error: "O PDF assinado ainda está indisponível." }, 409)
      const filename = certificateFilename(certificate.name).replace(/\.pdf$/, "-assinado.pdf")
      const signed = await bucket.createSignedUrl(certificate.signedKey, 60, { download: filename })
      if (signed.error) throw signed.error
      return conectaResponse({ url: signed.data.signedUrl, filename })
    }
    const uploadId = input.data.action === "confirm" ? input.data.uploadId : randomUUID()
    const path = `certificates/${certificateId}/signed/${uploadId}.pdf`
    if (certificate.signedKey) {
      return certificate.signedKey === path
        ? conectaResponse({ success: true })
        : conectaResponse({ error: "Esta emissão já tem um PDF conferido." }, 409)
    }
    if (action === "reserve") {
      const upload = await bucket.createSignedUploadUrl(path, { upsert: false })
      if (upload.error) throw upload.error
      return conectaResponse({ uploadId, path, token: upload.data.token })
    }
    const signed = await bucket.createSignedUrl(path, 60)
    if (signed.error) throw signed.error
    const response = await fetch(signed.data.signedUrl, { cache: "no-store", signal: AbortSignal.timeout(30_000) })
    const bytes = await readPdf(response)
    if (!bytes) return conectaResponse({ error: "O arquivo precisa ser um PDF legível de até 10 MB." }, 400)
    const hash = createHash("sha256").update(bytes).digest("hex")
    if (hash === certificate.originalHash) return conectaResponse({ error: "O arquivo é igual ao PDF original. Anexe a versão assinada." }, 400)
    const result = await service.rpc("conecta_confirm_signed_certificate", { ...args, p_upload: uploadId, p_hash: hash })
    if (result.error) throw result.error
    return conectaResponse({ success: true })
  } catch (error) {
    const code = (error as { code?: string })?.code
    if (code === "42501") return conectaResponse({ error: "Acesso interno necessário." }, 403)
    if (code === "40001") return conectaResponse({ error: "A emissão mudou. Atualize a solicitação." }, 409)
    return conectaResponse({ error: "Não foi possível concluir a operação do PDF assinado." }, 503)
  }
}

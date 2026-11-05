import { createHash, randomUUID } from "node:crypto"
import { z } from "zod"
import { createSupabaseServiceClient } from "@/lib/supabase-server"
import { applicationSchema, correctionSchema, correctionTokenSchema } from "@/lib/conecta/domain"
import { conectaBucket, conectaResponse, readSmallJson, sha256 } from "@/lib/conecta/http-server"
import { matchesUploadSignature, uploadLimits, uploadManifestSchema } from "@/lib/conecta/uploads"

const requestSchema = z.union([
  z.object({ token: correctionTokenSchema, application: applicationSchema }).strict(),
  z.object({ token: correctionTokenSchema, correctionToken: correctionTokenSchema, application: correctionSchema }).strict(),
])
const sessionSchema = z.object({ manifest: uploadManifestSchema, applicationId: z.string().uuid().nullable(), payloadHash: z.string().nullable() })
class InvalidEvidence extends Error {}

export async function POST(request: Request) {
  const input = requestSchema.safeParse(await readSmallJson(request).catch(() => null))
  if (!input.success) return conectaResponse({ error: "Confira os dados, o período e os comprovantes." }, 400)
  const { token, application } = input.data
  const correctionHash = "correctionToken" in input.data ? sha256(input.data.correctionToken) : null
  const tokenHash = sha256(token), payloadHash = sha256(JSON.stringify(correctionHash ? { correctionHash, application } : application))
  const verifier = randomUUID()
  let release: (() => PromiseLike<unknown>) | undefined
  try {
    const supabase = createSupabaseServiceClient()
    const { data, error } = await supabase.rpc("conecta_get_upload", { p_hash: tokenHash, p_verifier: verifier })
    if (error?.code === "55P03") return conectaResponse({ error: "Os comprovantes já estão em conferência. Aguarde e tente novamente." }, 409)
    if (error) throw error
    release = () => supabase.rpc("conecta_release_upload", { p_hash: tokenHash, p_verifier: verifier })
    const parsed = sessionSchema.safeParse(data)
    if (!parsed.success) return conectaResponse({ error: "Sessão de comprovantes expirada. Envie os arquivos novamente." }, 400)
    const session = parsed.data
    if (session.applicationId) return session.payloadHash === payloadHash
      ? conectaResponse({ success: true })
      : conectaResponse({ error: "Sessão já utilizada." }, 409)
    if (correctionHash) {
      const correction = await supabase.rpc("conecta_get_correction", { p_hash: correctionHash })
      if (correction.error) throw correction.error
      if (!correction.data) return conectaResponse({ error: "O link de correção está indisponível ou expirado." }, 400)
    }
    if (session.manifest.length !== application.attachments.length || session.manifest.some(file => !application.attachments.includes(file.id))) {
      return conectaResponse({ error: "Os comprovantes não correspondem à sessão." }, 400)
    }
    const verified = []
    const deadline = AbortSignal.timeout(50_000)
    for (const file of session.manifest) {
      if (file.bytes > uploadLimits[file.mime]) throw new InvalidEvidence()
      const { data, error } = await supabase.storage.from(conectaBucket).createSignedUrl(file.path, 60)
      if (error || !data) throw new InvalidEvidence()
      const response = await fetch(data.signedUrl, { cache: "no-store", signal: deadline })
      if (!response.ok || !response.body) throw new InvalidEvidence()
      const reader = response.body.getReader()
      const hash = createHash("sha256")
      const prefix = Buffer.alloc(Math.min(file.bytes, 4096))
      let bytes = 0
      try {
        while (true) {
          const next = await reader.read()
          if (next.done) break
          if (bytes + next.value.length > file.bytes) throw new InvalidEvidence()
          if (bytes < prefix.length) prefix.set(next.value.subarray(0, prefix.length - bytes), bytes)
          bytes += next.value.length
          hash.update(next.value)
        }
      } finally { await reader.cancel().catch(() => {}); reader.releaseLock() }
      if (bytes !== file.bytes || !matchesUploadSignature(file.mime, prefix)) throw new InvalidEvidence()
      verified.push({ id: file.id, bytes, sha256: hash.digest("hex") })
    }
    const result = await supabase.rpc(correctionHash ? "conecta_submit_correction" : "conecta_submit_application", {
      ...(correctionHash ? { p_upload: tokenHash } : {}),
      p_hash: correctionHash ?? tokenHash, p_verifier: verifier, p_payload_hash: payloadHash, p_input: application, p_verified: verified,
    })
    if (result.error?.code === "23505") return conectaResponse({ error: "Não foi possível registrar esta participação. Se você já enviou, procure a equipe da AFAPAN." }, 409)
    if (correctionHash && result.error?.code === "40001") return conectaResponse({ error: "A solicitação foi atualizada. Use o link de correção mais recente." }, 409)
    if (result.error?.code === "22023") return conectaResponse({ error: correctionHash
      ? "Confira as informações e os comprovantes. Se o link expirou, fale com a equipe da AFAPAN."
      : "Confira a modalidade, o período e os comprovantes antes de enviar." }, 400)
    if (result.error || !result.data) throw result.error ?? new Error("Solicitação não registrada")
    return conectaResponse({ success: true }, 201)
  } catch (error) {
    return error instanceof InvalidEvidence
      ? conectaResponse({ error: "Um comprovante está ausente ou não corresponde ao formato e tamanho informados." }, 400)
      : conectaResponse({ error: "Não foi possível registrar a atividade. Tente novamente." }, 503)
  } finally { if (release) await Promise.resolve(release()).catch(() => {}) }
}

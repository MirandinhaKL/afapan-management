import { z } from "zod"
import { createSupabaseServiceClient } from "@/lib/supabase-server"
import { conectaBucket, conectaResponse, readSmallJson } from "@/lib/conecta/http-server"
import { conectaInternalClient } from "@/lib/conecta/internal-server"
import { uploadMime } from "@/lib/conecta/uploads"
import { participantSlug } from "@/lib/conecta/filenames"

const requestSchema = z.object({ id: z.string().uuid(), applicationId: z.string().uuid().optional() }).strict()
const evidenceSchema = z.object({ path: z.string().startsWith("evidence/"), mime: uploadMime })
const extensions = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf", "video/mp4": "mp4", "video/webm": "webm" } as const
export async function POST(request: Request) {
  const input = requestSchema.safeParse(await readSmallJson(request).catch(() => null))
  if (!input.success) return conectaResponse({ error: "Comprovante inválido." }, 400)
  try {
    const client = await conectaInternalClient(request)
    if (!client) return conectaResponse({ error: "Entre novamente para acessar o comprovante." }, 401)
    const { data, error } = await client.rpc("conecta_evidence_path", { p_id: input.data.id })
    if (error?.code === "42501") return conectaResponse({ error: "Acesso interno necessário." }, 403)
    if (error) throw error
    const evidence = evidenceSchema.safeParse(data)
    if (!evidence.success) return conectaResponse({ error: "Comprovante indisponível." }, 404)
    let filename = `comprovante.${extensions[evidence.data.mime]}`
    if (input.data.applicationId) {
      const application = await client.rpc("conecta_get_application", { p_id: input.data.applicationId })
      if (application.error) throw application.error
      const parsed = z.object({ name: z.string(), attachments: z.array(z.object({ id: z.string().uuid() })) }).safeParse(application.data)
      if (!parsed.success || !parsed.data.attachments.some(file => file.id === input.data.id)) return conectaResponse({ error: "Comprovante indisponível." }, 404)
      const name = participantSlug(parsed.data.name)
      filename = `comprovante-conecta-afapan${name ? `-${name}` : ""}.${extensions[evidence.data.mime]}`
    }
    const signed = await createSupabaseServiceClient().storage.from(conectaBucket).createSignedUrl(evidence.data.path, 60, { download: filename })
    if (signed.error || !signed.data) throw signed.error
    return conectaResponse({ url: signed.data.signedUrl, filename })
  } catch { return conectaResponse({ error: "Não foi possível baixar o comprovante." }, 503) }
}

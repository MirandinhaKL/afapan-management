import { createHmac, randomBytes, randomUUID } from "node:crypto"
import { createSupabaseServiceClient } from "@/lib/supabase-server"
import { conectaBucket, conectaResponse, readSmallJson, sha256 } from "@/lib/conecta/http-server"
import { uploadRequestSchema } from "@/lib/conecta/uploads"

export async function POST(request: Request) {
  const input = uploadRequestSchema.safeParse(await readSmallJson(request).catch(() => null))
  if (!input.success) return conectaResponse({ error: "Confira o formato, a quantidade e o tamanho dos comprovantes." }, 400)
  const secret = process.env.CONECTA_FORM_SECRET
  if (!secret || secret.length < 32) return conectaResponse({ error: "O envio está temporariamente indisponível." }, 503)
  try {
    const token = randomBytes(32).toString("hex")
    const origin = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    const originHash = createHmac("sha256", secret).update(origin).digest("hex")
    const group = randomUUID()
    const manifest = input.data.files.map(file => {
      const id = randomUUID()
      return { ...file, id, path: `evidence/${group}/${id}` }
    })
    const supabase = createSupabaseServiceClient()
    const { error } = await supabase.rpc("conecta_reserve_upload", { p_hash: sha256(token), p_origin: originHash, p_manifest: manifest })
    if (error?.code === "P0001") return conectaResponse({ error: "Muitas tentativas. Aguarde antes de enviar novamente." }, 429)
    if (error) throw error
    const files = await Promise.all(manifest.map(async file => {
      const { data, error } = await supabase.storage.from(conectaBucket).createSignedUploadUrl(file.path, { upsert: false })
      if (error || !data) throw error ?? new Error("Upload indisponível")
      return { id: file.id, path: data.path, uploadToken: data.token }
    }))
    return conectaResponse({ token, files }, 201)
  } catch {
    return conectaResponse({ error: "Não foi possível preparar os comprovantes. Tente novamente." }, 503)
  }
}

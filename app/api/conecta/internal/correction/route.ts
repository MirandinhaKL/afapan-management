import { randomUUID } from "node:crypto"
import { z } from "zod"
import { conectaInternalClient } from "@/lib/conecta/internal-server"
import { conectaResponse, correctionToken, readSmallJson, sha256 } from "@/lib/conecta/http-server"

const schema = z.object({ id: z.string().uuid(), revision: z.number().int().positive(), reason: z.string().trim().min(1).max(3000) }).strict()
export async function POST(request: Request) {
  const input = schema.safeParse(await readSmallJson(request).catch(() => null))
  if (!input.success) return conectaResponse({ error: "Informe a orientação para correção." }, 400)
  try {
    const client = await conectaInternalClient(request)
    if (!client) return conectaResponse({ error: "Entre novamente." }, 401)
    const id = randomUUID()
    const { error } = await client.rpc("conecta_request_correction", {
      p_id: input.data.id, p_revision: input.data.revision, p_reason: input.data.reason,
      p_token_id: id, p_token_hash: sha256(correctionToken(id)),
    })
    if (error?.code === "42501") return conectaResponse({ error: "Acesso interno necessário." }, 403)
    if (error?.code === "40001") return conectaResponse({ error: "A solicitação mudou. Atualize a tela." }, 409)
    if (error) throw error
    return conectaResponse({ success: true })
  } catch { return conectaResponse({ error: "Não foi possível solicitar a correção." }, 503) }
}

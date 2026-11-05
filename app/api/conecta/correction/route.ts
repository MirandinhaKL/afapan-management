import { z } from "zod"
import { createSupabaseServiceClient } from "@/lib/supabase-server"
import { conectaResponse, readSmallJson, sha256 } from "@/lib/conecta/http-server"
import { correctionTokenSchema } from "@/lib/conecta/domain"

export async function POST(request: Request) {
  const input = z.object({ token: correctionTokenSchema }).strict().safeParse(await readSmallJson(request).catch(() => null))
  if (!input.success) return conectaResponse({ error: "Link de correção indisponível." }, 404)
  try {
    const { data, error } = await createSupabaseServiceClient().rpc("conecta_get_correction", { p_hash: sha256(input.data.token) })
    if (error) throw error
    return data ? conectaResponse(data) : conectaResponse({ error: "Link de correção indisponível." }, 404)
  } catch { return conectaResponse({ error: "Não foi possível abrir a correção. Tente novamente." }, 503) }
}

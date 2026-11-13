import { timingSafeEqual } from "node:crypto"
import { z } from "zod"
import { runEmailSimulation } from "@/lib/conecta/email-worker"
import { conectaResponse, readSmallJson, sha256 } from "@/lib/conecta/http-server"
import { createSupabaseServiceClient } from "@/lib/supabase-server"

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("run") }).strict(),
  z.object({
    action: z.literal("reconcile"), jobId: z.string().uuid(),
    result: z.enum(["accepted", "failed"]), note: z.string().trim().min(1).max(3000),
  }).strict(),
])

export async function POST(request: Request) {
  const secret = process.env.CONECTA_WORKER_SECRET
  if (process.env.CONECTA_EMAIL_MODE !== "simulation" || !secret || secret.length < 32) {
    return conectaResponse({ error: "Simulação de e-mail indisponível." }, 503)
  }
  const expected = Buffer.from(sha256(`Bearer ${secret}`), "hex")
  const received = Buffer.from(sha256(request.headers.get("authorization") ?? ""), "hex")
  if (!timingSafeEqual(expected, received)) return conectaResponse({ error: "Acesso não autorizado." }, 401)

  const input = actionSchema.safeParse(await readSmallJson(request).catch(() => null))
  if (!input.success) return conectaResponse({ error: "Operação inválida." }, 400)
  try {
    const service = createSupabaseServiceClient()
    if (input.data.action === "reconcile") {
      const result = await service.rpc("conecta_reconcile_email_simulation", {
        p_id: input.data.jobId, p_result: input.data.result, p_note: input.data.note,
      })
      if (result.error) throw result.error
      return result.data ? conectaResponse({ success: true }) : conectaResponse({ error: "O item não está com resultado incerto." }, 409)
    }
    const url = z.string().url().safeParse(process.env.CONECTA_PUBLIC_ORIGIN)
    if (!url.success) return conectaResponse({ error: "Endereço do Conecta indisponível." }, 503)
    const origin = new URL(url.data)
    if (origin.username || origin.password ||
        (origin.protocol !== "https:" && !(origin.protocol === "http:" && ["localhost", "127.0.0.1"].includes(origin.hostname)))) {
      return conectaResponse({ error: "Endereço do Conecta inválido." }, 503)
    }
    return conectaResponse(await runEmailSimulation(service, origin.origin))
  } catch {
    return conectaResponse({ error: "Não foi possível processar a fila simulada." }, 503)
  }
}

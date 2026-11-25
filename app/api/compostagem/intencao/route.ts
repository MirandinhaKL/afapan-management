import { z } from "zod"
import { conectaInternalSession } from "@/lib/conecta/internal-server"
import { createSupabaseServiceClient } from "@/lib/supabase-server"

const ids = z.object({ participante: z.string().uuid(), turma: z.string().uuid() })

function json(data: object, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } })
}

export async function GET(request: Request) {
  try {
    const session = await conectaInternalSession(request)
    if (!session) return json({ erro: "Sessão inválida." }, 401)

    const params = ids.safeParse(Object.fromEntries(new URL(request.url).searchParams))
    if (!params.success) return json({ erro: "Participante ou turma inválidos." }, 400)

    const { data: vinculo, error } = await session.client.from("participantes_turmas")
      .select("id, participantes!inner(id)")
      .eq("participante_id", params.data.participante)
      .eq("turma_id", params.data.turma)
      .maybeSingle()
    if (error) throw error
    if (!vinculo) return json({ erro: "Vínculo indisponível." }, 404)

    const inscricao = await createSupabaseServiceClient().from("compostagem_inscricoes")
      .select("intencao").eq("vinculo_id", vinculo.id).maybeSingle()
    if (inscricao.error) throw inscricao.error
    return json({ intencao: inscricao.data?.intencao ?? null })
  } catch {
    return json({ erro: "Não foi possível carregar a intenção de participar." }, 500)
  }
}

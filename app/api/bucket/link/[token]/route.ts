import { NextResponse } from "next/server"
import { createSupabaseServiceClient } from "@/lib/supabase-server"

interface RouteParams {
  params: Promise<{
    token: string
  }>
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { token } = await params

    if (!token) {
      return NextResponse.json({ error: "Token inválido" }, { status: 400 })
    }

    const supabase = createSupabaseServiceClient()
    const { data, error } = await supabase
      .from("participante_bucket_links")
      .select(
        `
          id,
          participante_id,
          turma_bucket_period_id,
          token,
          is_active,
          submitted,
          submitted_at,
          expires_at,
          participantes:participante_id (id, nome, email, telefone),
          turma_bucket_periods:turma_bucket_period_id (id, periodo_label, data_monitoramento)
        `
      )
      .eq("token", token)
      .eq("is_active", true)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: "Link inválido ou expirado" }, { status: 404 })
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return NextResponse.json({ error: "Link expirado" }, { status: 410 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Erro ao buscar link de baldes:", error)

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao carregar formulário",
      },
      { status: 500 }
    )
  }
}

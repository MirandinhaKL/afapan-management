import { NextResponse } from "next/server"
import { createSupabaseServiceClient } from "@/lib/supabase-server"

function getQuarterLabel(dateValue: string) {
  const date = new Date(`${dateValue}T00:00:00`)
  const year = date.getFullYear()
  const quarter = Math.ceil((date.getMonth() + 1) / 3)
  return `${year}-Q${quarter}`
}

export async function POST(request: Request) {
  try {
    const { token, quantidade } = await request.json()
    const parsedQuantidade = Number(quantidade)

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token inválido" }, { status: 400 })
    }

    if (!Number.isInteger(parsedQuantidade) || parsedQuantidade < 0) {
      return NextResponse.json({ error: "Quantidade inválida" }, { status: 400 })
    }

    const supabase = createSupabaseServiceClient()

    const { data: linkData, error: linkError } = await supabase
      .from("participante_bucket_links")
      .select(
        `
          *,
          turma_bucket_periods:turma_bucket_period_id (
            id,
            turma_id,
            periodo_label,
            data_monitoramento
          )
        `
      )
      .eq("token", token)
      .eq("is_active", true)
      .single()

    if (linkError || !linkData) {
      return NextResponse.json({ error: "Link inválido ou expirado" }, { status: 404 })
    }

    if (linkData.submitted) {
      return NextResponse.json({ error: "Este link já foi utilizado" }, { status: 409 })
    }

    if (linkData.expires_at && new Date(linkData.expires_at) < new Date()) {
      return NextResponse.json({ error: "Link expirado" }, { status: 410 })
    }

    const period = Array.isArray(linkData.turma_bucket_periods)
      ? linkData.turma_bucket_periods[0]
      : linkData.turma_bucket_periods

    if (!period?.data_monitoramento) {
      return NextResponse.json(
        { error: "Período de monitoramento não encontrado" },
        { status: 404 }
      )
    }

    const today = new Date().toISOString().split("T")[0]
    const { error: baldeError } = await supabase.from("baldes").insert([
      {
        participante_id: linkData.participante_id,
        turma_id: period.turma_id,
        turma_bucket_period_id: linkData.turma_bucket_period_id,
        trimestre: getQuarterLabel(period.data_monitoramento),
        quantidade: parsedQuantidade,
        data_registro: today,
      },
    ])

    if (baldeError) {
      throw baldeError
    }

    const { error: updateError } = await supabase
      .from("participante_bucket_links")
      .update({
        submitted: true,
        submitted_at: new Date().toISOString(),
      })
      .eq("id", linkData.id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      quantidade: parsedQuantidade,
    })
  } catch (error) {
    console.error("Erro ao registrar baldes por link:", error)

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao registrar baldes",
      },
      { status: 500 }
    )
  }
}

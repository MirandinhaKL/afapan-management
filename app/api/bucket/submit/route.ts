import { NextResponse } from "next/server"
import { createSupabaseServiceClient } from "@/lib/supabase-server"
import { getBucketLinkAccessError } from "@/lib/bucket-link-validation"
import { getBucketPeriodRecordKey } from "@/lib/bucket-record"

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
            data_monitoramento,
            data_inicio,
            data_fim,
            periodo_numero
          )
        `
      )
      .eq("token", token)
      .single()

    if (linkError || !linkData) {
      return NextResponse.json({ error: "Link inválido ou expirado" }, { status: 404 })
    }

    const accessError = getBucketLinkAccessError(linkData)
    if (accessError) {
      return NextResponse.json(
        { error: accessError.message },
        { status: accessError.status }
      )
    }

    const period = Array.isArray(linkData.turma_bucket_periods)
      ? linkData.turma_bucket_periods[0]
      : linkData.turma_bucket_periods

    if (!period?.data_monitoramento || !period?.periodo_numero) {
      return NextResponse.json(
        { error: "Período de monitoramento não encontrado" },
        { status: 404 }
      )
    }

    const today = new Date().toISOString().split("T")[0]
    const trimestre = getBucketPeriodRecordKey(
      period.data_monitoramento,
      period.periodo_numero
    )
    const baldePayload = {
      participante_id: linkData.participante_id,
      turma_id: period.turma_id,
      turma_bucket_period_id: linkData.turma_bucket_period_id,
      trimestre,
      quantidade: parsedQuantidade,
      data_registro: today,
    }

    const { data: baldeDoPeriodo, error: baldeLookupError } = await supabase
      .from("baldes")
      .select("id")
      .eq("participante_id", linkData.participante_id)
      .eq("turma_bucket_period_id", linkData.turma_bucket_period_id)
      .limit(1)
      .maybeSingle()

    if (baldeLookupError) throw baldeLookupError

    let baldeExistente = baldeDoPeriodo

    // Registros antigos não possuíam turma_bucket_period_id. Nesse caso,
    // localizamos o campo da campanha pela chave YYYY-QN-RN.
    if (!baldeExistente) {
      const { data: baldeLegado, error: baldeLegadoError } = await supabase
        .from("baldes")
        .select("id")
        .eq("participante_id", linkData.participante_id)
        .eq("trimestre", trimestre)
        .limit(1)
        .maybeSingle()

      if (baldeLegadoError) throw baldeLegadoError
      baldeExistente = baldeLegado
    }

    const { error: baldeError } = baldeExistente
      ? await supabase
          .from("baldes")
          .update(baldePayload)
          .eq("id", baldeExistente.id)
      : await supabase.from("baldes").insert([baldePayload])

    if (baldeError) {
      throw baldeError
    }

    const { error: updateError } = await supabase
      .from("participante_bucket_links")
      .update({
        submitted: true,
        submitted_at: new Date().toISOString(),
        is_active: false,
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

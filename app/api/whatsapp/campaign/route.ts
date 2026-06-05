import { NextResponse } from "next/server"
import { createSupabaseServiceClient } from "@/lib/supabase-server"
import { generateUniqueToken } from "@/lib/token-utils"
import {
  formatBrazilWhatsAppPhone,
  getWhatsAppTemplateConfig,
  sendBucketCollectionTemplate,
} from "@/lib/whatsapp-cloud"

interface ParticipanteRel {
  participante_id: string
  participantes?: {
    id: string
    nome: string
    telefone?: string
    ativo?: boolean
  } | {
    id: string
    nome: string
    telefone?: string
    ativo?: boolean
  }[] | null
}

function getBaseUrl(request: Request) {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    request.headers.get("origin") ||
    "http://localhost:3000"
  )
}

export async function POST(request: Request) {
  try {
    const { turmaId, turmaBucketPeriodId, expiresInDays = 30 } = await request.json()

    if (!turmaId || !turmaBucketPeriodId) {
      return NextResponse.json(
        { error: "Turma e período são obrigatórios" },
        { status: 400 }
      )
    }

    const supabase = createSupabaseServiceClient()
    const whatsappConfig = getWhatsAppTemplateConfig()
    const baseUrl = getBaseUrl(request)

    const { data: period, error: periodError } = await supabase
      .from("turma_bucket_periods")
      .select("id, turma_id, periodo_label, data_monitoramento")
      .eq("id", turmaBucketPeriodId)
      .eq("turma_id", turmaId)
      .single()

    if (periodError || !period) {
      return NextResponse.json(
        { error: "Período de monitoramento não encontrado" },
        { status: 404 }
      )
    }

    const { data: rels, error: relsError } = await supabase
      .from("participantes_turmas")
      .select("participante_id, participantes(id, nome, telefone, ativo)")
      .eq("turma_id", turmaId)

    if (relsError) throw relsError

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + Number(expiresInDays || 30))

    const results = []

    for (const rel of (rels || []) as unknown as ParticipanteRel[]) {
      const participante = Array.isArray(rel.participantes)
        ? rel.participantes[0]
        : rel.participantes

      if (!participante || participante.ativo === false) {
        results.push({
          participanteId: rel.participante_id,
          status: "skipped",
          error: "Participante inativo ou não encontrado",
        })
        continue
      }

      const formattedPhone = formatBrazilWhatsAppPhone(participante.telefone || "")

      if (!formattedPhone) {
        results.push({
          participanteId: participante.id,
          participanteNome: participante.nome,
          status: "skipped",
          error: "Telefone não informado",
        })
        continue
      }

      const { data: existingLink, error: existingError } = await supabase
        .from("participante_bucket_links")
        .select("id, token")
        .eq("participante_id", participante.id)
        .eq("turma_bucket_period_id", turmaBucketPeriodId)
        .eq("is_active", true)
        .maybeSingle()

      if (existingError) throw existingError

      let token = existingLink?.token

      if (!token) {
        token = generateUniqueToken()

        const { error: insertError } = await supabase
          .from("participante_bucket_links")
          .insert([
            {
              participante_id: participante.id,
              turma_bucket_period_id: turmaBucketPeriodId,
              token,
              expires_at: expiresAt.toISOString(),
              is_active: true,
              submitted: false,
            },
          ])

        if (insertError) throw insertError
      }

      const link = `${baseUrl}/bucket/${token}`

      if (!whatsappConfig) {
        results.push({
          participanteId: participante.id,
          participanteNome: participante.nome,
          telefone: formattedPhone,
          link,
          status: "not_configured",
          error: "Credenciais do WhatsApp Cloud API não configuradas",
        })
        continue
      }

      try {
        const sendResult = await sendBucketCollectionTemplate(whatsappConfig, {
          to: formattedPhone,
          participanteNome: participante.nome,
          periodoLabel: period.periodo_label,
          link,
        })

        results.push({
          participanteId: participante.id,
          participanteNome: participante.nome,
          telefone: formattedPhone,
          link,
          status: "sent",
          messageId: sendResult?.messages?.[0]?.id,
        })
      } catch (error) {
        results.push({
          participanteId: participante.id,
          participanteNome: participante.nome,
          telefone: formattedPhone,
          link,
          status: "error",
          error: error instanceof Error ? error.message : "Erro ao enviar WhatsApp",
        })
      }
    }

    return NextResponse.json({
      success: true,
      configured: Boolean(whatsappConfig),
      total: results.length,
      sent: results.filter((item) => item.status === "sent").length,
      skipped: results.filter((item) => item.status === "skipped").length,
      errors: results.filter((item) => item.status === "error").length,
      notConfigured: results.filter((item) => item.status === "not_configured").length,
      results,
    })
  } catch (error) {
    console.error("Erro ao enviar campanha de WhatsApp:", error)

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao enviar campanha",
      },
      { status: 500 }
    )
  }
}

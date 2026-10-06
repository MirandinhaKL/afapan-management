import { NextResponse } from "next/server"
import { createSupabaseServiceClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = createSupabaseServiceClient()
    await supabase.rpc("process_expired_volunteer_campaigns")
    const { data, error } = await supabase
      .from("volunteer_campaigns")
      .select("nome, prazo, privacy_text, privacy_version, participation_text, participation_version")
      .eq("ativa", true)
      .gte("prazo", new Date().toISOString())
      .limit(2)
    if (error || !data || data.length !== 1) {
      return NextResponse.json({ error: "Formulário indisponível." }, { status: 404 })
    }
    const campaign = data[0]
    return NextResponse.json({
      name: campaign.nome,
      deadline: campaign.prazo,
      privacyText: campaign.privacy_text,
      privacyVersion: campaign.privacy_version,
      participationText: campaign.participation_text,
      participationVersion: campaign.participation_version,
    })
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar o formulário." }, { status: 500 })
  }
}

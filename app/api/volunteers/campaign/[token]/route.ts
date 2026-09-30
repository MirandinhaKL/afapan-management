import { NextResponse } from "next/server"
import { createSupabaseServiceClient } from "@/lib/supabase-server"

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params
    if (!/^[0-9a-f-]{36}$/i.test(token)) {
      return NextResponse.json({ error: "Formulário indisponível." }, { status: 404 })
    }
    const supabase = createSupabaseServiceClient()
    await supabase.rpc("process_expired_volunteer_campaigns")
    const { data, error } = await supabase
      .from("volunteer_campaigns")
      .select("nome, prazo, privacy_text, privacy_version, participation_text, participation_version")
      .eq("public_token", token)
      .eq("ativa", true)
      .gte("prazo", new Date().toISOString())
      .maybeSingle()
    if (error || !data) return NextResponse.json({ error: "Formulário indisponível." }, { status: 404 })
    return NextResponse.json({
      name: data.nome,
      deadline: data.prazo,
      privacyText: data.privacy_text,
      privacyVersion: data.privacy_version,
      participationText: data.participation_text,
      participationVersion: data.participation_version,
    })
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar o formulário." }, { status: 500 })
  }
}

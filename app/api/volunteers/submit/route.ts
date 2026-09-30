import { NextResponse } from "next/server"
import { createSupabaseServiceClient } from "@/lib/supabase-server"
import { validateVolunteerInput } from "@/lib/volunteers"
import {
  getPublicVolunteerError,
  getVolunteerRequestHash,
  prepareVolunteerRpcPayload,
  type PublicVolunteerPayload,
} from "@/lib/volunteer-public"

export async function POST(request: Request) {
  try {
    const input = await request.json() as PublicVolunteerPayload
    if (input.website) return NextResponse.json({ success: true }, { status: 200 })
    if (!input.token || !/^[0-9a-f-]{36}$/i.test(input.token)) {
      return NextResponse.json({ error: "Formulário indisponível." }, { status: 400 })
    }
    const errors = validateVolunteerInput(input)
    if (errors.length > 0) return NextResponse.json({ error: errors[0].message, fields: errors.map((item) => item.field) }, { status: 400 })
    const secret = process.env.VOLUNTEER_FORM_RATE_LIMIT_SECRET
    if (!secret) throw new Error("Volunteer form rate limit secret is not configured")
    const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    const payload = prepareVolunteerRpcPayload(input)
    const supabase = createSupabaseServiceClient()
    const sourceHash = getVolunteerRequestHash(forwardedFor, secret)
    const phoneHash = getVolunteerRequestHash(payload.normalizedPhone, secret)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count, error: attemptsError } = await supabase
      .from("volunteer_public_submission_attempts")
      .select("id", { count: "exact", head: true })
      .eq("source_hash", sourceHash)
      .gte("criado_em", oneHourAgo)
    if (attemptsError) throw attemptsError
    if ((count || 0) >= 10) {
      return NextResponse.json({ error: "Muitas tentativas foram realizadas. Aguarde um pouco e tente novamente." }, { status: 429 })
    }
    const { error: attemptInsertError } = await supabase
      .from("volunteer_public_submission_attempts")
      .insert({ source_hash: sourceHash, phone_hash: phoneHash })
    if (attemptInsertError) throw attemptInsertError
    const { error } = await supabase.rpc("submit_volunteer_registration", {
      p_campaign_token: input.token,
      p_payload: payload,
      p_source_hash: sourceHash,
      p_phone_hash: phoneHash,
    })
    if (error) {
      const publicError = getPublicVolunteerError(error)
      return NextResponse.json({ error: publicError.message }, { status: publicError.status })
    }
    return NextResponse.json({ success: true, status: "aguardando_validacao" })
  } catch (error) {
    console.error("Falha no envio público de voluntário", { category: error instanceof SyntaxError ? "invalid_json" : "unexpected" })
    return NextResponse.json({ error: "Não foi possível enviar o cadastro. Tente novamente." }, { status: 500 })
  }
}

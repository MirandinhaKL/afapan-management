import { NextResponse } from "next/server"
import { createSupabaseServiceClient } from "@/lib/supabase-server"
import { validateVolunteerInput } from "@/lib/volunteers"
import { publicVolunteerPayloadSchema } from "@/lib/volunteer-registration"
import {
  getPublicVolunteerError,
  getVolunteerRequestHash,
  prepareVolunteerRpcPayload,
} from "@/lib/volunteer-public"

export async function POST(request: Request) {
  try {
    const raw: unknown = await request.json()
    if (raw && typeof raw === "object" && "website" in raw && typeof raw.website === "string" && raw.website) {
      return NextResponse.json({ success: true }, { status: 200 })
    }
    const parsed = publicVolunteerPayloadSchema.safeParse(raw)
    if (!parsed.success) return NextResponse.json({
      error: "Confira os campos informados e os textos de confirmação antes de enviar.",
      fields: [...new Set(parsed.error.issues.map((issue) => String(issue.path[0] || "form")))],
    }, { status: 400 })
    const input = parsed.data
    const errors = validateVolunteerInput(input)
    if (errors.length > 0) return NextResponse.json({ error: errors[0].message, fields: errors.map((item) => item.field) }, { status: 400 })
    const secret = process.env.VOLUNTEER_FORM_RATE_LIMIT_SECRET
    if (!secret) throw new Error("Volunteer form rate limit secret is not configured")
    const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    const payload = prepareVolunteerRpcPayload(input)
    const supabase = createSupabaseServiceClient()
    const { error: cleanupError } = await supabase.rpc("purge_old_volunteer_submission_attempts")
    if (cleanupError) throw cleanupError
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
    const { error } = await supabase.rpc("submit_permanent_volunteer_registration", {
      p_payload: payload,
      p_source_hash: sourceHash,
      p_phone_hash: phoneHash,
    })
    if (error) {
      const publicError = getPublicVolunteerError(error)
      return NextResponse.json({ error: publicError.message, ...("code" in publicError ? { code: publicError.code } : {}) }, { status: publicError.status })
    }
    return NextResponse.json({ success: true, status: "aguardando_validacao" })
  } catch (error) {
    console.error("Falha no envio público de voluntário", { category: error instanceof SyntaxError ? "invalid_json" : "unexpected" })
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Não foi possível ler os dados enviados. Confira o formulário e tente novamente." }, { status: 400 })
    return NextResponse.json({ error: "Não foi possível enviar o cadastro. Tente novamente." }, { status: 500 })
  }
}

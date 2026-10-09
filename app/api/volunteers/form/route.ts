import { NextResponse } from "next/server"
import { createSupabaseServiceClient } from "@/lib/supabase-server"
import { volunteerFormSettingsSchema } from "@/lib/volunteer-registration"

export const dynamic = "force-dynamic"
const headers = { "Cache-Control": "no-store" }

export async function GET() {
  try {
    const supabase = createSupabaseServiceClient()
    const { data, error } = await supabase.from("volunteer_registration_settings")
      .select("privacy_text,privacy_version,participation_text,participation_version")
      .eq("id", 1).maybeSingle()
    if (error || !data) throw new Error("configuration_unavailable")
    const parsed = volunteerFormSettingsSchema.safeParse({
      privacyText: data.privacy_text,
      privacyVersion: data.privacy_version,
      participationText: data.participation_text,
      participationVersion: data.participation_version,
    })
    if (!parsed.success) throw new Error("invalid_configuration")
    return NextResponse.json(parsed.data, { headers })
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar os textos do formulário. Tente novamente." }, { status: 503, headers })
  }
}

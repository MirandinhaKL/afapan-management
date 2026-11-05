import { NextResponse } from "next/server"
import { catalogSchema } from "@/lib/conecta/catalog"
import { createSupabaseServiceClient } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"
const headers = { "Cache-Control": "no-store" }
export async function GET() {
  try {
    const { data, error } = await createSupabaseServiceClient().rpc("conecta_read_catalog", { p_internal: false })
    if (error) throw error
    const catalog = catalogSchema.parse(data).filter(item => item.active)
    return NextResponse.json(catalog.map(({ versionId, name, description, project, mode, tasks }) => ({ versionId, name, description, project, mode, tasks })), { headers })
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar as modalidades." }, { status: 503, headers })
  }
}

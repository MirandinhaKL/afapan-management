import { supabase } from "@/lib/supabase"
import { getVolunteerStatisticsYear } from "@/lib/volunteer-statistics-year"

export interface VolunteerStatistics {
  active: number
  awaitingValidation: number
  startedThisYear: number
  year: number
}

export async function fetchVolunteerStatistics(year = getVolunteerStatisticsYear()): Promise<VolunteerStatistics> {
  const session = await supabase.auth.getUser()
  if (session.error || !session.data.user) throw new Error("Entre novamente para consultar os indicadores.")
  const count = () => supabase.from("volunteers").select("id", { count: "exact", head: true }).is("arquivado_em", null)
  const results = await Promise.all([
    count().eq("status", "ativo"),
    count().eq("status", "aguardando_validacao"),
    count().eq("inicio_atividades_ano", year).gte("inicio_atividades_mes", 1).lte("inicio_atividades_mes", 12),
  ])
  if (results.some(result => result.error || !Number.isInteger(result.count) || result.count! < 0)) {
    throw new Error("Não foi possível carregar os indicadores. Tente novamente.")
  }
  const current = await supabase.auth.getUser()
  if (current.error || current.data.user?.id !== session.data.user.id) throw new Error("Sua sessão mudou. Entre novamente para consultar os indicadores.")
  return { active: results[0].count!, awaitingValidation: results[1].count!, startedThisYear: results[2].count!, year }
}

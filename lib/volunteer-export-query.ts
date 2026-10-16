import { supabase } from "@/lib/supabase"
import type { ExportRow } from "@/lib/volunteer-export-data"

const SELECT = "*, volunteer_availability(frequencia), volunteer_interests(atividade)"
async function requireSession() {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new Error("Sua sessão expirou. Entre novamente para exportar.")
  return data.user.id
}
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)))
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,v])=>[key,canonical(v)]))
  return value
}
async function readAll(progress?: (count: number) => void) {
  const rows: ExportRow[] = []; const seen = new Set<string>(); let cursor: string | undefined
  while (true) {
    let query = supabase.from("volunteers").select(SELECT).is("arquivado_em", null).order("id").limit(500)
    if (cursor) query = query.gt("id", cursor)
    const { data, error } = await query
    if (error) throw new Error("Não foi possível ler todos os cadastros. Tente novamente.")
    if (!data?.length) break
    for (const raw of data) {
      const row = raw as unknown as ExportRow
      if (!row.id || seen.has(row.id) || (cursor && row.id <= cursor) || row.arquivado_em) throw new Error("A base mudou durante a leitura. Tente exportar novamente.")
      seen.add(row.id); rows.push(row); cursor = row.id
    }
    progress?.(rows.length)
  }
  return rows
}
export async function fetchVolunteerExport(progress?: (message: string) => void) {
  const user = await requireSession()
  const rows = await readAll(n=>progress?.(`Lendo cadastros: ${n}`))
  progress?.("Conferindo os dados antes de gerar o arquivo...")
  // Compare all exported data, including relations: their writes need not touch the parent timestamp.
  const check = await readAll()
  if (user !== await requireSession()) throw new Error("A sessão mudou. Entre novamente para exportar.")
  if (JSON.stringify(canonical(rows)) !== JSON.stringify(canonical(check))) throw new Error("Os cadastros mudaram durante a exportação. Tente novamente.")
  return rows
}

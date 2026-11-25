import { supabase } from "@/lib/supabase"

export async function fetchIntencaoParticipante(participante: string, turma: string, signal: AbortSignal) {
  const { data } = await supabase.auth.getSession()
  if (!data.session) throw new Error("Sessão inválida.")
  const query = new URLSearchParams({ participante, turma })
  const response = await fetch(`/api/compostagem/intencao?${query}`, {
    headers: { Authorization: `Bearer ${data.session.access_token}` },
    cache: "no-store",
    signal,
  })
  if (!response.ok) throw new Error("Não foi possível carregar a intenção de participar.")
  const result: { intencao: string | null } = await response.json()
  return result.intencao
}

export async function requestCompostagemImport<T>(query = "", body?: FormData): Promise<T> {
  const { data } = await supabase.auth.getSession()
  if (!data.session) throw new Error("Entre novamente para continuar.")
  const response = await fetch(`/api/compostagem/importacoes${query}`, {
    method: body ? "POST" : "GET",
    headers: { Authorization: `Bearer ${data.session.access_token}` },
    body,
    cache: "no-store",
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.erro ?? "Falha ao acessar a importação.")
  return result
}

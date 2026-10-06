import { supabase } from "@/lib/supabase"
import {
  brazilianDateToIso,
  normalizeBrazilianPhone,
  type Volunteer,
  type VolunteerCampaign,
  type VolunteerFilters,
  type VolunteerInput,
  type VolunteerStatus,
} from "@/lib/volunteers"

interface VolunteerRow {
  id: string
  campaign_id?: string | null
  nome: string
  sobrenome: string
  data_nascimento: string
  telefone: string
  telefone_normalizado: string
  email?: string | null
  rua?: string | null
  numero?: string | null
  complemento?: string | null
  bairro: string
  cidade: string
  estado?: string | null
  profissao?: string | null
  habilidades?: string | null
  inicio_atividades_mes?: number | null
  inicio_atividades_ano?: number | null
  expectativas?: string | null
  como_conheceu?: string | null
  experiencia_voluntariado?: Volunteer["previousVolunteering"] | null
  canais_comunicacao?: Volunteer["communicationChannels"] | null
  ideia_projeto?: string | null
  uso_imagem_autorizado?: boolean | null
  historia_afapan?: string | null
  responsavel_nome?: string | null
  responsavel_telefone?: string | null
  responsavel_autorizou?: boolean
  status: VolunteerStatus
  origem: "publico" | "assistido"
  criado_em: string
  atualizado_em: string
  arquivado_em?: string | null
  volunteer_availability?: Array<{ frequencia: Volunteer["frequency"] }> | { frequencia: Volunteer["frequency"] } | null
  volunteer_interests?: Array<{ atividade: Volunteer["activities"][number]; outra_descricao?: string | null }> | null
}

const SELECT = "*, volunteer_availability(frequencia), volunteer_interests(*)"
const getAvailability = (row: VolunteerRow) => Array.isArray(row.volunteer_availability) ? row.volunteer_availability[0] : row.volunteer_availability

export function mapVolunteer(row: VolunteerRow): Volunteer {
  const availability = getAvailability(row)
  const interests = row.volunteer_interests || []
  return {
    id: row.id,
    campaignId: row.campaign_id || undefined,
    firstName: row.nome,
    lastName: row.sobrenome,
    birthDate: row.data_nascimento,
    phone: row.telefone,
    normalizedPhone: row.telefone_normalizado,
    email: row.email || undefined,
    street: row.rua || undefined,
    number: row.numero || undefined,
    complement: row.complemento || undefined,
    neighborhood: row.bairro,
    city: row.cidade,
    state: row.estado || undefined,
    profession: row.profissao || undefined,
    skills: row.habilidades || undefined,
    activityStartMonth: row.inicio_atividades_mes,
    activityStartYear: row.inicio_atividades_ano,
    frequency: availability?.frequencia || "eventual",
    activities: interests.map((item) => item.atividade),
    otherActivityDescription: interests.find((item) => item.atividade === "outras")?.outra_descricao || undefined,
    expectations: row.expectativas || undefined,
    discoverySource: row.como_conheceu || undefined,
    previousVolunteering: row.experiencia_voluntariado || null,
    communicationChannels: row.canais_comunicacao || [],
    projectIdea: row.ideia_projeto || undefined,
    imageUseAuthorized: row.uso_imagem_autorizado ?? null,
    afapanStory: row.historia_afapan || undefined,
    guardianName: row.responsavel_nome || undefined,
    guardianPhone: row.responsavel_telefone || undefined,
    guardianAuthorized: Boolean(row.responsavel_autorizou),
    privacyAccepted: true,
    participationAccepted: true,
    status: row.status,
    origin: row.origem,
    createdAt: row.criado_em,
    updatedAt: row.atualizado_em,
    archivedAt: row.arquivado_em || undefined,
  }
}

function safeSearch(value: string) { return value.replace(/[,%()]/g, " ").trim() }

export async function fetchVolunteers(filters: VolunteerFilters = {}, page = 1, pageSize = 10) {
  let select = SELECT
  if (filters.activity && filters.activity !== "all") select = "*, volunteer_availability(frequencia), volunteer_interests!inner(*)"
  if (filters.frequency && filters.frequency !== "all") select = "*, volunteer_availability!inner(frequencia), volunteer_interests(*)"
  let query: any = supabase.from("volunteers").select(select, { count: "exact" })
  const archive = filters.archive || "active"
  if (archive === "active") query = query.is("arquivado_em", null)
  if (archive === "archived") query = query.not("arquivado_em", "is", null)
  if (filters.status && filters.status !== "all") query = query.eq("status", filters.status)
  if (filters.city) query = query.ilike("cidade", `%${safeSearch(filters.city)}%`)
  if (filters.neighborhood) query = query.ilike("bairro", `%${safeSearch(filters.neighborhood)}%`)
  if (filters.activity && filters.activity !== "all") query = query.eq("volunteer_interests.atividade", filters.activity)
  if (filters.frequency && filters.frequency !== "all") query = query.eq("volunteer_availability.frequencia", filters.frequency)
  if (filters.search) {
    const search = safeSearch(filters.search)
    if (search) query = query.or(`nome.ilike.%${search}%,sobrenome.ilike.%${search}%,telefone.ilike.%${search}%`)
  }
  const start = (page - 1) * pageSize
  const { data, error, count } = await query.order("nome").order("sobrenome").range(start, start + pageSize - 1)
  if (error) throw error
  return { volunteers: ((data || []) as VolunteerRow[]).map(mapVolunteer), total: count || 0 }
}

function payload(input: VolunteerInput & { status?: VolunteerStatus }) {
  return {
    ...input,
    birthDate: brazilianDateToIso(input.birthDate),
    normalizedPhone: normalizeBrazilianPhone(input.phone),
    normalizedGuardianPhone: input.guardianPhone ? normalizeBrazilianPhone(input.guardianPhone) : null,
    activityStartMonth: input.activityStartMonth ?? null,
    activityStartYear: input.activityStartYear ?? null,
    communicationChannels: input.communicationChannels ?? [],
    previousVolunteering: input.previousVolunteering ?? null,
    imageUseAuthorized: input.imageUseAuthorized ?? null,
  }
}

export async function saveAssistedVolunteer(input: VolunteerInput & { id?: string; expectedUpdatedAt?: string; status?: VolunteerStatus }) {
  const { data, error } = await supabase.rpc("save_assisted_volunteer", {
    p_id: input.id || null,
    p_expected_updated_at: input.expectedUpdatedAt || null,
    p_payload: payload(input),
  })
  if (error) throw error
  return data as string
}

export async function setVolunteerStatus(volunteer: Volunteer, status: VolunteerStatus) {
  const { error } = await supabase.rpc("set_volunteer_status", { p_id: volunteer.id, p_expected_updated_at: volunteer.updatedAt, p_status: status })
  if (error) throw error
}

export async function setVolunteerArchived(volunteer: Volunteer, archived: boolean) {
  const { error } = await supabase.rpc("set_volunteer_archived", { p_id: volunteer.id, p_expected_updated_at: volunteer.updatedAt, p_archived: archived })
  if (error) throw error
}

export async function fetchVolunteerCampaign(): Promise<VolunteerCampaign | null> {
  const { data, error } = await supabase.from("volunteer_campaigns").select("*").order("criado_em", { ascending: false }).limit(1).maybeSingle()
  if (error) throw error
  if (!data) return null
  return {
    id: data.id,
    name: data.nome,
    deadline: data.prazo,
    active: data.ativa,
    privacyText: data.privacy_text,
    privacyVersion: data.privacy_version,
    participationText: data.participation_text,
    participationVersion: data.participation_version,
    updatedAt: data.atualizado_em,
  }
}

export async function saveVolunteerCampaign(input: Omit<VolunteerCampaign, "id" | "updatedAt"> & { id?: string; expectedUpdatedAt?: string }) {
  const { data, error } = await supabase.rpc("save_volunteer_campaign", {
    p_id: input.id || null,
    p_expected_updated_at: input.expectedUpdatedAt || null,
    p_name: input.name,
    p_deadline: input.deadline,
    p_active: input.active,
    p_privacy_text: input.privacyText,
    p_privacy_version: input.privacyVersion,
    p_participation_text: input.participationText,
    p_participation_version: input.participationVersion,
  })
  if (error) throw error
  return data as string
}

export function getVolunteerMutationError(error: unknown) {
  const candidate = error as { code?: string; message?: string }
  if (candidate?.code === "40001" || candidate?.message?.includes("CONFLICT")) return "Este cadastro foi alterado em outra sessão. Atualize a listagem e tente novamente."
  if (candidate?.code === "23505") return "Já existe um cadastro ativo com este telefone."
  return candidate?.message || "Não foi possível concluir a operação."
}

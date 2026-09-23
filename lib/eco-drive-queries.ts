import { supabase } from "@/lib/supabase"
import {
  type CreateEcoDriveCampaignInput,
  type EcoDriveCampaign,
  type EcoDriveCampaignFilters,
  type EcoDriveCampaignPage,
  type EcoDriveMaterialType,
  type EcoDriveMaterialUnit,
  type UpdateEcoDriveCampaignInput,
} from "@/lib/eco-drive"

interface EcoDriveMaterialRow {
  id: string
  tipo: EcoDriveMaterialType
  quantidade: number | string
  unidade: EcoDriveMaterialUnit
  quantidade_kg?: number | string
}

interface EcoDriveCampaignRow {
  id: string
  nome: string
  data_evento: string
  local?: string | null
  numero_voluntarios: number
  numero_participantes?: number
  status: "planejada" | "concluida"
  observacoes?: string | null
  criado_em?: string
  atualizado_em?: string
  arquivado_em?: string | null
  arquivado_por?: string | null
  eco_drive_materials?: EcoDriveMaterialRow[] | null
}

const CAMPAIGN_SELECT = "*, eco_drive_materials(*)"

export function mapEcoDriveCampaign(row: EcoDriveCampaignRow): EcoDriveCampaign {
  return {
    id: row.id,
    name: row.nome,
    eventDate: row.data_evento,
    location: row.local || undefined,
    volunteerCount: row.numero_voluntarios ?? row.numero_participantes ?? 0,
    status: row.status,
    notes: row.observacoes || undefined,
    createdAt: row.criado_em,
    updatedAt: row.atualizado_em,
    archivedAt: row.arquivado_em || undefined,
    archivedBy: row.arquivado_por || undefined,
    materials: (row.eco_drive_materials || []).map((material) => ({
      id: material.id,
      type: material.tipo,
      quantity: Number(material.quantidade ?? material.quantidade_kg ?? 0),
      unit: material.unidade,
    })),
  }
}

function safeSearch(value: string) {
  return value.replace(/[,%()]/g, " ").trim()
}

function applyFilters(query: any, filters: EcoDriveCampaignFilters) {
  const archive = filters.archive || "active"
  if (archive === "active") query = query.is("arquivado_em", null)
  if (archive === "archived") query = query.not("arquivado_em", "is", null)
  if (filters.status && filters.status !== "all") query = query.eq("status", filters.status)
  if (filters.year) {
    query = query.gte("data_evento", `${filters.year}-01-01`).lte("data_evento", `${filters.year}-12-31`)
  }
  if (filters.dateFrom) query = query.gte("data_evento", filters.dateFrom)
  if (filters.dateTo) query = query.lte("data_evento", filters.dateTo)
  const search = filters.search ? safeSearch(filters.search) : ""
  if (search) query = query.or(`nome.ilike.%${search}%,local.ilike.%${search}%`)
  return query
}

export async function fetchEcoDriveCampaignsPage(
  filters: EcoDriveCampaignFilters = {},
  page = 1,
  pageSize = 10
): Promise<EcoDriveCampaignPage> {
  let query = supabase.from("eco_drive_campaigns").select(CAMPAIGN_SELECT, { count: "exact" })
  query = applyFilters(query, filters)
  const start = (page - 1) * pageSize
  const { data, error, count } = await query
    .order("data_evento", { ascending: false })
    .range(start, start + pageSize - 1)
  if (error) throw error
  return {
    campaigns: ((data || []) as EcoDriveCampaignRow[]).map(mapEcoDriveCampaign),
    total: count || 0,
    page,
    pageSize,
  }
}

export async function fetchEcoDriveCampaigns(
  filters: EcoDriveCampaignFilters = {}
): Promise<EcoDriveCampaign[]> {
  let query = supabase.from("eco_drive_campaigns").select(CAMPAIGN_SELECT)
  query = applyFilters(query, filters)
  const { data, error } = await query.order("data_evento", { ascending: false })
  if (error) throw error
  return ((data || []) as EcoDriveCampaignRow[]).map(mapEcoDriveCampaign)
}

async function fetchCampaignById(id: string): Promise<EcoDriveCampaign> {
  const { data, error } = await supabase
    .from("eco_drive_campaigns")
    .select(CAMPAIGN_SELECT)
    .eq("id", id)
    .single()
  if (error) throw error
  return mapEcoDriveCampaign(data as EcoDriveCampaignRow)
}

function rpcPayload(input: CreateEcoDriveCampaignInput) {
  return {
    p_name: input.name.trim(),
    p_event_date: input.eventDate,
    p_location: input.location?.trim() || null,
    p_volunteer_count: input.volunteerCount,
    p_status: input.status,
    p_notes: input.notes?.trim() || null,
    p_materials: input.materials,
  }
}

export async function createEcoDriveCampaign(input: CreateEcoDriveCampaignInput) {
  const { data, error } = await supabase.rpc("create_eco_drive_campaign", rpcPayload(input))
  if (error) throw error
  return fetchCampaignById(data as string)
}

export async function updateEcoDriveCampaign(input: UpdateEcoDriveCampaignInput) {
  const { data, error } = await supabase.rpc("update_eco_drive_campaign", {
    p_id: input.id,
    p_expected_updated_at: input.expectedUpdatedAt,
    ...rpcPayload(input),
  })
  if (error) throw error
  return fetchCampaignById(data as string)
}

export async function setEcoDriveCampaignArchived(
  campaign: Pick<EcoDriveCampaign, "id" | "updatedAt">,
  archived: boolean
) {
  if (!campaign.updatedAt) throw new Error("A campanha não possui versão para atualização.")
  const { data, error } = await supabase.rpc("set_eco_drive_campaign_archived", {
    p_id: campaign.id,
    p_expected_updated_at: campaign.updatedAt,
    p_archived: archived,
  })
  if (error) throw error
  return fetchCampaignById(data as string)
}

export function getEcoDriveMutationError(error: unknown) {
  const candidate = error as { code?: string; message?: string }
  if (candidate?.code === "40001" || candidate?.message?.includes("outra sessão")) {
    return "Esta campanha foi alterada em outra sessão. Atualize a listagem e tente novamente."
  }
  return candidate?.message || "Não foi possível concluir a operação. Tente novamente."
}

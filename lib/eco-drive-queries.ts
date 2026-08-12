import { supabase } from "@/lib/supabase"
import {
  type CreateEcoDriveCampaignInput,
  type EcoDriveCampaign,
  type EcoDriveMaterialType,
  type EcoDriveMaterialUnit,
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
  local: string
  numero_voluntarios: number
  numero_participantes?: number
  status: "planejada" | "concluida"
  observacoes?: string | null
  criado_em?: string
  eco_drive_materials?: EcoDriveMaterialRow[] | null
}

function mapCampaign(row: EcoDriveCampaignRow): EcoDriveCampaign {
  return {
    id: row.id,
    name: row.nome,
    eventDate: row.data_evento,
    location: row.local,
    volunteerCount: row.numero_voluntarios ?? row.numero_participantes ?? 0,
    status: row.status,
    notes: row.observacoes || undefined,
    createdAt: row.criado_em,
    materials: (row.eco_drive_materials || []).map((material) => ({
      id: material.id,
      type: material.tipo,
      quantity: Number(material.quantidade ?? material.quantidade_kg ?? 0),
      unit: material.unidade,
    })),
  }
}

export async function fetchEcoDriveCampaigns(): Promise<EcoDriveCampaign[]> {
  const { data, error } = await supabase
    .from("eco_drive_campaigns")
    .select("*, eco_drive_materials(*)")
    .order("data_evento", { ascending: false })

  if (error) throw error
  return ((data || []) as EcoDriveCampaignRow[]).map(mapCampaign)
}

export async function createEcoDriveCampaign(
  input: CreateEcoDriveCampaignInput
): Promise<EcoDriveCampaign> {
  const { data: campaign, error: campaignError } = await supabase
    .from("eco_drive_campaigns")
    .insert({
      nome: input.name.trim(),
      data_evento: input.eventDate,
      local: input.location.trim(),
      numero_voluntarios: input.volunteerCount,
      status: input.status,
      observacoes: input.notes?.trim() || null,
    })
    .select()
    .single()

  if (campaignError) throw campaignError

  const materials = input.materials.map((material) => ({
    campanha_id: campaign.id,
    tipo: material.type,
    quantidade: material.quantity,
    unidade: material.unit,
  }))

  const { data: savedMaterials, error: materialsError } = await supabase
    .from("eco_drive_materials")
    .insert(materials)
    .select()

  if (materialsError) {
    await supabase.from("eco_drive_campaigns").delete().eq("id", campaign.id)
    throw materialsError
  }

  return mapCampaign({
    ...campaign,
    eco_drive_materials: savedMaterials as EcoDriveMaterialRow[],
  })
}

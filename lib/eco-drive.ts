export const ECO_DRIVE_MATERIALS = [
  { type: "tampinhas", label: "Tampinhas de garrafa", unit: "kg" },
  { type: "cartelas_remedios", label: "Cartelas de remédios", unit: "kg" },
  { type: "embalagens_pet", label: "Embalagens de torta (PET)", unit: "kg" },
  { type: "embalagens_laminadas", label: "Embalagens laminadas", unit: "kg" },
  { type: "isopor", label: "Isopor", unit: "kg" },
  { type: "outros", label: "Outros", unit: "kg" },
  { type: "esponjas", label: "Esponjas de cozinha", unit: "unidade" },
] as const

export type EcoDriveMaterialType = typeof ECO_DRIVE_MATERIALS[number]["type"]
export type EcoDriveMaterialUnit = typeof ECO_DRIVE_MATERIALS[number]["unit"]
export type EcoDriveCampaignStatus = "planejada" | "concluida"

export interface EcoDriveMaterial {
  id?: string
  type: EcoDriveMaterialType
  quantity: number
  unit: EcoDriveMaterialUnit
}

export interface EcoDriveCampaign {
  id: string
  name: string
  eventDate: string
  location?: string
  volunteerCount: number
  status: EcoDriveCampaignStatus
  notes?: string
  materials: EcoDriveMaterial[]
  createdAt?: string
  updatedAt?: string
  archivedAt?: string
  archivedBy?: string
}

export interface CreateEcoDriveCampaignInput {
  name: string
  eventDate: string
  location: string
  volunteerCount: number
  status: EcoDriveCampaignStatus
  notes?: string
  materials: Array<Pick<EcoDriveMaterial, "type" | "quantity" | "unit">>
}

export interface UpdateEcoDriveCampaignInput extends CreateEcoDriveCampaignInput {
  id: string
  expectedUpdatedAt: string
}

export type EcoDriveArchiveFilter = "active" | "archived" | "all"

export interface EcoDriveCampaignFilters {
  search?: string
  status?: EcoDriveCampaignStatus | "all"
  year?: number
  dateFrom?: string
  dateTo?: string
  archive?: EcoDriveArchiveFilter
}

export interface EcoDriveCampaignPage {
  campaigns: EcoDriveCampaign[]
  total: number
  page: number
  pageSize: number
}

export interface EcoDriveValidationError {
  field: string
  message: string
}

export function getEcoDriveLocationLabel(location?: string | null) {
  return location?.trim() || "Não informado"
}

export function validateEcoDriveCampaignInput(
  input: CreateEcoDriveCampaignInput
): EcoDriveValidationError[] {
  const errors: EcoDriveValidationError[] = []
  if (!input.name.trim()) errors.push({ field: "name", message: "Informe o nome da campanha." })
  if (!input.eventDate) errors.push({ field: "eventDate", message: "Informe a data do evento." })
  if (!Number.isInteger(input.volunteerCount) || input.volunteerCount < 0) {
    errors.push({ field: "volunteerCount", message: "O número de voluntários deve ser inteiro e não negativo." })
  }

  for (const material of input.materials) {
    if (!Number.isFinite(material.quantity) || material.quantity < 0) {
      errors.push({ field: material.type, message: "A quantidade não pode ser negativa." })
    } else if (material.unit === "unidade" && !Number.isInteger(material.quantity)) {
      errors.push({ field: material.type, message: "Materiais por unidade devem usar números inteiros." })
    } else if (material.unit === "kg" && Math.abs(Math.round(material.quantity * 10) - material.quantity * 10) > Number.EPSILON) {
      errors.push({ field: material.type, message: "O peso deve possuir no máximo uma casa decimal." })
    }
  }
  return errors
}

export function getEcoDriveCampaignTotals(campaign: EcoDriveCampaign) {
  return campaign.materials.reduce(
    (totals, material) => {
      if (material.unit === "kg") totals.kg += material.quantity
      if (material.unit === "unidade") totals.units += material.quantity
      return totals
    },
    { kg: 0, units: 0 }
  )
}

export function calculateEcoDriveStats(campaigns: EcoDriveCampaign[]) {
  const activeCampaigns = campaigns.filter((campaign) => !campaign.archivedAt)
  const completedCampaigns = activeCampaigns.filter(
    (campaign) => campaign.status === "concluida"
  )
  const totalKg = completedCampaigns.reduce(
    (total, campaign) => total + getEcoDriveCampaignTotals(campaign).kg,
    0
  )
  const totalUnits = completedCampaigns.reduce(
    (total, campaign) => total + getEcoDriveCampaignTotals(campaign).units,
    0
  )
  const totalVolunteers = completedCampaigns.reduce(
    (total, campaign) => total + campaign.volunteerCount,
    0
  )

  return {
    campaigns: activeCampaigns.length,
    completedCampaigns: completedCampaigns.length,
    totalKg,
    totalUnits,
    totalVolunteers,
  }
}

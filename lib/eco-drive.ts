export const ECO_DRIVE_MATERIALS = [
  { type: "tampinhas", label: "Tampinhas de garrafa", unit: "kg" },
  { type: "cartelas_remedios", label: "Cartelas de remédios vazias", unit: "kg" },
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
  location: string
  volunteerCount: number
  status: EcoDriveCampaignStatus
  notes?: string
  materials: EcoDriveMaterial[]
  createdAt?: string
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
  const completedCampaigns = campaigns.filter(
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
    campaigns: campaigns.length,
    completedCampaigns: completedCampaigns.length,
    totalKg,
    totalUnits,
    totalVolunteers,
  }
}

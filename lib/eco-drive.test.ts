import { describe, expect, it } from "vitest"
import {
  calculateEcoDriveStats,
  getEcoDriveCampaignTotals,
  type EcoDriveCampaign,
} from "@/lib/eco-drive"

const campaigns: EcoDriveCampaign[] = [
  {
    id: "campaign-1",
    name: "Eco Drive Janeiro",
    eventDate: "2026-01-17",
    location: "Praça da Matriz",
    volunteerCount: 5,
    status: "concluida",
    materials: [
      { type: "tampinhas", quantity: 20, unit: "kg" },
      { type: "isopor", quantity: 30.5, unit: "kg" },
      { type: "esponjas", quantity: 12, unit: "unidade" },
    ],
  },
  {
    id: "campaign-2",
    name: "Eco Drive Fevereiro",
    eventDate: "2026-02-21",
    location: "Praça da Matriz",
    volunteerCount: 4,
    status: "concluida",
    materials: [
      { type: "embalagens_pet", quantity: 49.5, unit: "kg" },
      { type: "esponjas", quantity: 8, unit: "unidade" },
    ],
  },
  {
    id: "campaign-3",
    name: "Eco Drive Março",
    eventDate: "2026-03-21",
    location: "Parque dos Pinheiros",
    volunteerCount: 0,
    status: "planejada",
    materials: [
      { type: "outros", quantity: 100, unit: "kg" },
    ],
  },
]

describe("estatísticas do Eco Drive", () => {
  it("soma todos os materiais de uma campanha", () => {
    expect(getEcoDriveCampaignTotals(campaigns[0])).toEqual({ kg: 50.5, units: 12 })
  })

  it("considera somente campanhas concluídas nos totais", () => {
    expect(calculateEcoDriveStats(campaigns)).toEqual({
      campaigns: 3,
      completedCampaigns: 2,
      totalKg: 100,
      totalUnits: 20,
      totalVolunteers: 9,
    })
  })

  it("ignora quantidades de campanhas ainda planejadas", () => {
    expect(calculateEcoDriveStats([campaigns[2]])).toMatchObject({
      totalKg: 0,
      totalUnits: 0,
    })
  })
})

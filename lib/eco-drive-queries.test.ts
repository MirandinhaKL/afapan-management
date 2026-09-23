import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/supabase", () => ({ supabase: {} }))
import { getEcoDriveMutationError, mapEcoDriveCampaign } from "@/lib/eco-drive-queries"

describe("consultas do CRUD Eco Drive", () => {
  it("mapeia local opcional, versão e arquivamento retornados pelo banco", () => {
    const campaign = mapEcoDriveCampaign({
      id: "campaign-1",
      nome: "Eco Drive Setembro",
      data_evento: "2026-09-19",
      local: null,
      numero_voluntarios: 4,
      status: "concluida",
      atualizado_em: "2026-09-22T10:00:00Z",
      arquivado_em: "2026-09-22T11:00:00Z",
      eco_drive_materials: [{ id: "material-1", tipo: "esponjas", quantidade: "12", unidade: "unidade" }],
    })
    expect(campaign).toMatchObject({
      location: undefined,
      updatedAt: "2026-09-22T10:00:00Z",
      archivedAt: "2026-09-22T11:00:00Z",
      materials: [{ type: "esponjas", quantity: 12, unit: "unidade" }],
    })
  })

  it("apresenta uma orientação clara quando outra sessão alterou a campanha", () => {
    expect(getEcoDriveMutationError({ code: "40001", message: "conflito" })).toContain("outra sessão")
  })
})

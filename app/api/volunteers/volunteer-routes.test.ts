import { beforeEach, describe, expect, it, vi } from "vitest"

const { createSupabaseServiceClient } = vi.hoisted(() => ({ createSupabaseServiceClient: vi.fn() }))
vi.mock("@/lib/supabase-server", () => ({ createSupabaseServiceClient }))

import { GET } from "@/app/api/volunteers/campaign/active/route"
import { POST } from "@/app/api/volunteers/submit/route"

describe("rotas públicas de voluntários", () => {
  beforeEach(() => vi.clearAllMocks())

  it("carrega a única campanha ativa sem token público", async () => {
    const campaign = { nome: "Confirmação", prazo: "2026-10-06T23:59:00Z", privacy_text: "Privacidade", privacy_version: "1", participation_text: "Participação", participation_version: "1" }
    const chain: any = { select: vi.fn(), eq: vi.fn(), gte: vi.fn(), limit: vi.fn() }
    chain.select.mockReturnValue(chain); chain.eq.mockReturnValue(chain); chain.gte.mockReturnValue(chain); chain.limit.mockResolvedValue({ data: [campaign], error: null })
    createSupabaseServiceClient.mockReturnValue({ rpc: vi.fn().mockResolvedValue({}), from: vi.fn().mockReturnValue(chain) })
    const response = await GET()
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ name: "Confirmação", privacyText: "Privacidade" })
  })

  it("informa indisponibilidade quando não existe campanha ativa", async () => {
    const chain: any = { select: vi.fn(), eq: vi.fn(), gte: vi.fn(), limit: vi.fn() }
    chain.select.mockReturnValue(chain); chain.eq.mockReturnValue(chain); chain.gte.mockReturnValue(chain); chain.limit.mockResolvedValue({ data: [], error: null })
    createSupabaseServiceClient.mockReturnValue({ rpc: vi.fn().mockResolvedValue({}), from: vi.fn().mockReturnValue(chain) })
    const response = await GET()
    expect(response.status).toBe(404)
  })

  it("rejeita formulário incompleto antes de acessar o banco", async () => {
    const response = await POST(new Request("http://localhost/api/volunteers/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ firstName: "" }) }))
    expect(response.status).toBe(400)
    expect((await response.json()).fields).toContain("firstName")
    expect(createSupabaseServiceClient).not.toHaveBeenCalled()
  })

  it("envia cadastro pela campanha ativa sem receber token do cliente", async () => {
    process.env.VOLUNTEER_FORM_RATE_LIMIT_SECRET = "test-secret"
    const attempts: any = { select: vi.fn(), eq: vi.fn(), gte: vi.fn(), insert: vi.fn() }
    attempts.select.mockReturnValue(attempts)
    attempts.eq.mockReturnValue(attempts)
    attempts.gte.mockResolvedValue({ count: 0, error: null })
    attempts.insert.mockResolvedValue({ error: null })
    const rpc = vi.fn().mockResolvedValue({ error: null })
    createSupabaseServiceClient.mockReturnValue({ rpc, from: vi.fn().mockReturnValue(attempts) })
    const response = await POST(new Request("http://localhost/api/volunteers/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Ana", lastName: "Silva", birthDate: "15/03/1990", phone: "(54) 99999-1234",
        neighborhood: "Centro", city: "Farroupilha", frequency: "mensal", activities: ["plantio_arvores_nativas", "coletas_residuos"],
        privacyAccepted: true, participationAccepted: true,
      }),
    }))
    expect(response.status).toBe(200)
    expect(rpc).toHaveBeenCalledWith("submit_volunteer_registration", expect.not.objectContaining({ p_campaign_token: expect.anything() }))
    expect(rpc).toHaveBeenCalledWith("submit_volunteer_registration", expect.objectContaining({ p_payload: expect.objectContaining({ activities: ["plantio_arvores_nativas", "coletas_residuos"] }) }))
  })

  it.each(["outras", "plantio_mudas", "atividade_inexistente"])("CA-052/CA-055: rejeita código %s antes de acessar o banco", async (activity) => {
    const response = await POST(new Request("http://localhost/api/volunteers/submit", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName: "Ana", lastName: "Silva", birthDate: "15/03/1990", phone: "(54) 99999-1234", neighborhood: "Centro", city: "Farroupilha", frequency: "mensal", activities: [activity], privacyAccepted: true, participationAccepted: true }),
    }))
    expect(response.status).toBe(400)
    expect((await response.json()).fields).toContain("activities")
    expect(createSupabaseServiceClient).not.toHaveBeenCalled()
  })
})

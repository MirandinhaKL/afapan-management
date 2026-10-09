import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { createSupabaseServiceClient } = vi.hoisted(() => ({ createSupabaseServiceClient: vi.fn() }))
vi.mock("@/lib/supabase-server", () => ({ createSupabaseServiceClient }))

import { GET } from "@/app/api/volunteers/form/route"
import { GET as OLD_GET } from "@/app/api/volunteers/campaign/active/route"
import { POST } from "@/app/api/volunteers/submit/route"

const validInput = {
  firstName: "Ana", lastName: "Silva", birthDate: "15/03/1990", phone: "(54) 99999-1234",
  neighborhood: "Centro", city: "Farroupilha", frequency: "mensal", activities: ["plantio_arvores_nativas", "coletas_residuos"],
  privacyAccepted: true, participationAccepted: true, privacyVersion: "permanente-1", participationVersion: "permanente-1",
}
const request = (input: unknown) => new Request("http://localhost/api/volunteers/submit", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
})

function submissionClient(count = 0, error: unknown = null) {
  const attempts = { select: vi.fn(), eq: vi.fn(), gte: vi.fn(), insert: vi.fn() }
  attempts.select.mockReturnValue(attempts)
  attempts.eq.mockReturnValue(attempts)
  attempts.gte.mockResolvedValue({ count, error: null })
  attempts.insert.mockResolvedValue({ error: null })
  const rpc = vi.fn().mockResolvedValue({ error: null })
  rpc.mockImplementation(async (name: string) => ({ error: name === "submit_permanent_volunteer_registration" ? error : null }))
  const from = vi.fn().mockReturnValue(attempts)
  createSupabaseServiceClient.mockReturnValue({ rpc, from })
  return { rpc, from, attempts }
}

describe("rotas do cadastro permanente de voluntários", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv("VOLUNTEER_FORM_RATE_LIMIT_SECRET", "test-secret")
    vi.spyOn(console, "error").mockImplementation(() => {})
  })
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs() })

  it("CA-001/CA-002/CA-005: carrega somente textos e versões sem consultar campanha", async () => {
    const data = { privacy_text: "Privacidade", privacy_version: "permanente-1", participation_text: "Participação", participation_version: "permanente-1", id: 1 }
    const chain = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn().mockResolvedValue({ data, error: null }) }
    chain.select.mockReturnValue(chain); chain.eq.mockReturnValue(chain)
    const from = vi.fn().mockReturnValue(chain)
    const rpc = vi.fn()
    createSupabaseServiceClient.mockReturnValue({ from, rpc })
    const response = await GET()
    expect(response.status).toBe(200)
    expect(response.headers.get("Cache-Control")).toBe("no-store")
    expect(await response.json()).toEqual({ privacyText: "Privacidade", privacyVersion: "permanente-1", participationText: "Participação", participationVersion: "permanente-1" })
    expect(from).toHaveBeenCalledWith("volunteer_registration_settings")
    expect(from).toHaveBeenCalledTimes(1)
    expect(rpc).not.toHaveBeenCalled()
  })

  it.each([null, { privacy_text: "", privacy_version: "1" }])("CA-010: configuração ausente ou inválida é falha técnica sem período de inscrição", async (data) => {
    const chain = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn().mockResolvedValue({ data, error: null }) }
    chain.select.mockReturnValue(chain); chain.eq.mockReturnValue(chain)
    createSupabaseServiceClient.mockReturnValue({ from: vi.fn().mockReturnValue(chain) })
    const response = await GET()
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ error: "Não foi possível carregar os textos do formulário. Tente novamente." })
  })

  it("CA-006: chamada de uma página antiga não processa expiração", async () => {
    expect((await OLD_GET()).status).toBe(410)
    expect(createSupabaseServiceClient).not.toHaveBeenCalled()
  })

  it("rejeita formulário incompleto antes de acessar o banco", async () => {
    const response = await POST(request({ firstName: "" }))
    expect(response.status).toBe(400)
    expect((await response.json()).fields).toContain("firstName")
    expect(createSupabaseServiceClient).not.toHaveBeenCalled()
  })

  it("CA-002/CA-005: envia cadastro pela RPC permanente, descartando campos de campanha e situação", async () => {
    const { rpc, from, attempts } = submissionClient()
    const response = await POST(request({ ...validInput, campaignId: "antiga", status: "ativo", origin: "assistido", privacyText: "arbitrário" }))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true, status: "aguardando_validacao" })
    expect(rpc.mock.calls.map((call) => call[0])).toEqual(["purge_old_volunteer_submission_attempts", "submit_permanent_volunteer_registration"])
    const payload = rpc.mock.calls[1][1].p_payload
    expect(payload).toMatchObject({ normalizedPhone: "5554999991234", birthDate: "1990-03-15", privacyVersion: "permanente-1", participationVersion: "permanente-1" })
    expect(payload).not.toHaveProperty("campaignId")
    expect(payload).not.toHaveProperty("status")
    expect(payload).not.toHaveProperty("origin")
    expect(payload).not.toHaveProperty("privacyText")
    expect(from.mock.calls.map((call) => call[0])).toEqual(["volunteer_public_submission_attempts", "volunteer_public_submission_attempts"])
    expect(attempts.insert.mock.calls[0][0]).toMatchObject({ source_hash: expect.stringMatching(/^[a-f0-9]{64}$/), phone_hash: expect.stringMatching(/^[a-f0-9]{64}$/) })
  })

  it.each(["outras", "plantio_mudas", "atividade_inexistente"])("CA-007: rejeita código antigo ou desconhecido %s", async (activity) => {
    const response = await POST(request({ ...validInput, activities: [activity] }))
    expect(response.status).toBe(400)
    expect((await response.json()).fields).toContain("activities")
    expect(createSupabaseServiceClient).not.toHaveBeenCalled()
  })

  it("CA-007: responsável e autorização continuam obrigatórios para menor", async () => {
    const response = await POST(request({ ...validInput, birthDate: "10/01/2012" }))
    expect(response.status).toBe(400)
    expect((await response.json()).fields).toEqual(expect.arrayContaining(["guardianName", "guardianPhone", "guardianAuthorized"]))
    expect(createSupabaseServiceClient).not.toHaveBeenCalled()
  })

  it("CA-005: versão ausente é rejeitada antes de acessar banco", async () => {
    const response = await POST(request({ ...validInput, privacyVersion: undefined }))
    expect(response.status).toBe(400)
    expect((await response.json()).fields).toContain("privacyVersion")
    expect(createSupabaseServiceClient).not.toHaveBeenCalled()
  })

  it("CA-005/CA-010: versão desatualizada exige atualização dos textos sem confirmar sucesso", async () => {
    const { rpc } = submissionClient(0, { code: "22023", message: "FORM_VERSION_OUTDATED" })
    const response = await POST(request(validInput))
    expect(response.status).toBe(409)
    expect(await response.json()).toMatchObject({ code: "FORM_VERSION_OUTDATED" })
    expect(rpc).toHaveBeenCalledTimes(2)
  })

  it("CA-007: duplicidade não expõe os dados do cadastro", async () => {
    submissionClient(0, { code: "23505", message: "PHONE_ALREADY_REGISTERED: dados internos" })
    const response = await POST(request(validInput))
    expect(response.status).toBe(409)
    const data = await response.json()
    expect(data.error).toContain("fale com a AFAPAN")
    expect(data.error).not.toContain("dados internos")
  })

  it("CA-007: honeypot não acessa banco", async () => {
    expect((await POST(request({ website: "robot" }))).status).toBe(200)
    expect(createSupabaseServiceClient).not.toHaveBeenCalled()
  })

  it("CA-007: limite de tentativas impede RPC de cadastro e nova tentativa", async () => {
    const { rpc, attempts } = submissionClient(10)
    expect((await POST(request(validInput))).status).toBe(429)
    expect(rpc.mock.calls.map((call) => call[0])).toEqual(["purge_old_volunteer_submission_attempts"])
    expect(attempts.insert).not.toHaveBeenCalled()
  })

  it("CA-010: falha na limpeza impede criação e não expõe detalhes técnicos", async () => {
    const { rpc, from } = submissionClient()
    rpc.mockResolvedValue({ error: { message: "internal cleanup error" } })
    const response = await POST(request(validInput))
    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: "Não foi possível enviar o cadastro. Tente novamente." })
    expect(from).not.toHaveBeenCalled()
    expect(rpc).toHaveBeenCalledTimes(1)
  })

  it("CA-010: timeout de cadastro não repete a criação nem confirma sucesso", async () => {
    const { rpc } = submissionClient(0, { message: "upstream request timeout" })
    const response = await POST(request(validInput))
    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: "Não foi possível enviar o cadastro. Tente novamente." })
    expect(rpc.mock.calls.filter((call) => call[0] === "submit_permanent_volunteer_registration")).toHaveLength(1)
  })
})

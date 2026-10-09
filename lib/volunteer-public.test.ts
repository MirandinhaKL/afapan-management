import { describe, expect, it } from "vitest"
import { getPublicVolunteerError, getVolunteerRequestHash, prepareVolunteerRpcPayload } from "@/lib/volunteer-public"

describe("envio público de voluntários", () => {
  it("gera identificadores estáveis sem expor o valor original", () => {
    const hash = getVolunteerRequestHash("192.0.2.1", "secret")
    expect(hash).toHaveLength(64)
    expect(hash).toBe(getVolunteerRequestHash("192.0.2.1", "secret"))
    expect(hash).not.toContain("192.0.2.1")
  })

  it("normaliza telefones e converte data brasileira antes da RPC", () => {
    const payload = prepareVolunteerRpcPayload({
      firstName: "Ana", lastName: "Silva", birthDate: "15/03/1990", phone: "(54) 99999-1234",
      neighborhood: "Centro", city: "Farroupilha", frequency: "mensal", activities: ["plantio_arvores_nativas", "comunicacao_divulgacao"],
      privacyAccepted: true, participationAccepted: true, privacyVersion: "permanente-1", participationVersion: "permanente-1",
    })
    expect(payload.normalizedPhone).toBe("5554999991234")
    expect(payload.birthDate).toBe("1990-03-15")
    expect(payload.activityStartMonth).toBeNull()
    expect(payload.activities).toEqual(["plantio_arvores_nativas", "comunicacao_divulgacao"])
    expect(payload).not.toHaveProperty("otherActivityDescription")
    expect(payload).toMatchObject({ privacyVersion: "permanente-1", participationVersion: "permanente-1" })
    expect(payload).not.toHaveProperty("campaignId")
  })

  it("não revela dados do cadastro ao informar duplicidade", () => {
    const result = getPublicVolunteerError({ code: "23505", message: "PHONE_ALREADY_REGISTERED" })
    expect(result.status).toBe(409)
    expect(result.message).toContain("fale com a AFAPAN")
  })

  it("CA-005: diferencia versão desatualizada de telefone duplicado", () => {
    expect(getPublicVolunteerError({ message: "FORM_VERSION_OUTDATED", code: "22023" })).toMatchObject({ status: 409, code: "FORM_VERSION_OUTDATED" })
  })

  it("CA-010: erros técnicos e falta de configuração não revelam detalhes internos", () => {
    expect(getPublicVolunteerError({ code: "P0002", message: "FORM_CONFIGURATION_MISSING" })).toEqual({ status: 500, message: "Não foi possível enviar o cadastro. Tente novamente." })
  })
})

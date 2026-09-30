import { describe, expect, it } from "vitest"
import { getPublicVolunteerError, getVolunteerRequestHash, prepareVolunteerRpcPayload } from "@/lib/volunteer-public"

describe("envio público de voluntários", () => {
  it("gera identificadores estáveis sem expor o valor original", () => {
    const hash = getVolunteerRequestHash("192.0.2.1", "secret")
    expect(hash).toHaveLength(64)
    expect(hash).toBe(getVolunteerRequestHash("192.0.2.1", "secret"))
    expect(hash).not.toContain("192.0.2.1")
  })

  it("normaliza os telefones antes da RPC", () => {
    const payload = prepareVolunteerRpcPayload({
      firstName: "Ana", lastName: "Silva", birthDate: "1990-01-01", phone: "(54) 99999-1234",
      neighborhood: "Centro", city: "Farroupilha", availableDays: ["sabado"], availableShifts: ["manha"],
      frequency: "mensal", activities: ["plantio_mudas"], privacyAccepted: true, participationAccepted: true,
    })
    expect(payload.normalizedPhone).toBe("5554999991234")
    expect(payload.activityStartMonth).toBeNull()
  })

  it("não revela dados do cadastro ao informar duplicidade", () => {
    const result = getPublicVolunteerError({ code: "23505", message: "PHONE_ALREADY_REGISTERED" })
    expect(result.status).toBe(409)
    expect(result.message).toContain("fale com a AFAPAN")
  })
})

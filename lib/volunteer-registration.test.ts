import { describe, expect, it } from "vitest"
import { publicVolunteerPayloadSchema, volunteerFormSettingsSchema } from "@/lib/volunteer-registration"

const input = {
  firstName: "Ana", lastName: "Silva", birthDate: "15/03/1990", phone: "(54) 99999-1234",
  neighborhood: "Centro", city: "Farroupilha", frequency: "mensal", activities: ["plantio_arvores_nativas"],
  privacyAccepted: true, participationAccepted: true, privacyVersion: "permanente-1", participationVersion: "permanente-1",
}

describe("contratos do cadastro permanente", () => {
  it("CA-001/CA-005: configuração contém somente textos e versões, sem campanha ou prazo", () => {
    const settings = volunteerFormSettingsSchema.parse({ privacyText: "Privacidade", privacyVersion: "1", participationText: "Participação", participationVersion: "2", name: "Campanha", deadline: "2000-01-01", active: false })
    expect(Object.keys(settings)).toEqual(["privacyText", "privacyVersion", "participationText", "participationVersion"])
    expect(volunteerFormSettingsSchema.safeParse({ ...settings, participationText: "" }).success).toBe(false)
  })

  it("CA-002/CA-007: aceita envio sem campanha e descarta campos administrativos injetados", () => {
    const parsed = publicVolunteerPayloadSchema.parse({ ...input, campaignId: "antiga", status: "ativo", origin: "assistido", privacyText: "texto arbitrário" })
    expect(parsed).toEqual(input)
  })

  it("CA-005: exige as versões dos textos realmente apresentados", () => {
    expect(publicVolunteerPayloadSchema.safeParse({ ...input, privacyVersion: undefined }).success).toBe(false)
    expect(publicVolunteerPayloadSchema.safeParse({ ...input, participationVersion: "" }).success).toBe(false)
  })
})

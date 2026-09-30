import { describe, expect, it } from "vitest"
import {
  calculateAge,
  formatActivityStart,
  formatBirthday,
  normalizeBrazilianPhone,
  validateActivityStart,
  validateVolunteerInput,
  type VolunteerInput,
} from "@/lib/volunteers"

const validInput: VolunteerInput = {
  firstName: "Ana",
  lastName: "Silva",
  birthDate: "1990-10-15",
  phone: "(54) 99999-1234",
  email: "ana@example.com",
  neighborhood: "Centro",
  city: "Farroupilha",
  activityStartMonth: 3,
  activityStartYear: 2020,
  availableDays: ["sabado"],
  availableShifts: ["manha"],
  frequency: "mensal",
  activities: ["plantio_mudas"],
  privacyAccepted: true,
  participationAccepted: true,
}

describe("domínio de voluntários", () => {
  it("normaliza telefones brasileiros com e sem código do país", () => {
    expect(normalizeBrazilianPhone("(54) 99999-1234")).toBe("5554999991234")
    expect(normalizeBrazilianPhone("+55 54 99999-1234")).toBe("5554999991234")
  })

  it("calcula a idade considerando se o aniversário já ocorreu", () => {
    expect(calculateAge("2000-10-15", new Date(2026, 8, 29))).toBe(25)
    expect(calculateAge("2000-09-15", new Date(2026, 8, 29))).toBe(26)
  })

  it("formata aniversário sem revelar o ano", () => {
    expect(formatBirthday("1990-02-03")).toBe("03/02")
  })

  it("aceita mês e ano de início opcionais, mas rejeita competência incompleta ou futura", () => {
    const today = new Date(2026, 8, 29)
    expect(validateActivityStart(null, null, today)).toBe(true)
    expect(validateActivityStart(9, 2026, today)).toBe(true)
    expect(validateActivityStart(10, 2026, today)).toBe(false)
    expect(validateActivityStart(9, null, today)).toBe(false)
    expect(formatActivityStart(3, 2020)).toBe("03/2020")
    expect(formatActivityStart()).toBe("Não informado")
  })

  it("exige responsável e autorização para menores", () => {
    const errors = validateVolunteerInput({ ...validInput, birthDate: "2012-01-10" }, new Date(2026, 8, 29))
    expect(errors.map((error) => error.field)).toEqual(expect.arrayContaining([
      "guardianName", "guardianPhone", "guardianAuthorized",
    ]))
  })

  it("exige descrição quando outras atividades forem selecionadas", () => {
    const errors = validateVolunteerInput({ ...validInput, activities: ["outras"] }, new Date(2026, 8, 29))
    expect(errors.map((error) => error.field)).toContain("otherActivityDescription")
  })

  it("aceita um cadastro adulto completo", () => {
    expect(validateVolunteerInput(validInput, new Date(2026, 8, 29))).toEqual([])
  })
})

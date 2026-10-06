import { describe, expect, it } from "vitest"
import {
  brazilianDateToIso,
  calculateAge,
  formatActivityStart,
  formatBirthday,
  isoDateToBrazilian,
  maskBrazilianDate,
  maskMonthYear,
  normalizeBrazilianPhone,
  parseMonthYear,
  validateActivityStart,
  validateVolunteerInput,
  type VolunteerInput,
} from "@/lib/volunteers"

const validInput: VolunteerInput = {
  firstName: "Ana", lastName: "Silva", birthDate: "15/10/1990", phone: "(54) 99999-1234",
  email: "ana@example.com", neighborhood: "Centro", city: "Farroupilha",
  activityStartMonth: 3, activityStartYear: 2020, frequency: "mensal",
  activities: ["plantio_mudas"], privacyAccepted: true, participationAccepted: true,
}

describe("domínio de voluntários", () => {
  it("normaliza telefones brasileiros com e sem código do país", () => {
    expect(normalizeBrazilianPhone("(54) 99999-1234")).toBe("5554999991234")
    expect(normalizeBrazilianPhone("+55 54 99999-1234")).toBe("5554999991234")
  })

  it("converte e mascara datas no padrão brasileiro sem inverter dia e mês", () => {
    expect(maskBrazilianDate("15031990")).toBe("15/03/1990")
    expect(brazilianDateToIso("15/03/1990")).toBe("1990-03-15")
    expect(isoDateToBrazilian("1990-03-15")).toBe("15/03/1990")
    expect(brazilianDateToIso("31/02/1990")).toBeNull()
  })

  it("converte mês e ano no padrão brasileiro", () => {
    expect(maskMonthYear("032020")).toBe("03/2020")
    expect(parseMonthYear("03/2020")).toEqual({ month: 3, year: 2020 })
  })

  it("calcula a idade com datas ISO e brasileiras", () => {
    expect(calculateAge("15/10/2000", new Date(2026, 8, 29))).toBe(25)
    expect(calculateAge("2000-09-15", new Date(2026, 8, 29))).toBe(26)
  })

  it("formata aniversário sem revelar o ano", () => {
    expect(formatBirthday("03/02/1990")).toBe("03/02")
  })

  it("aceita início opcional, mas rejeita competência incompleta ou futura", () => {
    const today = new Date(2026, 8, 29)
    expect(validateActivityStart(null, null, today)).toBe(true)
    expect(validateActivityStart(9, 2026, today)).toBe(true)
    expect(validateActivityStart(10, 2026, today)).toBe(false)
    expect(validateActivityStart(9, null, today)).toBe(false)
    expect(formatActivityStart(3, 2020)).toBe("03/2020")
  })

  it("exige responsável e autorização para menores", () => {
    const errors = validateVolunteerInput({ ...validInput, birthDate: "10/01/2012" }, new Date(2026, 8, 29))
    expect(errors.map((error) => error.field)).toEqual(expect.arrayContaining(["guardianName", "guardianPhone", "guardianAuthorized"]))
  })

  it("aceita os novos campos de perfil vazios e exige somente frequência", () => {
    expect(validateVolunteerInput(validInput, new Date(2026, 8, 29))).toEqual([])
  })

  it("aceita recusa expressa de uso da imagem", () => {
    expect(validateVolunteerInput({ ...validInput, imageUseAuthorized: false }, new Date(2026, 8, 29))).toEqual([])
  })
})

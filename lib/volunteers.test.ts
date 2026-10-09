import { describe, expect, it } from "vitest"
import {
  VOLUNTEER_ACTIVITIES,
  VOLUNTEER_ACTIVITY_GROUPS,
  brazilianDateToIso,
  calculateAge,
  formatActivityStart,
  formatBirthday,
  isoDateToBrazilian,
  getBirthDateValidationError,
  getEmailValidationError,
  maskBrazilianDate,
  maskBrazilianPhone,
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
  activities: ["plantio_arvores_nativas"], privacyAccepted: true, participationAccepted: true,
}

describe("domínio de voluntários", () => {
  it("normaliza telefones brasileiros com e sem código do país", () => {
    expect(normalizeBrazilianPhone("(54) 99999-1234")).toBe("5554999991234")
    expect(normalizeBrazilianPhone("+55 54 99999-1234")).toBe("5554999991234")
  })

  it("aplica máscara brasileira e limita o celular a onze dígitos", () => {
    expect(maskBrazilianPhone("54999991234")).toBe("(54) 99999-1234")
    expect(maskBrazilianPhone("+55 54 99999-1234")).toBe("(54) 99999-1234")
    expect(maskBrazilianPhone("54999991234999")).toBe("(54) 99999-1234")
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

  it("valida imediatamente datas de nascimento inválidas e futuras", () => {
    const today = new Date(2026, 9, 5)
    expect(getBirthDateValidationError("31/02/1990", today)).toContain("válida")
    expect(getBirthDateValidationError("06/10/2026", today)).toContain("futura")
    expect(getBirthDateValidationError("05/10/2000", today)).toBeNull()
  })

  it("aceita e-mail vazio, mas rejeita formato preenchido inválido", () => {
    expect(getEmailValidationError("")).toBeNull()
    expect(getEmailValidationError("ana@afapan.com.br")).toBeNull()
    expect(getEmailValidationError("ana@afapan")).toBe("Informe um e-mail válido.")
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

  it("CA-051/CA-052: oferece cinco grupos e treze atividades únicas aceitas pelo domínio", () => {
    expect(VOLUNTEER_ACTIVITY_GROUPS.map((group) => group.title)).toEqual(["Preservação da Mata Atlântica", "Reciclagem", "Compostagem", "Educação Ambiental", "Projetos e Eventos"])
    expect(VOLUNTEER_ACTIVITIES).toHaveLength(13)
    expect(new Set(VOLUNTEER_ACTIVITIES.map((item) => item.value)).size).toBe(13)
    for (const item of VOLUNTEER_ACTIVITIES) {
      expect(validateVolunteerInput({ ...validInput, activities: [item.value] }, new Date(2026, 8, 29))).toEqual([])
    }
  })

  it.each(["plantio_mudas", "coleta_residuos", "limpeza_areas_publicas", "retirada_plantas_exoticas", "conscientizacao_ambiental", "compostagem_escola", "ecopontos_bairros", "outras", "desconhecida"])("CA-055: rejeita atividade antiga ou desconhecida %s", (activity) => {
    expect(validateVolunteerInput({ ...validInput, activities: [activity] } as unknown as VolunteerInput)).toContainEqual({ field: "activities", message: "Selecione atividades válidas." })
  })

  it("aceita recusa expressa de uso da imagem", () => {
    expect(validateVolunteerInput({ ...validInput, imageUseAuthorized: false }, new Date(2026, 8, 29))).toEqual([])
  })
})

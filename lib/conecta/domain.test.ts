import { describe, expect, it } from "vitest"
import { applicationSchema, correctionSchema, isCivilDate, isValidCpf, recognizedMinutes, resendSchema } from "./domain"

describe("Conecta AFAPAN", () => {
  it("valida CPF e nascimento sem aceitar datas inexistentes ou destinatário público", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true)
    expect(isValidCpf("111.111.111-11")).toBe(false)
    expect(isValidCpf("52998224724")).toBe(false)
    expect(isCivilDate("2024-02-29")).toBe(true)
    expect(isCivilDate("2025-02-29")).toBe(false)
    expect(resendSchema.safeParse({ cpf: "52998224725", birthDate: "2000-01-01", email: "outro@example.test" }).success).toBe(false)
  })

  it("rejeita solicitação sem comprovante e período invertido", () => {
    const id = "8e11e491-1cbb-47ad-8b76-d605d7d270ff"
    const input = { cpf: "52998224725", birthDate: "2000-01-01", startDate: "2026-10-01", endDate: "2026-10-03", name: "Aluno Exemplo", email: "aluno@example.test", phone: "(54) 99999-0000", institution: "Exemplo", course: "Exemplo", report: "Atividade realizada", modalityVersion: id, tasks: [id], attachments: [id] }
    expect(applicationSchema.safeParse(input).success).toBe(true)
    expect(applicationSchema.safeParse({ ...input, attachments: [] }).success).toBe(false)
    expect(applicationSchema.safeParse({ ...input, endDate: "2026-09-30" }).success).toBe(false)
  })

  it("reconhece 6 h para a primeira etapa ou 12 h para todas em Compostando nas Escolas", () => {
    const tasks = [360, 120, 60, 120, 60].map((minutes, i) => ({ id: String(i), minutes }))
    expect(recognizedMinutes({ mode: "checklist", tasks }, ["0"])).toBe(360)
    expect(recognizedMinutes({ mode: "checklist", tasks }, tasks.map(task => task.id))).toBe(720)
    expect(() => recognizedMinutes({ mode: "checklist", tasks }, ["0", "0"])).toThrow()
    expect(() => recognizedMinutes({ mode: "checklist", tasks }, ["fora-do-catalogo"])).toThrow()
  })

  it("aceita correção com comprovante sem permitir trocar identificação ou destinatário", () => {
    const id = "8e11e491-1cbb-47ad-8b76-d605d7d270ff"
    const input = { report: "Relato atualizado", tasks: [id], attachments: [id] }
    expect(correctionSchema.safeParse(input).success).toBe(true)
    expect(correctionSchema.safeParse({ ...input, attachments: [] }).success).toBe(false)
    expect(correctionSchema.safeParse({ ...input, email: "outro@example.test" }).success).toBe(false)
    expect(correctionSchema.safeParse({ ...input, cpf: "52998224725" }).success).toBe(false)
  })

  it("reconhece minutos conferidos em visitas sem atribuir 12 horas automaticamente", () => {
    expect(recognizedMinutes({ mode: "free" }, [], 95)).toBe(95)
    expect(() => recognizedMinutes({ mode: "free" }, [])).toThrow()
    expect(() => recognizedMinutes({ mode: "free" }, [], 0)).toThrow()
  })
})

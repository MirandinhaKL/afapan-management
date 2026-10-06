import { describe, expect, it, vi } from "vitest"
vi.mock("@/lib/supabase", () => ({ supabase: {} }))
import { getVolunteerMutationError, mapVolunteer } from "@/lib/volunteer-queries"

describe("consultas administrativas de voluntários", () => {
  it("mapeia frequência, perfil opcional, interesses e início das atividades", () => {
    const volunteer = mapVolunteer({
      id: "1", nome: "Ana", sobrenome: "Silva", data_nascimento: "1990-02-03", telefone: "(54) 99999-1234",
      telefone_normalizado: "5554999991234", bairro: "Centro", cidade: "Farroupilha", status: "ativo", origem: "assistido",
      inicio_atividades_mes: 3, inicio_atividades_ano: 2020, expectativas: "Participar", uso_imagem_autorizado: false,
      criado_em: "2026-01-01", atualizado_em: "2026-01-01", volunteer_availability: { frequencia: "mensal" },
      volunteer_interests: [{ atividade: "plantio_mudas" }],
    })
    expect(volunteer).toMatchObject({ firstName: "Ana", activityStartMonth: 3, activityStartYear: 2020, frequency: "mensal", expectations: "Participar", imageUseAuthorized: false, activities: ["plantio_mudas"] })
  })

  it("traduz conflito concorrente em orientação clara", () => {
    expect(getVolunteerMutationError({ code: "40001" })).toContain("outra sessão")
  })
})

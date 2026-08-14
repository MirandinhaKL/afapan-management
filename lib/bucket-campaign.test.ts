import { describe, expect, it } from "vitest"
import { type Participante, type RegistroBalde } from "@/lib/mock-data"
import {
  getPrimeiroRegistroPendenteIndex,
  getRegistrosCampanhaSlots,
  isCampanhaBaldesPreenchida,
} from "@/lib/bucket-campaign"

function criarParticipante(quantidades: number[]): Participante {
  const baldes: RegistroBalde[] = quantidades.map((quantidade, index) => ({
    trimestre: `2026-R${index + 1}`,
    quantidade,
    dataRegistro: `2026-0${index + 1}-01`,
  }))

  return {
    id: "participante-1",
    nome: "Participante",
    telefone: "54999999999",
    email: "participante@exemplo.com",
    turma: "2026",
    baldes,
    ativo: true,
  }
}

describe("isCampanhaBaldesPreenchida", () => {
  it("considera preenchido quando os quatro campos são maiores que zero", () => {
    expect(isCampanhaBaldesPreenchida(criarParticipante([1, 2, 3, 4]))).toBe(true)
  })

  it("considera pendente quando um dos quatro campos é zero", () => {
    expect(isCampanhaBaldesPreenchida(criarParticipante([1, 2, 0, 4]))).toBe(false)
  })

  it("considera pendente enquanto não houver quatro registros", () => {
    expect(isCampanhaBaldesPreenchida(criarParticipante([1, 2, 3]))).toBe(false)
  })

  it("seleciona para o WhatsApp o primeiro registro com valor zero", () => {
    expect(getPrimeiroRegistroPendenteIndex(criarParticipante([1, 2, 0, 0]))).toBe(2)
  })

  it("informa que não há registro pendente quando os quatro são maiores que zero", () => {
    expect(getPrimeiroRegistroPendenteIndex(criarParticipante([1, 2, 3, 4]))).toBe(-1)
  })

  it("recupera uma submissão antiga sem sufixo no primeiro campo pendente", () => {
    const participante = criarParticipante([1, 2, 0, 4])
    participante.baldes.push({
      trimestre: "2026-Q1",
      quantidade: 8,
      dataRegistro: "2026-03-20",
    })

    expect(
      getRegistrosCampanhaSlots(participante).map((registro) =>
        registro?.quantidade
      )
    ).toEqual([1, 2, 8, 4])
  })
})

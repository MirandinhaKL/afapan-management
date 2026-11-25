import { expect, it, vi } from "vitest"
import { fetchParticipantesWithBaldes } from "./supabase-queries"

const { from } = vi.hoisted(() => ({ from: vi.fn() }))
vi.mock("./supabase", () => ({ supabase: { from } }))

it("preserva o endereço completo importado e os campos de endereço ao carregar participantes da turma", async () => {
  const participante = {
    id: "participante-1", nome: "Ana", sobrenome: "Silva", ativo: true,
    email: "ana@example.test", endereco: "Rua das Flores, 10, Centro, 95000-000",
    bairro: "Centro", cidade: "Cidade de teste", estado: "RS", cep: "95000-000",
  }
  const responses: Record<string, unknown> = {
    turmas: { id: "turma-1", nome: "10ª turma" },
    participantes_turmas: [{ participante_id: participante.id }],
    participantes: [participante],
    baldes: [],
  }
  from.mockImplementation((table: string) => {
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: responses[table], error: null }),
      then: (resolve: (value: unknown) => unknown) =>
        Promise.resolve({ data: responses[table], error: null }).then(resolve),
    }
    return query
  })
  const [result] = await fetchParticipantesWithBaldes("turma-1")
  expect(result).toMatchObject({
    nome: "Ana Silva", endereco: participante.endereco,
    bairro: "Centro", cidade: "Cidade de teste", estado: "RS", cep: "95000-000",
  })
})

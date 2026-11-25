import { expect, it, vi } from "vitest"
import { GET } from "./route"

const { session, service } = vi.hoisted(() => ({ session: vi.fn(), service: vi.fn() }))
vi.mock("@/lib/conecta/internal-server", () => ({ conectaInternalSession: session }))
vi.mock("@/lib/supabase-server", () => ({ createSupabaseServiceClient: service }))

function query(data: unknown, error: unknown = null) {
  return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data, error }) }
}

it("consulta somente a intenção do vínculo legível na turma selecionada", async () => {
  const participante = "12345678-1234-4234-8234-123456789abc"
  const turma = "22345678-1234-4234-8234-123456789abc"
  const request = new Request(`http://localhost/api/compostagem/intencao?participante=${participante}&turma=${turma}`)
  const vinculo = query({ id: "vinculo-autorizado" })
  const inscricao = query({ intencao: "Aprender\nCompostar" })
  session.mockResolvedValueOnce(null).mockResolvedValueOnce({ client: { from: () => query(null) } })
    .mockResolvedValue({ client: { from: () => vinculo } })
  service.mockReturnValue({ from: () => inscricao })
  expect((await GET(request)).status).toBe(401)
  expect((await GET(request)).status).toBe(404)
  expect(service).not.toHaveBeenCalled()
  const response = await GET(request)
  expect(response.headers.get("cache-control")).toBe("no-store")
  expect(await response.json()).toEqual({ intencao: "Aprender\nCompostar" })
  expect(vinculo.eq).toHaveBeenCalledWith("participante_id", participante)
  expect(vinculo.eq).toHaveBeenCalledWith("turma_id", turma)
  expect(inscricao.select).toHaveBeenCalledWith("intencao")
  expect(inscricao.eq).toHaveBeenCalledWith("vinculo_id", "vinculo-autorizado")
  inscricao.maybeSingle.mockResolvedValueOnce({ data: null, error: null })
  expect(await (await GET(request)).json()).toEqual({ intencao: null })
  inscricao.maybeSingle.mockResolvedValueOnce({ data: null, error: new Error("Falha interna") })
  expect((await GET(request)).status).toBe(500)
})

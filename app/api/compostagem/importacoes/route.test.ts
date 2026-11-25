// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest"
import { participantImportHeaders } from "@/lib/compostagem-importacao"
import { GET, POST } from "./route"

const mocks = vi.hoisted(() => ({ session: vi.fn(), rpc: vi.fn(), lookup: vi.fn() }))
vi.mock("@/lib/conecta/internal-server", () => ({ conectaInternalSession: mocks.session }))
vi.mock("@/lib/supabase-server", () => ({
  createSupabaseServiceClient: () => ({
    rpc: mocks.rpc,
    from: () => {
      const query = { select: () => query, eq: () => query, maybeSingle: mocks.lookup }
      return query
    },
  }),
}))

const turma = "12345678-1234-4234-8234-123456789abc"
const endpoint = "http://localhost/api/compostagem/importacoes"
const csv = participantImportHeaders.map(value => '"' + value + '"').join(",") +
  "\n10/2/2026 12:05:55,ana@example.com,Ana Silva,01234567890,,,,\n" +
  "10/2/2026 12:05:55,erro,Outra Pessoa,,,,,"
const classification = { linha: 2, acao: "novo", motivo: null, participante: null, vinculo: null }

function upload(comprovante?: string, target = turma, content = csv, revisouSemTelefone?: boolean) {
  const form = new FormData()
  form.set("arquivo", new Blob([content], { type: "text/csv" }), "inscricoes.csv")
  form.set("opcoes", JSON.stringify({ turma: target, comprovante, revisouSemTelefone }))
  return new Request(endpoint, { method: "POST", body: form })
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubEnv("COMPOSTAGEM_IMPORT_SECRET", "segredo-ficticio-para-testes")
  vi.stubEnv("COMPOSTAGEM_IMPORT_HISTORICO", "false")
  mocks.session.mockResolvedValue({ userId: "usuario-ficticio" })
  mocks.lookup.mockResolvedValue({ data: { usuario_id: "usuario-ficticio" } })
  mocks.rpc.mockResolvedValue({ data: { linhas: [classification], mudou: false } })
})

describe("API de importação de compostagem", () => {
  it("exige revisão sem telefone e invalida o comprovante ao desligar o modo histórico", async () => {
    const historical = csv.split("\n")[0] + "\n,,Ana Silva,,,,,"
    vi.stubEnv("COMPOSTAGEM_IMPORT_HISTORICO", "true")
    const preview = await (await POST(upload(undefined, turma, historical))).json()
    expect(preview).toMatchObject({ historico: true, requerRevisaoSemTelefone: true })
    expect((await POST(upload(preview.comprovante, turma, historical))).status).toBe(400)
    vi.stubEnv("COMPOSTAGEM_IMPORT_HISTORICO", "false")
    expect((await POST(upload(preview.comprovante, turma, historical, true))).status).toBe(409)
    expect(mocks.rpc).toHaveBeenCalledTimes(1)
  })

  it("exige sessão e permissão antes de consultar a transação", async () => {
    mocks.session.mockResolvedValueOnce(null)
    expect((await POST(upload())).status).toBe(401)
    mocks.lookup.mockResolvedValueOnce({ data: null })
    expect((await POST(upload())).status).toBe(403)
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it("mascara o CPF e confirma somente a linha válida da prévia", async () => {
    const response = await POST(upload())
    const preview = await response.json()
    expect(preview).toMatchObject({ gravado: false, novosVinculos: 1, linhas: [
      { status: "novo", cpf: "***.***.***-90" }, { status: "pendente" },
    ] })
    expect(JSON.stringify(preview)).not.toContain("01234567890")
    expect(mocks.rpc.mock.calls[0][1]).toMatchObject({ p_confirmadas: null, p_linhas: [{ linha: 2 }] })
    expect((await POST(upload(preview.comprovante, "22345678-1234-4234-8234-123456789abc"))).status).toBe(409)
    const result = await (await POST(upload(preview.comprovante))).json()
    expect(result.gravado).toBe(true)
    expect(mocks.rpc.mock.calls[1][1].p_confirmadas).toEqual({ "2": classification })
  })

  it("devolve nova prévia se a classificação mudar e oculta detalhes em falhas técnicas", async () => {
    const preview = await (await POST(upload())).json()
    mocks.rpc.mockResolvedValueOnce({ data: { linhas: [{ ...classification, acao: "pendente", motivo: "Cadastro inativo." }], mudou: true } })
    expect(await (await POST(upload(preview.comprovante))).json()).toMatchObject({ gravado: false, mudou: true })
    mocks.rpc.mockResolvedValueOnce({ error: new Error("detalhes internos") })
    const response = await POST(upload(preview.comprovante))
    expect(response.status).toBe(500)
    expect(await response.text()).not.toContain("detalhes internos")
  })

  it("permite consulta específica de CPF com sessão e sem cache", async () => {
    const request = new Request(endpoint + "?turma=" + turma + "&participante=" + turma)
    mocks.session.mockResolvedValueOnce(null)
    expect((await GET(request)).status).toBe(401)
    mocks.lookup.mockResolvedValueOnce({ data: { cpf: "01234567890" } })
    const response = await GET(request)
    expect(response.headers.get("cache-control")).toBe("no-store")
    expect(await response.json()).toEqual({ cpf: "01234567890" })
  })
})

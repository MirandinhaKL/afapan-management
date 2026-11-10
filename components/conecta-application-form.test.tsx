import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
const { upload } = vi.hoisted(() => ({ upload: vi.fn().mockResolvedValue({ error: null }) }))
vi.mock("@/lib/supabase", () => ({ supabase: { storage: { from: () => ({ uploadToSignedUrl: upload }) } } }))
import { ConectaApplicationForm } from "./conecta-application-form"

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers() })
const id = "8e11e491-1cbb-47ad-8b76-d605d7d270ff"
it.each([false, true])("envia formulário com arquivo=%s e confirma somente após persistência", async withFile => {
  vi.useFakeTimers({ toFake: ["Date"] })
  vi.setSystemTime(new Date("2026-11-07T01:00:00Z"))
  const fetchMock = vi.fn().mockImplementation(async (url: string) => ({
    ok: true, json: async () => url.includes("catalog") ? [{
      versionId: id, project: "Projeto", name: "Modalidade", description: "", mode: "free", tasks: [],
    }] : url.includes("uploads") ? { token: "a".repeat(64), files: withFile ? [{ id, path: "evidence/teste", uploadToken: "token" }] : [] }
      : { success: true },
  }))
  vi.stubGlobal("fetch", fetchMock)
  render(<ConectaApplicationForm />)
  await screen.findByLabelText("Nome completo")
  expect(screen.getByLabelText("Início da atividade")).toHaveValue("2026-11-06")
  expect(screen.getByLabelText("Fim da atividade")).toHaveValue("2026-11-06")
  expect(screen.getByLabelText("Data de nascimento")).toHaveValue("")
  for (const [label, value] of Object.entries({
    "Nome completo": "Pessoa Exemplo", CPF: "52998224725", WhatsApp: "54999990000",
    "E-mail": "aluno@example.test", "Data de nascimento": "1999-01-01", "Instituição de ensino": "Escola",
    Curso: "Curso", "Início da atividade": "2020-01-01", "Fim da atividade": "2020-01-02",
  })) fireEvent.change(screen.getByLabelText(label), { target: { value } })
  fireEvent.change(screen.getByLabelText("Modalidade"), { target: { value: id } })
  fireEvent.change(screen.getByLabelText("Horas realizadas"), { target: { value: "1" } })
  fireEvent.change(screen.getByLabelText("Descreva o que você realizou"), { target: { value: "Atividade realizada" } })
  expect(screen.getByLabelText("CPF")).toHaveValue("529.982.247-25")
  expect(screen.getByLabelText("WhatsApp")).toHaveValue("(54) 99999-0000")
  if (withFile) {
    const selector = screen.getByLabelText("Comprovantes (opcional)")
    const first = new File(["%PDF-1.7"], "primeiro.pdf", { type: "" })
    const second = new File(["%PDF-1.7"], "cartilha.pdf", { type: "" })
    fireEvent.change(selector, { target: { files: [first] } })
    fireEvent.change(selector, { target: { files: [second] } })
    expect(screen.getByText("2 arquivos selecionados")).toBeInTheDocument()
    expect(screen.queryByText("Nenhum arquivo adicionado.")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Remover primeiro.pdf" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Remover cartilha.pdf" })).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Remover primeiro.pdf" }))
    expect(screen.getByText("1 arquivo selecionado")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Remover primeiro.pdf" })).not.toBeInTheDocument()
    fireEvent.change(selector, { target: { files: [second] } })
    expect(screen.getAllByRole("button", { name: "Remover cartilha.pdf" })).toHaveLength(1)
  }
  fireEvent.submit(screen.getByRole("button", { name: "Enviar para validação" }).closest("form")!)
  await screen.findByText("Atividade recebida")
  await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/conecta/submit", expect.anything()))
  const body = JSON.parse(fetchMock.mock.calls.find(call => call[0] === "/api/conecta/submit")![1].body)
  expect(body.application.attachments).toEqual(withFile ? [id] : [])
  expect(body.application.cpf).toBe("52998224725")
  expect(body.application.startDate).toBe("2020-01-01")
  expect(body.application.endDate).toBe("2020-01-02")
  const reservationBody = JSON.parse(fetchMock.mock.calls.find(call => call[0] === "/api/conecta/uploads")![1].body)
  expect(reservationBody.files).toHaveLength(withFile ? 1 : 0)
})

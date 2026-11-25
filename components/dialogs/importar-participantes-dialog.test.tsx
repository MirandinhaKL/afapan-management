import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { expect, it, vi } from "vitest"
import { ImportarParticipantesDialog } from "./importar-participantes-dialog"

const request = vi.hoisted(() => vi.fn())
vi.mock("@/lib/compostagem-importacao-client", () => ({ requestCompostagemImport: request }))

it("exige turma, invalida a prévia ao ajustar o DDD e atualiza a lista após confirmar", async () => {
  const user = userEvent.setup()
  const onImported = vi.fn().mockResolvedValue(undefined)
  const row = { linha: 2, status: "novo", nome: "Ana", sobrenome: "Silva", erros: [], cpf: "CPF ausente", dddSugerido: "54" }
  const base = { linhas: [row], novosVinculos: 1, comprovante: "previa", gravado: false, mudou: false }
  let finishSaving!: (value: typeof base) => void
  const saving = new Promise<typeof base>(resolve => { finishSaving = resolve })
  request.mockReset()
  request.mockResolvedValueOnce(base).mockResolvedValueOnce(base)
    .mockReturnValueOnce(saving)
  render(<ImportarParticipantesDialog turmas={[{ id: "turma-10", nome: "10ª turma" }]} onImported={onImported} />)
  await user.click(screen.getByRole("button", { name: "Importar participantes" }))
  const input = screen.getByLabelText("Arquivo CSV")
  expect(input).toBeDisabled()
  await user.selectOptions(screen.getByLabelText("Turma"), "turma-10")
  fireEvent.change(screen.getByLabelText("Arquivo CSV"), {
    target: { files: [new File(["dados fictícios"], "inscricoes.csv")] },
  })
  await user.click(screen.getByRole("button", { name: "Gerar prévia" }))
  await user.click(await screen.findByRole("button", { name: "Usar DDD 54" }))
  expect(screen.getByRole("button", { name: "Confirmar linhas válidas" })).toBeDisabled()
  await user.click(screen.getByRole("button", { name: "Atualizar prévia" }))
  await user.click(screen.getByRole("button", { name: "Confirmar linhas válidas" }))
  expect(screen.getByText("Salvando inscrições…")).toBeInTheDocument()
  expect(screen.getByRole("button", { name: "Salvando…" })).toBeDisabled()
  expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled()
  expect(screen.queryByText(/Importação concluída com sucesso/)).not.toBeInTheDocument()
  await act(async () => { finishSaving({ ...base, gravado: true }) })
  await waitFor(() => expect(onImported).toHaveBeenCalledWith("turma-10"))
  expect(screen.getByText(/Importação concluída com sucesso/)).toBeInTheDocument()
  expect(screen.queryByText("Salvando inscrições…")).not.toBeInTheDocument()
  expect(JSON.parse(String(request.mock.calls[2][1].get("opcoes")))).toEqual({
    turma: "turma-10", ddds: { "2": "54" }, comprovante: "previa",
  })
})

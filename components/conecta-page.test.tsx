import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { expect, it, vi } from "vitest"
import { ConectaPage } from "./conecta-page"

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }))
vi.mock("@/lib/supabase", () => ({ supabase: { rpc } }))

it("separa os dados, comprovantes e conferência e mantém a aprovação na ficha", async () => {
  const id = "8e11e491-1cbb-47ad-8b76-d605d7d270ff"
  const taskId = "7a0bd0b8-f301-4ff9-a1e1-2393bf2af2fb"
  const attachmentId = "7211191f-b0ad-4d75-861e-52ec44c4a613"
  const summary = {
    id, name: "Estudante Exemplo", status: "pending", modality: "Visitas educativas",
    starts_on: "2026-11-09", ends_on: "2026-11-09",
  }
  rpc.mockImplementation(async (operation: string) => {
    if (operation === "conecta_list_applications") return {
      data: { items: [{ ...summary, sent: false }], pending: 1, total: 1 }, error: null,
    }
    if (operation === "conecta_get_application") return {
      data: {
        ...summary, cpf: "52998224725", email: "estudante@example.test", phone: "54999990000",
        institution: "Instituição Exemplo", course: "Gestão Ambiental", instagram: null, activity_reference: null,
        mode: "checklist", revision: 1, approved_minutes: null, report: "Acompanhei a visita.",
        declared_tasks: [taskId], declared_minutes: null,
        tasks: [{ id: taskId, label: "Acompanhar turma", minutes: 300 }],
        attachments: [{ id: attachmentId, mime: "application/pdf", bytes: 120 }],
        decisions: [], history: [], modality_minutes: 0,
      }, error: null,
    }
    return { data: id, error: null }
  })

  render(<ConectaPage />)
  fireEvent.click(await screen.findByRole("button", { name: "Ver solicitação" }))
  const student = await screen.findByRole("heading", { name: summary.name })
  const documents = screen.getByRole("heading", { name: "Comprovantes e histórico" })
  const review = screen.getByRole("group", { name: "Conferência da equipe" })
  expect(student.closest('[data-slot="card"]')).not.toBe(documents.closest('[data-slot="card"]'))
  expect(review.closest('[data-slot="card"]')).not.toBe(documents.closest('[data-slot="card"]'))
  expect(screen.getByRole("button", { name: "Baixar comprovante" })).toBeEnabled()
  expect(within(review).getByRole("checkbox", { name: /Acompanhar turma/ })).toBeChecked()
  fireEvent.click(within(review).getByRole("button", { name: "Aprovar" }))
  await waitFor(() => expect(rpc).toHaveBeenCalledWith("conecta_review_application", {
    p_id: id, p_revision: 1, p_decision: "approved", p_tasks: [taskId], p_minutes: null, p_reason: null,
  }))
})

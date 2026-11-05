import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }))
vi.mock("@/lib/supabase", () => ({ supabase: { rpc } }))
import { ConectaCatalogPage } from "./conecta-catalog-page"

describe("catálogo Conecta AFAPAN", () => {
  it("cadastra modalidade de horas livres sem enviar tarefas ou carga fixa", async () => {
    rpc.mockResolvedValue({ data: [], error: null })
    const user = userEvent.setup()
    render(<ConectaCatalogPage />)
    await screen.findByText("Nenhuma modalidade cadastrada.")
    await user.click(screen.getByRole("button", { name: "Nova modalidade" }))
    await user.type(screen.getByLabelText("Nome do projeto"), "Projeto de exemplo")
    await user.type(screen.getByLabelText("Nome da modalidade"), "Visita de exemplo")
    await user.selectOptions(screen.getByLabelText("Forma de registro"), "free")
    expect(screen.queryByLabelText("Minutos")).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Salvar modalidade" }))
    await waitFor(() => expect(rpc).toHaveBeenCalledWith("conecta_save_modality", expect.objectContaining({
      p_project_name: "Projeto de exemplo", p_name: "Visita de exemplo", p_mode: "free", p_tasks: [],
    })))
    expect(await screen.findByText("Modalidade salva.")).toBeInTheDocument()
  })
})

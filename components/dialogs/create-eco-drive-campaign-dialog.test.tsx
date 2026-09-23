import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { CreateEcoDriveCampaignDialog } from "@/components/dialogs/create-eco-drive-campaign-dialog"
import type { EcoDriveCampaign } from "@/lib/eco-drive"

async function fillRequired(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Nome da campanha *"), "Eco Drive Agosto")
  await user.type(screen.getByLabelText("Data do evento *"), "2026-08-15")
}

describe("formulário de campanha Eco Drive", () => {
  it("valida os campos obrigatórios antes de salvar", async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn().mockResolvedValue(true)
    render(<CreateEcoDriveCampaignDialog open onOpenChange={vi.fn()} onCreate={onCreate} />)
    await user.click(screen.getByRole("button", { name: "Salvar campanha" }))
    expect(onCreate).not.toHaveBeenCalled()
    expect(screen.getByText(/Revise os campos obrigatórios/)).toBeInTheDocument()
  })

  it("envia os sete materiais e permite local vazio", async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn().mockResolvedValue(true)
    render(<CreateEcoDriveCampaignDialog open onOpenChange={vi.fn()} onCreate={onCreate} />)
    await fillRequired(user)
    await user.type(screen.getByLabelText("Tampinhas de garrafa"), "12.5")
    await user.click(screen.getByRole("button", { name: "Salvar campanha" }))
    expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({
      name: "Eco Drive Agosto", eventDate: "2026-08-15", location: "", volunteerCount: 0,
      materials: expect.arrayContaining([
        { type: "tampinhas", quantity: 12.5, unit: "kg" },
        { type: "esponjas", quantity: 0, unit: "unidade" },
      ]),
    }))
    expect(onCreate.mock.calls[0][0].materials).toHaveLength(7)
  })

  it("não aceita quantidade fracionada para materiais por unidade", async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn().mockResolvedValue(true)
    render(<CreateEcoDriveCampaignDialog open onOpenChange={vi.fn()} onCreate={onCreate} />)
    await fillRequired(user)
    await user.type(screen.getByLabelText("Esponjas de cozinha"), "1.5")
    await user.click(screen.getByRole("button", { name: "Salvar campanha" }))
    expect(onCreate).not.toHaveBeenCalled()
  })

  it("não aceita peso com mais de uma casa decimal", async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn().mockResolvedValue(true)
    render(<CreateEcoDriveCampaignDialog open onOpenChange={vi.fn()} onCreate={onCreate} />)
    await fillRequired(user)
    await user.type(screen.getByLabelText("Isopor"), "2.25")
    await user.click(screen.getByRole("button", { name: "Salvar campanha" }))
    expect(onCreate).not.toHaveBeenCalled()
  })

  it("não aceita números negativos", async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn().mockResolvedValue(true)
    render(<CreateEcoDriveCampaignDialog open onOpenChange={vi.fn()} onCreate={onCreate} />)
    await fillRequired(user)
    await user.type(screen.getByLabelText("Isopor"), "-2")
    await user.click(screen.getByRole("button", { name: "Salvar campanha" }))
    expect(onCreate).not.toHaveBeenCalled()
    expect(screen.getByText("Não são permitidos números negativos.")).toBeInTheDocument()
  })

  it("não aceita número negativo de voluntários", async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn().mockResolvedValue(true)
    render(<CreateEcoDriveCampaignDialog open onOpenChange={vi.fn()} onCreate={onCreate} />)
    await fillRequired(user)
    await user.clear(screen.getByLabelText("Número de voluntários"))
    await user.type(screen.getByLabelText("Número de voluntários"), "-1")
    await user.click(screen.getByRole("button", { name: "Salvar campanha" }))
    expect(onCreate).not.toHaveBeenCalled()
  })

  it("preenche a edição com os valores persistidos", () => {
    const campaign: EcoDriveCampaign = {
      id: "1", name: "Eco Drive Julho", eventDate: "2026-07-18", location: "Praça",
      volunteerCount: 8, status: "concluida", materials: [{ type: "tampinhas", quantity: 4.5, unit: "kg" }],
    }
    render(<CreateEcoDriveCampaignDialog open onOpenChange={vi.fn()} onCreate={vi.fn()} campaign={campaign} />)
    expect(screen.getByLabelText("Nome da campanha *")).toHaveValue("Eco Drive Julho")
    expect(screen.getByLabelText("Tampinhas de garrafa")).toHaveValue(4.5)
    expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeInTheDocument()
  })
})

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { CreateEcoDriveCampaignDialog } from "@/components/dialogs/create-eco-drive-campaign-dialog"

describe("CreateEcoDriveCampaignDialog", () => {
  it("valida os campos obrigatórios antes de salvar", async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn().mockResolvedValue(true)

    render(
      <CreateEcoDriveCampaignDialog
        open
        onOpenChange={vi.fn()}
        onCreate={onCreate}
      />
    )

    await user.click(screen.getByRole("button", { name: "Salvar campanha" }))

    expect(onCreate).not.toHaveBeenCalled()
    expect(screen.getByText(/Revise os campos obrigatórios/)).toBeInTheDocument()
  })

  it("envia os sete materiais ao criar uma campanha", async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn().mockResolvedValue(true)

    render(
      <CreateEcoDriveCampaignDialog
        open
        onOpenChange={vi.fn()}
        onCreate={onCreate}
      />
    )

    await user.type(screen.getByLabelText("Nome da campanha *"), "Eco Drive Agosto")
    await user.type(screen.getByLabelText("Data do evento *"), "2026-08-15")
    await user.type(screen.getByLabelText("Local *"), "Praça da Matriz")
    await user.clear(screen.getByLabelText("Tampinhas de garrafa"))
    await user.type(screen.getByLabelText("Tampinhas de garrafa"), "12.5")
    await user.click(screen.getByRole("button", { name: "Salvar campanha" }))

    expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({
      name: "Eco Drive Agosto",
      eventDate: "2026-08-15",
      location: "Praça da Matriz",
      volunteerCount: 0,
      materials: expect.arrayContaining([
        { type: "tampinhas", quantity: 12.5, unit: "kg" },
        { type: "esponjas", quantity: 0, unit: "unidade" },
        { type: "outros", quantity: 0, unit: "kg" },
      ]),
    }))
    expect(onCreate.mock.calls[0][0].materials).toHaveLength(7)
  })

  it("não aceita quantidade fracionada para materiais contados por unidade", async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn().mockResolvedValue(true)

    render(
      <CreateEcoDriveCampaignDialog
        open
        onOpenChange={vi.fn()}
        onCreate={onCreate}
      />
    )

    await user.type(screen.getByLabelText("Nome da campanha *"), "Eco Drive Setembro")
    await user.type(screen.getByLabelText("Data do evento *"), "2026-09-19")
    await user.type(screen.getByLabelText("Local *"), "Praça da Matriz")
    await user.type(screen.getByLabelText("Esponjas de cozinha"), "1.5")
    await user.click(screen.getByRole("button", { name: "Salvar campanha" }))

    expect(onCreate).not.toHaveBeenCalled()
    expect(screen.getByText(/somente quantidades válidas/)).toBeInTheDocument()
  })
})

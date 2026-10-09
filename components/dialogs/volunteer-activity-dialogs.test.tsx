import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { VolunteerFormDialog } from "@/components/dialogs/volunteer-form-dialog"
import { VolunteerDetailsDialog } from "@/components/dialogs/volunteer-details-dialog"
import { VOLUNTEER_ACTIVITIES, VOLUNTEER_ACTIVITY_GROUPS, type Volunteer } from "@/lib/volunteers"

const volunteer: Volunteer = {
  id: "1", firstName: "Ana", lastName: "Silva", birthDate: "1990-03-15", phone: "(54) 99999-1234",
  normalizedPhone: "5554999991234", neighborhood: "Centro", city: "Farroupilha", frequency: "mensal",
  activities: ["plantio_arvores_nativas", "compostagem_escolas"], privacyAccepted: true, participationAccepted: true,
  status: "ativo", origin: "assistido", createdAt: "2026-10-01", updatedAt: "2026-10-01",
}

describe("catálogo de atividades na gestão interna", () => {
  it("CA-051/CA-055: carrega a edição com os novos grupos e permite seleção individual", async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(true)
    render(<VolunteerFormDialog open onOpenChange={vi.fn()} volunteer={volunteer} onSave={onSave} />)
    for (const group of VOLUNTEER_ACTIVITY_GROUPS) {
      expect(screen.getByRole("group", { name: group.title })).toBeInTheDocument()
    }
    expect(screen.getByLabelText("Plantio de árvores nativas")).toBeChecked()
    expect(screen.getByLabelText("Compostagem nas escolas")).toBeChecked()
    await user.click(screen.getByLabelText("Plantio de árvores nativas"))
    await user.click(screen.getByLabelText("Comunicação e divulgação"))
    await user.click(screen.getByRole("button", { name: "Salvar" }))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ activities: ["compostagem_escolas", "comunicacao_divulgacao"] }))
    expect(onSave.mock.calls[0][0]).not.toHaveProperty("otherActivityDescription")
  })

  it("CA-053: seleciona todas, reflete a remoção individual e desmarca todas", async () => {
    const user = userEvent.setup()
    render(<VolunteerFormDialog open onOpenChange={vi.fn()} onSave={vi.fn()} />)
    const markAll = screen.getByLabelText("Marcar todas as atividades")
    await user.click(markAll)
    for (const item of VOLUNTEER_ACTIVITIES) expect(screen.getByLabelText(item.label)).toBeChecked()
    await user.click(screen.getByLabelText("Compostagem doméstica"))
    expect(markAll).not.toBeChecked()
    await user.click(markAll)
    await user.click(markAll)
    for (const item of VOLUNTEER_ACTIVITIES) expect(screen.getByLabelText(item.label)).not.toBeChecked()
  })

  it("CA-052/CA-055: apresenta os novos rótulos no detalhamento", () => {
    render(<VolunteerDetailsDialog open onOpenChange={vi.fn()} volunteer={volunteer} />)
    const activities = screen.getByText("Atividades:").parentElement!
    expect(activities).toHaveTextContent("Plantio de árvores nativas, Compostagem nas escolas")
    expect(screen.queryByText("Outras:")).not.toBeInTheDocument()
    expect(within(screen.getByRole("dialog")).queryByText("plantio_arvores_nativas")).not.toBeInTheDocument()
  })
})

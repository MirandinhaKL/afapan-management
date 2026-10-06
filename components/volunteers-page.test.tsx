import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { fetchVolunteers, fetchVolunteerCampaign, saveVolunteerCampaign } = vi.hoisted(() => ({ fetchVolunteers: vi.fn(), fetchVolunteerCampaign: vi.fn(), saveVolunteerCampaign: vi.fn() }))
vi.mock("@/lib/volunteer-queries", () => ({
  fetchVolunteers,
  fetchVolunteerCampaign,
  getVolunteerMutationError: () => "Erro",
  saveAssistedVolunteer: vi.fn(),
  saveVolunteerCampaign,
  setVolunteerArchived: vi.fn(),
  setVolunteerStatus: vi.fn(),
}))

import { VolunteersPage } from "@/components/volunteers-page"

describe("listagem de voluntários", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchVolunteers.mockResolvedValue({ volunteers: [], total: 0 })
    fetchVolunteerCampaign.mockResolvedValue(null)
    saveVolunteerCampaign.mockResolvedValue("campaign-1")
  })

  it("inicia com filtros recolhidos e permite expandir", async () => {
    const user = userEvent.setup()
    render(<VolunteersPage />)
    await waitFor(() => expect(fetchVolunteers).toHaveBeenCalled())
    expect(screen.queryByPlaceholderText("Cidade")).not.toBeInTheDocument()
    const button = screen.getByRole("button", { name: /^Filtros/ })
    expect(button).toHaveAttribute("aria-expanded", "false")
    await user.click(button)
    expect(screen.getByPlaceholderText("Cidade")).toBeInTheDocument()
    expect(button).toHaveAttribute("aria-expanded", "true")
  })

  it("preserva filtro ativo quando recolhe e limpa explicitamente", async () => {
    const user = userEvent.setup()
    render(<VolunteersPage />)
    await user.click(screen.getByRole("button", { name: /^Filtros/ }))
    await user.type(screen.getByPlaceholderText("Cidade"), "Farroupilha")
    expect(screen.getByLabelText("1 filtros ativos")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /^Filtros/ }))
    expect(screen.queryByPlaceholderText("Cidade")).not.toBeInTheDocument()
    expect(screen.getByLabelText("1 filtros ativos")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /^Filtros/ }))
    await user.click(screen.getByRole("button", { name: "Limpar filtros" }))
    expect(screen.queryByLabelText("1 filtros ativos")).not.toBeInTheDocument()
  })

  it("copia o endereço fixo do formulário público", async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } })
    fetchVolunteerCampaign.mockResolvedValue({
      id: "campaign-1",
      name: "Confirmação de voluntários",
      deadline: "2026-10-09T23:59:59.000Z",
      active: true,
    })

    render(<VolunteersPage />)
    const button = await screen.findByRole("button", { name: "Copiar link" })
    await user.click(button)

    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/voluntariado/cadastro`)
    expect(await screen.findByRole("button", { name: "Link copiado!" })).toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveTextContent("O link foi copiado com sucesso.")
  })

  it("orienta a criar uma campanha ativa antes de copiar", async () => {
    const user = userEvent.setup()
    render(<VolunteersPage />)

    await user.click(await screen.findByRole("button", { name: "Copiar link" }))

    expect(screen.getByRole("status")).toHaveTextContent("Crie ou ative uma campanha antes de copiar o link.")
  })

  it("permite copiar imediatamente depois de criar uma campanha ativa", async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } })
    render(<VolunteersPage />)

    await user.click(await screen.findByRole("button", { name: "Campanha" }))
    await user.click(screen.getByRole("button", { name: "Salvar campanha" }))
    await waitFor(() => expect(saveVolunteerCampaign).toHaveBeenCalled())
    await user.click(await screen.findByRole("button", { name: "Copiar link" }))

    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/voluntariado/cadastro`)
    expect(await screen.findByRole("button", { name: "Link copiado!" })).toBeInTheDocument()
  })
})

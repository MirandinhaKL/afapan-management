import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { fetchVolunteers, saveAssistedVolunteer, setVolunteerArchived, setVolunteerStatus } = vi.hoisted(() => ({
  fetchVolunteers: vi.fn(), saveAssistedVolunteer: vi.fn(), setVolunteerArchived: vi.fn(), setVolunteerStatus: vi.fn(),
}))
vi.mock("@/lib/volunteer-queries", () => ({
  fetchVolunteers, saveAssistedVolunteer, setVolunteerArchived, setVolunteerStatus,
  getVolunteerMutationError: () => "Erro",
}))
import { VolunteersPage } from "@/components/volunteers-page"
import type { Volunteer } from "@/lib/volunteers"

const volunteer: Volunteer = {
  id: "volunteer-1", firstName: "Ana", lastName: "Silva", birthDate: "1990-03-15", phone: "(54) 99999-1234",
  normalizedPhone: "5554999991234", neighborhood: "Centro", city: "Farroupilha", frequency: "mensal",
  activities: ["plantio_arvores_nativas"], privacyAccepted: true, participationAccepted: true,
  status: "aguardando_validacao", origin: "publico", createdAt: "2026-10-01", updatedAt: "2026-10-01T10:00:00Z",
}

describe("listagem de voluntários com cadastro permanente", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchVolunteers.mockResolvedValue({ volunteers: [], total: 0 })
    saveAssistedVolunteer.mockResolvedValue("volunteer-1")
    setVolunteerArchived.mockResolvedValue(undefined)
    setVolunteerStatus.mockResolvedValue(undefined)
  })
  afterEach(() => vi.restoreAllMocks())

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


  it("CA-003/CA-004: exibe, abre e copia o link sem configurar campanha", async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } })
    render(<VolunteersPage />)
    const link = screen.getByRole("link", { name: "Abrir formulário de cadastro em uma nova aba" })
    expect(link).toHaveTextContent(`${window.location.origin}/voluntariado/cadastro`)
    expect(link).toHaveAttribute("href", `${window.location.origin}/voluntariado/cadastro`)
    expect(link).toHaveAttribute("target", "_blank")
    expect(screen.queryByRole("button", { name: "Campanha" })).not.toBeInTheDocument()
    expect(screen.queryByText(/Prazo:/)).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Copiar link" }))
    expect(writeText).toHaveBeenCalledWith(link.getAttribute("href"))
    expect(await screen.findByRole("button", { name: "Link copiado!" })).toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveTextContent("O link foi copiado com sucesso.")
  })

  it("CA-003: listagem indisponível não impede acesso e cópia do link", async () => {
    const user = userEvent.setup()
    fetchVolunteers.mockRejectedValue(new Error("network"))
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } })
    render(<VolunteersPage />)
    await waitFor(() => expect(fetchVolunteers).toHaveBeenCalled())
    await user.click(screen.getByRole("button", { name: "Copiar link" }))
    expect(await screen.findByRole("button", { name: "Link copiado!" })).toBeInTheDocument()
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/voluntariado/cadastro`)
  })

  it("CA-003: falha de cópia oferece o endereço visível para cópia manual", async () => {
    const user = userEvent.setup()
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined })
    Object.defineProperty(document, "execCommand", { configurable: true, value: undefined })
    render(<VolunteersPage />)
    await user.click(screen.getByRole("button", { name: "Copiar link" }))
    expect(screen.getByRole("status")).toHaveTextContent("Copie manualmente o endereço exibido acima.")
    expect(screen.getByRole("link", { name: /Abrir formulário/ })).toHaveTextContent(`${window.location.origin}/voluntariado/cadastro`)
    expect(screen.queryByRole("button", { name: "Link copiado!" })).not.toBeInTheDocument()
  })

  it("CA-011: permite acionar cópia por teclado", async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } })
    render(<VolunteersPage />)
    screen.getByRole("button", { name: "Copiar link" }).focus()
    await user.keyboard("{Enter}")
    expect(await screen.findByRole("button", { name: "Link copiado!" })).toBeInTheDocument()
    expect(writeText).toHaveBeenCalled()
  })

  it("CA-009: mantém paginação e cadastro assistido disponíveis", async () => {
    const user = userEvent.setup()
    fetchVolunteers.mockResolvedValue({ volunteers: [volunteer], total: 25 })
    render(<VolunteersPage />)
    await screen.findByRole("button", { name: "Ver Ana" })
    await user.click(screen.getByRole("button", { name: "Próxima" }))
    await waitFor(() => expect(fetchVolunteers).toHaveBeenLastCalledWith(expect.anything(), 2, 10))
    await user.click(screen.getByRole("button", { name: "Cadastrar" }))
    expect(await screen.findByRole("dialog", { name: "Cadastrar voluntário" })).toBeInTheDocument()
  })

  it("CA-009: detalha e edita cadastro preservando controle de concorrência", async () => {
    const user = userEvent.setup()
    fetchVolunteers.mockResolvedValue({ volunteers: [volunteer], total: 1 })
    render(<VolunteersPage />)
    await user.click(await screen.findByRole("button", { name: "Ver Ana" }))
    expect(await screen.findByRole("dialog", { name: "Ana Silva" })).toHaveTextContent("Plantio de árvores nativas")
    await user.keyboard("{Escape}")
    await user.click(screen.getByRole("button", { name: "Editar Ana" }))
    await user.click(await screen.findByRole("button", { name: "Salvar" }))
    await waitFor(() => expect(saveAssistedVolunteer).toHaveBeenCalledWith(expect.objectContaining({
      id: volunteer.id, expectedUpdatedAt: volunteer.updatedAt, status: "aguardando_validacao", activities: ["plantio_arvores_nativas"],
    })))
  })

  it.each([false, true])("CA-009: mantém arquivamento/restauração com confirmação (arquivado: %s)", async (archived) => {
    const user = userEvent.setup()
    const current = { ...volunteer, archivedAt: archived ? "2026-10-05" : undefined }
    fetchVolunteers.mockResolvedValue({ volunteers: [current], total: 1 })
    render(<VolunteersPage />)
    await user.click(await screen.findByRole("button", { name: `${archived ? "Restaurar" : "Arquivar"} Ana` }))
    expect(setVolunteerArchived).not.toHaveBeenCalled()
    await user.click(screen.getByRole("button", { name: archived ? "Restaurar" : "Arquivar" }))
    await waitFor(() => expect(setVolunteerArchived).toHaveBeenCalledWith(current, !archived))
  })
})

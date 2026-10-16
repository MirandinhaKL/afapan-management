import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
vi.mock("@/lib/volunteer-export-query", () => ({ fetchVolunteerExport: vi.fn() }))
const { fetchStatistics } = vi.hoisted(() => ({ fetchStatistics: vi.fn() }))
vi.mock("@/lib/volunteer-statistics", () => ({ fetchVolunteerStatistics: fetchStatistics }))
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

const browserMethods = ["hasPointerCapture", "setPointerCapture", "releasePointerCapture", "scrollIntoView"] as const
const originalMethods = new Map(browserMethods.map(name => [name, Object.getOwnPropertyDescriptor(HTMLElement.prototype, name)]))

describe("listagem de voluntários com cadastro permanente", () => {
  it("CA-006: explica o link público ao passar o mouse ou focar pelo teclado", async () => {
    const user = userEvent.setup()
    render(<VolunteersPage />)
    const button = screen.getByRole("button", { name: "Copiar link" })
    await user.hover(button)
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Link público para cadastro de voluntários")
    await user.unhover(button)
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("tooltip")).not.toBeInTheDocument())
    button.focus()
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Link público para cadastro de voluntários")
  })
  beforeEach(() => {
    vi.clearAllMocks()
    fetchStatistics.mockResolvedValue({ active: 12, awaitingValidation: 4, startedThisYear: 8, year: 2026 })
    vi.stubGlobal("ResizeObserver", class {
      observe() {}
      unobserve() {}
      disconnect() {}
    })
    for (const name of browserMethods) Object.defineProperty(HTMLElement.prototype, name, { configurable: true, value: vi.fn(() => name === "hasPointerCapture" ? false : undefined) })
    fetchVolunteers.mockResolvedValue({ volunteers: [], total: 0 })
    saveAssistedVolunteer.mockResolvedValue("volunteer-1")
    setVolunteerArchived.mockResolvedValue(undefined)
    setVolunteerStatus.mockResolvedValue(undefined)
  })
  afterEach(() => {
    vi.restoreAllMocks(); vi.unstubAllGlobals()
    for (const name of browserMethods) {
      const descriptor = originalMethods.get(name)
      if (descriptor) Object.defineProperty(HTMLElement.prototype, name, descriptor)
      else Reflect.deleteProperty(HTMLElement.prototype, name)
    }
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
    expect(fetchStatistics).toHaveBeenCalledTimes(1)
    expect(screen.getByLabelText("1 filtros ativos")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /^Filtros/ }))
    expect(screen.queryByPlaceholderText("Cidade")).not.toBeInTheDocument()
    expect(screen.getByLabelText("1 filtros ativos")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /^Filtros/ }))
    await user.click(screen.getByRole("button", { name: "Limpar filtros" }))
    expect(screen.queryByLabelText("1 filtros ativos")).not.toBeInTheDocument()
  })


  it("CA-005: copia o link sem exibir o endereço na tela", async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } })
    render(<VolunteersPage />)
    expect(screen.queryByText("Link do formulário")).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Abrir formulário de cadastro em uma nova aba" })).not.toBeInTheDocument()
    expect(screen.queryByText(`${window.location.origin}/voluntariado/cadastro`)).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Campanha" })).not.toBeInTheDocument()
    expect(screen.queryByText(/Prazo:/)).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Copiar link" }))
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/voluntariado/cadastro`)
    expect(await screen.findByRole("button", { name: "Link copiado!" })).toBeInTheDocument()
    expect(screen.getAllByRole("status").find(element=>element.textContent?.includes("O link foi copiado"))).toHaveTextContent("O link foi copiado com sucesso.")
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

  it("CA-005: falha de cópia orienta nova tentativa sem exibir o endereço", async () => {
    const user = userEvent.setup()
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined })
    Object.defineProperty(document, "execCommand", { configurable: true, value: undefined })
    render(<VolunteersPage />)
    await user.click(screen.getByRole("button", { name: "Copiar link" }))
    expect(screen.getByRole("status", { name: "Estado da cópia do link" })).toHaveTextContent("Tente novamente ou verifique as permissões de cópia do navegador.")
    expect(screen.queryByText(`${window.location.origin}/voluntariado/cadastro`)).not.toBeInTheDocument()
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
    expect(fetchStatistics).toHaveBeenCalledTimes(1)
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
    await waitFor(() => expect(fetchStatistics).toHaveBeenCalledTimes(2))
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
    await waitFor(() => expect(fetchStatistics).toHaveBeenCalledTimes(2))
  })
  it.each([false,true])("CA-004: estatísticas recarregam somente após mudança de situação bem-sucedida (falha: %s)",async(failed)=>{
    const user=userEvent.setup();fetchVolunteers.mockResolvedValue({volunteers:[volunteer],total:1})
    if(failed)setVolunteerStatus.mockRejectedValueOnce(new Error("Falha ao salvar"))
    render(<VolunteersPage/>);await screen.findByRole("button",{name:"Ver Ana"})
    await user.click(screen.getByRole("combobox"));await user.click(screen.getByRole("option",{name:"Ativo"}))
    await waitFor(()=>expect(setVolunteerStatus).toHaveBeenCalledWith(volunteer,"ativo"))
    await waitFor(()=>expect(fetchStatistics).toHaveBeenCalledTimes(failed?1:2))
  })
  it("CA-005: falha dos indicadores mantém listagem, exportação e filtros disponíveis",async()=>{
    fetchStatistics.mockRejectedValue(new Error("Indicadores indisponíveis"));fetchVolunteers.mockResolvedValue({volunteers:[volunteer],total:1})
    render(<VolunteersPage/>);expect(await screen.findByRole("alert")).toHaveTextContent("Indicadores indisponíveis")
    expect(screen.getByRole("button",{name:"Ver Ana"})).toBeInTheDocument();expect(screen.getByRole("button",{name:"Exportar"})).toBeEnabled();expect(screen.getByRole("button",{name:/^Filtros/})).toBeEnabled()
  })
  it("CA-004: cadastro assistido novo recarrega os indicadores",async()=>{
    const user=userEvent.setup();render(<VolunteersPage/>);await screen.findByText("12")
    await user.click(screen.getByRole("button",{name:"Cadastrar"}));const dialog=await screen.findByRole("dialog",{name:"Cadastrar voluntário"})
    const inputs=within(dialog).getAllByRole("textbox")
    await user.type(inputs[0],"Bia");await user.type(inputs[1],"Santos");await user.type(inputs[2],"15031990");await user.type(inputs[3],"54999991234");await user.type(inputs[6],"Centro")
    await user.click(within(dialog).getByLabelText("Plantio de árvores nativas"));await user.click(within(dialog).getByRole("button",{name:"Salvar"}))
    await waitFor(()=>expect(saveAssistedVolunteer).toHaveBeenCalled());await waitFor(()=>expect(fetchStatistics).toHaveBeenCalledTimes(2))
  })
})

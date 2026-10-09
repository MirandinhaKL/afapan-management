import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import VolunteerRegistrationPage from "@/app/voluntariado/cadastro/page"

const settings = { privacyText: "Privacidade", privacyVersion: "permanente-1", participationText: "Participação", participationVersion: "permanente-1" }

describe("página de cadastro permanente", () => {
  afterEach(() => vi.restoreAllMocks())

  it("CA-001/CA-002: abre formulário consultando somente configuração, sem campanha", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(settings)))
    render(<VolunteerRegistrationPage />)
    expect(await screen.findByRole("button", { name: "Enviar cadastro" })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith("/api/volunteers/form", { cache: "no-store" })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(screen.queryByText(/Responda até/)).not.toBeInTheDocument()
  })

  it("CA-010: falha inicial permite tentar novamente sem mensagem de período encerrado", async () => {
    const user = userEvent.setup()
    const fetchMock = vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(new Response(JSON.stringify(settings)))
    render(<VolunteerRegistrationPage />)
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar o formulário")
    expect(screen.queryByText(/período|encerrado/i)).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }))
    expect(await screen.findByRole("button", { name: "Enviar cadastro" })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})

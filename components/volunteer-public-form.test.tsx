import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { VolunteerPublicForm } from "@/components/volunteer-public-form"

const campaign = { name: "Confirmação 2026", deadline: "2026-10-06T23:59:00Z", privacyText: "Estou ciente do uso dos dados.", participationText: "Quero continuar como voluntário." }

describe("formulário público de voluntários", () => {
  it("apresenta a foto, os textos aprovados e datas no padrão brasileiro", () => {
    render(<VolunteerPublicForm campaign={campaign} />)
    expect(screen.getByAltText("Voluntários da AFAPAN reunidos")).toBeInTheDocument()
    expect(screen.getByText(campaign.privacyText)).toBeInTheDocument()
    expect(screen.getByText(campaign.participationText)).toBeInTheDocument()
    expect(screen.getByLabelText(/Data de nascimento/)).toHaveAttribute("placeholder", "dd/mm/aaaa")
    expect(screen.getByLabelText(/Início das atividades/)).toHaveAttribute("placeholder", "MM/AAAA")
  })

  it("mostra somente frequência na seção de disponibilidade", () => {
    render(<VolunteerPublicForm campaign={campaign} />)
    expect(screen.getByLabelText(/Com que frequência/)).toBeInTheDocument()
    expect(screen.queryByText("Dias disponíveis *")).not.toBeInTheDocument()
    expect(screen.queryByText("Turnos *")).not.toBeInTheDocument()
  })

  it("bloqueia o envio vazio com mensagem compreensível", async () => {
    const user = userEvent.setup()
    render(<VolunteerPublicForm campaign={campaign} />)
    await user.click(screen.getByRole("button", { name: "Enviar cadastro" }))
    expect(screen.getByText("Informe o nome.")).toBeInTheDocument()
  })

  it("exibe os dados e a autorização do responsável para menor", () => {
    render(<VolunteerPublicForm campaign={campaign} />)
    fireEvent.change(screen.getByLabelText("Data de nascimento *"), { target: { value: "10/01/2012" } })
    expect(screen.getByText("Responsável pelo menor")).toBeInTheDocument()
    expect(screen.getByLabelText("Nome do responsável *")).toBeInTheDocument()
  })

  it("não chama a API quando há erro local", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
    const user = userEvent.setup()
    render(<VolunteerPublicForm campaign={campaign} />)
    await user.click(screen.getByRole("button", { name: "Enviar cadastro" }))
    expect(fetchMock).not.toHaveBeenCalled()
    fetchMock.mockRestore()
  })
})

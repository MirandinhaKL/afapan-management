import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { VolunteerPublicForm } from "@/components/volunteer-public-form"
import { VOLUNTEER_ACTIVITIES } from "@/lib/volunteers"

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

  it("remove o espaço superior do card e aumenta a distância entre rótulos e campos", () => {
    render(<VolunteerPublicForm campaign={campaign} />)
    expect(screen.getByText("Voluntariado AFAPAN").closest('[data-slot="card"]')).toHaveClass("py-0")
    expect(screen.getByRole("button", { name: "Enviar cadastro" }).closest("form")).toHaveClass("[&_[data-slot=label]]:mb-2")
  })

  it("centraliza o conteúdo do cabeçalho verde", () => {
    render(<VolunteerPublicForm campaign={campaign} />)
    const header = screen.getByText("Voluntariado AFAPAN").closest('[data-slot="card-header"]')
    expect(header).toHaveClass("text-center")
    expect(screen.getByText("Voluntariado AFAPAN").parentElement?.parentElement).toHaveClass("justify-center")
  })

  it("diferencia campos obrigatórios sem escrever opcional nos demais", () => {
    render(<VolunteerPublicForm campaign={campaign} />)
    expect(screen.getByText("Nome *")).toHaveClass("font-bold")
    expect(screen.getByText("Telefone com WhatsApp *")).toHaveClass("font-bold")
    expect(screen.getByText("E-mail")).not.toHaveTextContent(/opcional/i)
    expect(screen.queryByText(/\(opcional\)/i)).not.toBeInTheDocument()
  })

  it("aplica máscara de celular e impede dígitos excedentes", () => {
    render(<VolunteerPublicForm campaign={campaign} />)
    const phone = screen.getByLabelText("Telefone com WhatsApp *")
    fireEvent.change(phone, { target: { value: "54999991234999" } })
    expect(phone).toHaveValue("(54) 99999-1234")
    expect(phone).toHaveAttribute("maxlength", "15")
  })

  it("valida o e-mail preenchido ao sair do campo e aceita o campo vazio", () => {
    render(<VolunteerPublicForm campaign={campaign} />)
    const email = screen.getByLabelText("E-mail")
    fireEvent.change(email, { target: { value: "karine@afapan" } })
    fireEvent.blur(email)
    expect(screen.getByRole("alert")).toHaveTextContent("Informe um e-mail válido.")
    fireEvent.change(email, { target: { value: "karine@afapan.com.br" } })
    expect(screen.queryByText("Informe um e-mail válido.")).not.toBeInTheDocument()
  })

  it("usa o título Endereço", () => {
    render(<VolunteerPublicForm campaign={campaign} />)
    expect(screen.getByRole("heading", { name: "Endereço" })).toBeInTheDocument()
    expect(screen.queryByText("Onde você mora?")).not.toBeInTheDocument()
  })

  it("permite marcar e desmarcar todas as atividades", async () => {
    const user = userEvent.setup()
    render(<VolunteerPublicForm campaign={campaign} />)
    const markAll = screen.getByLabelText("Marcar todas as atividades")

    await user.click(markAll)
    for (const activity of VOLUNTEER_ACTIVITIES) expect(screen.getByLabelText(activity.label)).toBeChecked()

    await user.click(markAll)
    for (const activity of VOLUNTEER_ACTIVITIES) expect(screen.getByLabelText(activity.label)).not.toBeChecked()
  })

  it("não apresenta a descrição de outras atividades como obrigatória", async () => {
    const user = userEvent.setup()
    render(<VolunteerPublicForm campaign={campaign} />)
    await user.click(screen.getByLabelText("Outras atividades"))
    expect(screen.getByLabelText("Quais outras atividades?")).toBeInTheDocument()
    expect(screen.queryByLabelText("Quais outras atividades? *")).not.toBeInTheDocument()
  })

  it("valida a data de nascimento assim que o preenchimento termina", () => {
    render(<VolunteerPublicForm campaign={campaign} />)
    const birthDate = screen.getByLabelText("Data de nascimento *")
    fireEvent.change(birthDate, { target: { value: "31021990" } })
    expect(screen.getByRole("alert")).toHaveTextContent("Informe uma data de nascimento válida")
    expect(birthDate).toHaveAttribute("aria-invalid", "true")
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

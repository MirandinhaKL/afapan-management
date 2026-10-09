import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { VolunteerPublicForm } from "@/components/volunteer-public-form"
import { VOLUNTEER_ACTIVITIES, VOLUNTEER_ACTIVITY_GROUPS } from "@/lib/volunteers"

const configuration = { privacyText: "Estou ciente do uso dos dados.", privacyVersion: "permanente-1", participationText: "Quero participar como voluntário.", participationVersion: "permanente-1" }

describe("formulário público de voluntários", () => {
  it("apresenta a foto, os textos aprovados e datas no padrão brasileiro", () => {
    render(<VolunteerPublicForm configuration={configuration} />)
    expect(screen.getByAltText("Voluntários da AFAPAN reunidos")).toBeInTheDocument()
    expect(screen.getByText(configuration.privacyText)).toBeInTheDocument()
    expect(screen.getByText(configuration.participationText)).toBeInTheDocument()
    expect(screen.getByLabelText(/Data de nascimento/)).toHaveAttribute("placeholder", "dd/mm/aaaa")
    expect(screen.getByLabelText(/Início das atividades/)).toHaveAttribute("placeholder", "MM/AAAA")
  })

  it("remove o espaço superior do card e aumenta a distância entre rótulos e campos", () => {
    render(<VolunteerPublicForm configuration={configuration} />)
    expect(screen.getByText("Voluntariado AFAPAN").closest('[data-slot="card"]')).toHaveClass("py-0")
    expect(screen.getByRole("button", { name: "Enviar cadastro" }).closest("form")).toHaveClass("[&_[data-slot=label]]:mb-2")
  })

  it("centraliza o conteúdo do cabeçalho verde", () => {
    render(<VolunteerPublicForm configuration={configuration} />)
    const header = screen.getByText("Voluntariado AFAPAN").closest('[data-slot="card-header"]')
    expect(header).toHaveClass("flex", "items-center", "justify-center", "text-center", "py-6")
    expect(screen.getByText("Voluntariado AFAPAN").parentElement).toHaveClass("items-center", "justify-center")
    expect(screen.getByText("Cadastro de novos voluntários")).toHaveClass("text-center")
  })

  it("diferencia campos obrigatórios sem escrever opcional nos demais", () => {
    render(<VolunteerPublicForm configuration={configuration} />)
    expect(screen.getByText("Nome *")).toHaveClass("font-bold")
    expect(screen.getByText("Telefone com WhatsApp *")).toHaveClass("font-bold")
    expect(screen.getByText("E-mail")).not.toHaveTextContent(/opcional/i)
    expect(screen.queryByText(/\(opcional\)/i)).not.toBeInTheDocument()
  })

  it("aplica máscara de celular e impede dígitos excedentes", () => {
    render(<VolunteerPublicForm configuration={configuration} />)
    const phone = screen.getByLabelText("Telefone com WhatsApp *")
    fireEvent.change(phone, { target: { value: "54999991234999" } })
    expect(phone).toHaveValue("(54) 99999-1234")
    expect(phone).toHaveAttribute("maxlength", "15")
  })

  it("valida o e-mail preenchido ao sair do campo e aceita o campo vazio", () => {
    render(<VolunteerPublicForm configuration={configuration} />)
    const email = screen.getByLabelText("E-mail")
    fireEvent.change(email, { target: { value: "karine@afapan" } })
    fireEvent.blur(email)
    expect(screen.getByRole("alert")).toHaveTextContent("Informe um e-mail válido.")
    fireEvent.change(email, { target: { value: "karine@afapan.com.br" } })
    expect(screen.queryByText("Informe um e-mail válido.")).not.toBeInTheDocument()
  })

  it("usa o título Endereço", () => {
    render(<VolunteerPublicForm configuration={configuration} />)
    expect(screen.getByRole("heading", { name: "Endereço" })).toBeInTheDocument()
    expect(screen.queryByText("Onde você mora?")).not.toBeInTheDocument()
  })

  it("permite marcar e desmarcar todas as atividades", async () => {
    const user = userEvent.setup()
    render(<VolunteerPublicForm configuration={configuration} />)
    const markAll = screen.getByLabelText("Marcar todas as atividades")

    await user.click(markAll)
    for (const activity of VOLUNTEER_ACTIVITIES) expect(screen.getByLabelText(activity.label)).toBeChecked()

    await user.click(markAll)
    for (const activity of VOLUNTEER_ACTIVITIES) expect(screen.getByLabelText(activity.label)).not.toBeChecked()
  })

  it("CA-051/CA-052: apresenta os cinco grupos e remove outras atividades", () => {
    render(<VolunteerPublicForm configuration={configuration} />)
    for (const group of VOLUNTEER_ACTIVITY_GROUPS) {
      const fieldset = screen.getByRole("group", { name: group.title })
      expect(fieldset).toHaveTextContent(group.icon)
      for (const activity of group.activities) expect(screen.getByLabelText(activity.label)).toBeInTheDocument()
    }
    expect(screen.queryByLabelText("Outras atividades")).not.toBeInTheDocument()
    expect(screen.queryByLabelText("Quais outras atividades?")).not.toBeInTheDocument()
  })

  it("valida a data de nascimento assim que o preenchimento termina", () => {
    render(<VolunteerPublicForm configuration={configuration} />)
    const birthDate = screen.getByLabelText("Data de nascimento *")
    fireEvent.change(birthDate, { target: { value: "31021990" } })
    expect(screen.getByRole("alert")).toHaveTextContent("Informe uma data de nascimento válida")
    expect(birthDate).toHaveAttribute("aria-invalid", "true")
  })

  it("mostra somente frequência na seção de disponibilidade", () => {
    render(<VolunteerPublicForm configuration={configuration} />)
    expect(screen.getByLabelText(/Com que frequência/)).toBeInTheDocument()
    expect(screen.queryByText("Dias disponíveis *")).not.toBeInTheDocument()
    expect(screen.queryByText("Turnos *")).not.toBeInTheDocument()
  })

  it("bloqueia o envio vazio com mensagem compreensível", async () => {
    const user = userEvent.setup()
    render(<VolunteerPublicForm configuration={configuration} />)
    await user.click(screen.getByRole("button", { name: "Enviar cadastro" }))
    expect(screen.getByText("Informe o nome.")).toBeInTheDocument()
  })

  it("exibe os dados e a autorização do responsável para menor", () => {
    render(<VolunteerPublicForm configuration={configuration} />)
    fireEvent.change(screen.getByLabelText("Data de nascimento *"), { target: { value: "10/01/2012" } })
    expect(screen.getByText("Responsável pelo menor")).toBeInTheDocument()
    expect(screen.getByLabelText("Nome do responsável *")).toBeInTheDocument()
  })

  it("não chama a API quando há erro local", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
    const user = userEvent.setup()
    render(<VolunteerPublicForm configuration={configuration} />)
    await user.click(screen.getByRole("button", { name: "Enviar cadastro" }))
    expect(fetchMock).not.toHaveBeenCalled()
    fetchMock.mockRestore()
  })
})

describe("cadastro permanente: envio e recuperação", () => {
  afterEach(() => vi.restoreAllMocks())

  function fillRequired() {
    fireEvent.change(screen.getByLabelText("Nome *"), { target: { value: "Ana" } })
    fireEvent.change(screen.getByLabelText("Sobrenome *"), { target: { value: "Silva" } })
    fireEvent.change(screen.getByLabelText("Data de nascimento *"), { target: { value: "15031990" } })
    fireEvent.change(screen.getByLabelText("Telefone com WhatsApp *"), { target: { value: "54999991234" } })
    fireEvent.change(screen.getByLabelText("Bairro *"), { target: { value: "Centro" } })
    fireEvent.click(screen.getByLabelText("Plantio de árvores nativas"))
    fireEvent.click(screen.getByLabelText(configuration.privacyText))
    fireEvent.click(screen.getByLabelText(configuration.participationText))
  }

  it("CA-001/CA-004/CA-005: envia cadastro com versões sem campanha ou prazo", async () => {
    const user = userEvent.setup()
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }))
    render(<VolunteerPublicForm configuration={configuration} />)
    expect(screen.queryByText(/Responda até/)).not.toBeInTheDocument()
    fillRequired()
    await user.click(screen.getByRole("button", { name: "Enviar cadastro" }))
    expect(await screen.findByText("Cadastro recebido!")).toBeInTheDocument()
    const payload = JSON.parse(fetchMock.mock.calls[0][1]?.body as string)
    expect(payload).toMatchObject({ privacyVersion: "permanente-1", participationVersion: "permanente-1", activities: ["plantio_arvores_nativas"] })
    expect(payload).not.toHaveProperty("campaignId")
    expect(payload).not.toHaveProperty("deadline")
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("CA-010: falha de rede mantém os valores e não repete a criação", async () => {
    const user = userEvent.setup()
    const fetchMock = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Não foi possível enviar o cadastro."))
    render(<VolunteerPublicForm configuration={configuration} />)
    fillRequired()
    await user.click(screen.getByRole("button", { name: "Enviar cadastro" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível enviar")
    expect(screen.getByLabelText("Nome *")).toHaveValue("Ana")
    expect(screen.getByLabelText("Bairro *")).toHaveValue("Centro")
    expect(screen.queryByText("Cadastro recebido!")).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("CA-010: resposta HTTP bem-sucedida sem confirmação não mostra sucesso falso", async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("unexpected response", { status: 200 }))
    render(<VolunteerPublicForm configuration={configuration} />)
    fillRequired()
    await user.click(screen.getByRole("button", { name: "Enviar cadastro" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível enviar o cadastro")
    expect(screen.queryByText("Cadastro recebido!")).not.toBeInTheDocument()
    expect(screen.getByLabelText("Nome *")).toHaveValue("Ana")
  })

  it("CA-005/CA-010: atualiza consentimentos desatualizados preservando dados e exigindo novos aceites", async () => {
    const user = userEvent.setup()
    const next = { ...configuration, privacyText: "Novo texto de privacidade", participationText: "Novo texto de participação", privacyVersion: "permanente-2", participationVersion: "permanente-2" }
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: "FORM_VERSION_OUTDATED", error: "Atualize os textos." }), { status: 409 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(next)))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true })))
    render(<VolunteerPublicForm configuration={configuration} />)
    fillRequired()
    await user.click(screen.getByRole("button", { name: "Enviar cadastro" }))
    await user.click(await screen.findByRole("button", { name: "Atualizar textos de confirmação" }))
    expect(await screen.findByLabelText(next.privacyText)).not.toBeChecked()
    expect(screen.getByLabelText(next.participationText)).not.toBeChecked()
    expect(screen.getByLabelText("Nome *")).toHaveValue("Ana")
    expect(screen.getByLabelText("Plantio de árvores nativas")).toBeChecked()
    await user.click(screen.getByRole("button", { name: "Enviar cadastro" }))
    expect(fetchMock).toHaveBeenCalledTimes(2)
    await user.click(screen.getByLabelText(next.privacyText))
    await user.click(screen.getByLabelText(next.participationText))
    await user.click(screen.getByRole("button", { name: "Enviar cadastro" }))
    expect(await screen.findByText("Cadastro recebido!")).toBeInTheDocument()
    expect(JSON.parse(fetchMock.mock.calls[2][1]?.body as string)).toMatchObject({ privacyVersion: "permanente-2", participationVersion: "permanente-2" })
  })

  it("CA-010: falha ao atualizar textos não limpa os dados nem libera envio com versões antigas", async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: "FORM_VERSION_OUTDATED", error: "Atualize os textos." }), { status: 409 }))
      .mockRejectedValueOnce(new Error("network"))
    render(<VolunteerPublicForm configuration={configuration} />)
    fillRequired()
    await user.click(screen.getByRole("button", { name: "Enviar cadastro" }))
    await user.click(await screen.findByRole("button", { name: "Atualizar textos de confirmação" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("Seus dados foram mantidos")
    expect(screen.getByLabelText("Nome *")).toHaveValue("Ana")
    expect(screen.getByRole("button", { name: "Enviar cadastro" })).toBeDisabled()
  })
})

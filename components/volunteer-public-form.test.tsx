import { fireEvent,render,screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe,expect,it,vi } from "vitest"
import { VolunteerPublicForm } from "@/components/volunteer-public-form"

const campaign={name:"Confirmação 2026",deadline:"2026-10-06T23:59:00Z",privacyText:"Estou ciente do uso dos dados.",participationText:"Quero continuar como voluntário."}

describe("formulário público de voluntários",()=>{
  it("apresenta os textos aprovados e o início opcional",()=>{render(<VolunteerPublicForm token="00000000-0000-0000-0000-000000000001" campaign={campaign}/>);expect(screen.getByText(campaign.privacyText)).toBeInTheDocument();expect(screen.getByText(campaign.participationText)).toBeInTheDocument();expect(screen.getByLabelText(/Início das atividades/)).toHaveAttribute("type","month")})
  it("bloqueia o envio vazio com mensagem compreensível",async()=>{const user=userEvent.setup();render(<VolunteerPublicForm token="00000000-0000-0000-0000-000000000001" campaign={campaign}/>);await user.click(screen.getByRole("button",{name:"Enviar cadastro"}));expect(screen.getByText("Informe o nome.")).toBeInTheDocument()})
  it("exibe os dados e a autorização do responsável para menor",()=>{render(<VolunteerPublicForm token="00000000-0000-0000-0000-000000000001" campaign={campaign}/>);fireEvent.change(screen.getByLabelText("Data de nascimento *"),{target:{value:"2012-01-10"}});expect(screen.getByText("Responsável pelo menor")).toBeInTheDocument();expect(screen.getByLabelText("Nome do responsável *")).toBeInTheDocument()})
  it("não chama a API quando há erro local",async()=>{const fetchMock=vi.spyOn(globalThis,"fetch");const user=userEvent.setup();render(<VolunteerPublicForm token="00000000-0000-0000-0000-000000000001" campaign={campaign}/>);await user.click(screen.getByRole("button",{name:"Enviar cadastro"}));expect(fetchMock).not.toHaveBeenCalled();fetchMock.mockRestore()})
})

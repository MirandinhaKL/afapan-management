import { render,screen,waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach,describe,it,expect,vi } from "vitest"
const {fetchData,download,pdf}=vi.hoisted(()=>({fetchData:vi.fn(),download:vi.fn(),pdf:vi.fn()}))
vi.mock("@/lib/volunteer-export-query",()=>({fetchVolunteerExport:fetchData}))
vi.mock("@/lib/volunteer-export-data",async original=>({...await original<typeof import("@/lib/volunteer-export-data")>(),downloadExport:download}))
vi.mock("@/lib/volunteer-export-pdf",()=>({generateVolunteerPdf:pdf}))
import { VolunteerExportActions } from "./volunteer-export-actions"
beforeEach(()=>{vi.clearAllMocks();fetchData.mockResolvedValue([{id:"1",nome:"Ana"}]);pdf.mockResolvedValue(new Blob(["pdf"]))})
async function choose(format: "CSV"|"PDF") {
 const user=userEvent.setup()
 await user.click(screen.getByRole("button",{name:"Exportar"}))
 await user.click(screen.getByRole("menuitem",{name:`Exportar ${format}`}))
}
describe("menu de exportação na gestão interna",()=>{
 it("CA-010: apresenta botão único com opções PDF e CSV",async()=>{
  render(<VolunteerExportActions/>);expect(screen.getAllByRole("button")).toHaveLength(1)
  const user=userEvent.setup();await user.click(screen.getByRole("button",{name:"Exportar"}))
  expect(screen.getByRole("menuitem",{name:"Exportar PDF"})).toBeInTheDocument();expect(screen.getByRole("menuitem",{name:"Exportar CSV"})).toBeInTheDocument()
 })
 it("CA-007/CA-010: menu e CSV são acionáveis por teclado",async()=>{
  const user=userEvent.setup();render(<VolunteerExportActions/>);await user.tab();expect(screen.getByRole("button",{name:"Exportar"})).toHaveFocus()
  await user.keyboard("{Enter}");await screen.findByRole("menuitem",{name:"Exportar CSV"});await user.keyboard("{End}{Enter}")
  await screen.findByText(/Download iniciado/);expect(download).toHaveBeenCalledWith(expect.any(Blob),expect.stringMatching(/\.csv$/))
 })
 it("CA-007: falha do gerador PDF não libera download parcial",async()=>{pdf.mockRejectedValueOnce(new Error("Falha ao gerar PDF"));render(<VolunteerExportActions/>);await choose("PDF");await screen.findByText("Falha ao gerar PDF");expect(download).not.toHaveBeenCalled()})
 it("CA-007: CSV informa quantidade após download completo",async()=>{render(<VolunteerExportActions/>);await choose("CSV");await screen.findByText(/Download iniciado: 1/);expect(download).toHaveBeenCalledWith(expect.any(Blob),expect.stringMatching(/\.csv$/))})
 it("CA-007: PDF recebe o conjunto completo, independente da página",async()=>{render(<VolunteerExportActions/>);await choose("PDF");await waitFor(()=>expect(pdf).toHaveBeenCalled());await waitFor(()=>expect(download).toHaveBeenCalled());expect(pdf.mock.calls[0][0][0].name).toBe("Ana")})
 it("CA-007: bloqueia outra exportação enquanto lê e permite tentar após falha",async()=>{
  let fail: (e:Error)=>void=()=>{};fetchData.mockReturnValueOnce(new Promise((_,reject)=>{fail=reject}))
  render(<VolunteerExportActions/>);await choose("CSV");expect(fetchData).toHaveBeenCalledTimes(1);expect(screen.getByRole("button",{name:"Exportando..."})).toBeDisabled()
  fail(new Error("Falha de leitura"));await screen.findByText("Falha de leitura");expect(download).not.toHaveBeenCalled();expect(screen.getByRole("button",{name:"Exportar"})).not.toBeDisabled()
 })
 it("CA-007: nenhum registro não produz arquivo vazio",async()=>{fetchData.mockResolvedValue([]);render(<VolunteerExportActions/>);await choose("CSV");await screen.findByText(/Não há voluntários/);expect(download).not.toHaveBeenCalled()})
})

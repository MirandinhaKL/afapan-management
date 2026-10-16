import { describe,it,expect } from "vitest"
import { recordsForExport,serializeVolunteerCsv,exportFilename,mapExportRecord,getVolunteerPdfFields } from "./volunteer-export-data"
describe("exportação cadastral de voluntários",()=>{
  it("CA-011: PDF omite a seção administrativa e preserva os dados cadastrais",()=>{
    const record=mapExportRecord({id:"1",nome:"Ana",status:"ativo",origem:"publico",criado_em:"2026-10-15T12:00:00Z",atualizado_em:"2026-10-15T12:00:00Z",campaign_id:"campanha-antiga",historia_afapan:"Minha história"})
    const fields=getVolunteerPdfFields(record)
    expect(fields.some(f=>f.section==="Informações administrativas")).toBe(false)
    for(const label of ["Situação","Origem","Criação (America/Sao_Paulo)","Atualização (America/Sao_Paulo)","Campanha histórica"]) {
      expect(fields.some(f=>f.label===label)).toBe(false)
    }
    expect(fields.find(f=>f.label==="História e trajetória")?.value).toBe("Minha história")
  })
  it("CA-012: CSV retira somente as oito colunas solicitadas e seus valores, mantendo criação e PDF",()=>{
    const record=mapExportRecord({id:"identificador-secreto",nome:"Ana",responsavel_nome:"Responsável exclusivo",responsavel_telefone:"telefone-exclusivo",responsavel_autorizou:true,status:"ativo",origem:"publico",criado_em:"2026-10-15T12:00:00Z",atualizado_em:"2026-10-16T12:00:00Z",campaign_id:"campanha-exclusiva"})
    const csv=serializeVolunteerCsv([record,{...record,id:"outro",name:"Bia",fields:record.fields.map(f=>f.label==="Nome"?{...f,value:"Bia"}:f)}])
    const [header,...rows]=csv.split("\r\n")
    for(const label of ["Identificador","Nome do responsável","Telefone do responsável","Autorização do responsável","Situação","Origem","Atualização (America/Sao_Paulo)","Campanha histórica"]) expect(header).not.toContain(`"${label}"`)
    for(const value of ["identificador-secreto","Responsável exclusivo","telefone-exclusivo","campanha-exclusiva","16/10/2026"]) expect(csv).not.toContain(value)
    expect(header).toContain('"Criação (America/Sao_Paulo)"')
    expect(csv).toContain("15/10/2026")
    expect(rows).toHaveLength(2)
    for(const row of rows) expect(row.split(";")).toHaveLength(header.split(";").length)
    expect(header.split(";")).toHaveLength(record.fields.length-8)
    expect(getVolunteerPdfFields(record).find(f=>f.label==="Nome do responsável")?.value).toBe("Responsável exclusivo")
    expect(getVolunteerPdfFields(record).find(f=>f.label==="Identificador")?.value).toBe("identificador-secreto")
  })
  it("CA-002/CA-003: exclui arquivados e ordena todos os elegíveis, sem duplicação por interesses",()=>{
    const result=recordsForExport([{id:"2",nome:"Bia"},{id:"3",nome:"Carlos",arquivado_em:"2026-01-01"},{id:"1",nome:"Ana",volunteer_interests:[{atividade:"plantio_arvores_nativas"},{atividade:"compostagem_domestica"}]}])
    expect(result.map(r=>r.id)).toEqual(["1","2"])
    expect(result[0].fields.find(f=>f.label==="Atividades de interesse")?.value).toContain(" | ")
    expect(result[0].fields.map(f=>f.label)).toEqual(result[1].fields.map(f=>f.label))
  })
  it("CA-004: não inventa disponibilidade ou aceites e distingue recusa e ausência",()=>{
    const fields=mapExportRecord({id:"1",uso_imagem_autorizado:false}).fields
    expect(fields.find(f=>f.label==="Autorização de imagem")?.value).toBe("Não")
    expect(fields.find(f=>f.label==="Frequência")?.value).toBe("")
    expect(fields.find(f=>f.label==="Autorização do responsável")?.value).toBe("")
    expect(fields.some(f=>f.label.includes("privacidade"))).toBe(false)
  })
  it("CA-004/CA-005: CSV preserva relatos, escapes, zeros e neutraliza fórmulas sem as executar",()=>{
    const csv=serializeVolunteerCsv(recordsForExport([{id:"001",nome:" =HYPERLINK(1)",telefone:"01234",numero:"007",historia_afapan:'Ação; "memórias"\n💚🌱'}]))
    expect(csv.startsWith("\uFEFF")).toBe(true)
    expect(csv).toContain('"\' =HYPERLINK(1)"')
    expect(csv).toContain('"\'01234"');expect(csv).toContain('"\'007"')
    expect(csv).toContain('"Ação; ""memórias""\n💚🌱"')
    expect(csv).toContain("\r\n")
  })
  it("CA-006: datas civis e instante do nome não dependem do fuso da máquina",()=>{
    expect(mapExportRecord({id:"1",data_nascimento:"1990-01-02"}).fields.find(f=>f.label==="Nascimento")?.value).toBe("02/01/1990")
    expect(exportFilename(new Date("2026-10-15T01:02:03Z"),"pdf")).toBe("afapan-voluntarios-2026-10-14-220203.pdf")
  })
})

import { describe,it,expect,vi,beforeEach } from "vitest"
const {from,getUser}=vi.hoisted(()=>({from:vi.fn(),getUser:vi.fn()}))
vi.mock("@/lib/supabase",()=>({supabase:{from,auth:{getUser}}}))
import { fetchVolunteerExport } from "./volunteer-export-query"
function batch(data: unknown[],error: unknown=null){
 const q={select:vi.fn().mockReturnThis(),is:vi.fn().mockReturnThis(),order:vi.fn().mockReturnThis(),limit:vi.fn().mockReturnThis(),gt:vi.fn().mockReturnThis(),then:(resolve: (v:unknown)=>unknown)=>Promise.resolve({data,error}).then(resolve)}
 from.mockReturnValueOnce(q);return q
}
beforeEach(()=>{vi.clearAllMocks();getUser.mockResolvedValue({data:{user:{id:"user"}},error:null})})
describe("leitura completa e autorizada para exportação",()=>{
 it("CA-001: sem autenticação não consulta dados",async()=>{getUser.mockResolvedValueOnce({data:{user:null}});await expect(fetchVolunteerExport()).rejects.toThrow("sessão");expect(from).not.toHaveBeenCalled()})
 it("CA-002: continua após lote menor que o solicitado e confere relações",async()=>{
   const queries=[];for(let pass=0;pass<2;pass++){queries.push(batch([{id:"1",nome:"Ana"}]));queries.push(batch([{id:"2",nome:"Bia"}]));batch([])}
   expect(await fetchVolunteerExport()).toHaveLength(2)
   expect(queries[0].is).toHaveBeenCalledWith("arquivado_em",null)
   expect(queries[1].gt).toHaveBeenCalledWith("id","1")
   expect(queries[0].limit).toHaveBeenCalledWith(500)
 })
 it("CA-002/CA-008: mais de 500 registros não são cortados",async()=>{
   const rows=Array.from({length:501},(_,i)=>({id:String(i).padStart(4,"0")}));for(let pass=0;pass<2;pass++){batch(rows.slice(0,500));batch(rows.slice(500));batch([])}
   expect(await fetchVolunteerExport()).toHaveLength(501)
 })
 it("CA-007: falha intermediária não retorna dados parciais",async()=>{batch([{id:"1"}]);batch([],{});await expect(fetchVolunteerExport()).rejects.toThrow("todos os cadastros")})
 it("CA-007: mudança em relação, mesmo sem novo timestamp do pai, impede exportação",async()=>{
  batch([{id:"1",volunteer_interests:[{atividade:"antiga"}]}]);batch([]);batch([{id:"1",volunteer_interests:[{atividade:"nova"}]}]);batch([])
  await expect(fetchVolunteerExport()).rejects.toThrow("mudaram")
 })
 it("CA-007: cursor repetido é detectado",async()=>{batch([{id:"1"}]);batch([{id:"1"}]);await expect(fetchVolunteerExport()).rejects.toThrow("mudou")})
 it("CA-001: sessão encerrada durante coleta impede retorno",async()=>{
  batch([]);batch([]);getUser.mockResolvedValueOnce({data:{user:{id:"user"}}}).mockResolvedValueOnce({data:{user:null}})
  await expect(fetchVolunteerExport()).rejects.toThrow("sessão")
 })
})

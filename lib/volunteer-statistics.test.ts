import { beforeEach, describe, expect, it, vi } from "vitest"
const { from, getUser } = vi.hoisted(() => ({ from: vi.fn(), getUser: vi.fn() }))
vi.mock("@/lib/supabase", () => ({ supabase: { from, auth: { getUser } } }))
import { fetchVolunteerStatistics } from "./volunteer-statistics"
import { getVolunteerStatisticsYear } from "./volunteer-statistics-year"

type Row = Record<string, unknown>
function database(rows: Row[], failures: { count?: number | null; error?: unknown }[] = []) {
  const queries: Array<{ filters: Array<[string, string, unknown]>; select: ReturnType<typeof vi.fn> }> = []
  from.mockImplementation(() => {
    const filters: Array<[string,string,unknown]> = []
    const index = queries.length
    const q = {
      select: vi.fn().mockReturnThis(),
      is: (key: string, value: unknown) => { filters.push(["is",key,value]);return q },
      eq: (key: string, value: unknown) => { filters.push(["eq",key,value]);return q },
      gte: (key: string, value: number) => { filters.push(["gte",key,value]);return q },
      lte: (key: string, value: number) => { filters.push(["lte",key,value]);return q },
      then: (resolve: (result: unknown)=>unknown) => Promise.resolve({ count: rows.filter(row=>filters.every(([op,key,value])=>{
        if(op==="is") return row[key] == null
        if(op==="eq") return row[key]===value
        if(row[key]==null)return false
        return op==="gte" ? Number(row[key])>=Number(value) : Number(row[key])<=Number(value)
      })).length, error: null, ...failures[index] }).then(resolve),
    }
    queries.push({ filters, select: q.select });return q
  })
  return queries
}
beforeEach(()=>{vi.clearAllMocks();getUser.mockResolvedValue({data:{user:{id:"team"}},error:null})})
describe("indicadores globais de voluntários",()=>{
  it("CA-001/CA-002: usa início na AFAPAN, sem confundir com criação, origem ou situação",async()=>{
    database([
      {status:"ativo",inicio_atividades_mes:2,inicio_atividades_ano:2026,criado_em:"2020-01-01",origem:"assistido"},
      {status:"aguardando_validacao",inicio_atividades_mes:3,inicio_atividades_ano:2025,criado_em:"2026-01-01"},
      {status:"inativo",inicio_atividades_mes:4,inicio_atividades_ano:2026,origem:"publico"},
      {status:"sem_confirmacao",inicio_atividades_mes:5,inicio_atividades_ano:2026},
      {status:"ativo",inicio_atividades_mes:1,inicio_atividades_ano:2026,arquivado_em:"2026-02-01"},
      {status:"aguardando_validacao"},
      {status:"aguardando_validacao",inicio_atividades_ano:2026,inicio_atividades_mes:null},
      {status:"ativo",inicio_atividades_ano:2026,inicio_atividades_mes:13},
    ])
    expect(await fetchVolunteerStatistics(2026)).toEqual({active:2,awaitingValidation:3,startedThisYear:3,year:2026})
  })
  it("CA-003: conta acima do limite de linhas sem transferir dados ou aplicar filtros da lista",async()=>{
    const queries=database(Array.from({length:1205},()=>({status:"ativo"})))
    expect((await fetchVolunteerStatistics(2026)).active).toBe(1205)
    expect(queries).toHaveLength(3)
    for(const query of queries){expect(query.select).toHaveBeenCalledWith("id",{count:"exact",head:true});expect(query.filters).toContainEqual(["is","arquivado_em",null]);expect(query.filters.some(([,key])=>["nome","cidade","criado_em"].includes(key))).toBe(false)}
  })
  it("CA-005: base vazia confirmada mostra zero",async()=>{database([]);expect(await fetchVolunteerStatistics(2026)).toEqual({active:0,awaitingValidation:0,startedThisYear:0,year:2026})})
  it.each([{count:null},{count:-1},{error:{message:"falha"}}])("CA-005: resposta inválida ou erro parcial não vira zero (%j)",async failure=>{database([],[failure]);await expect(fetchVolunteerStatistics(2026)).rejects.toThrow("Não foi possível")})
  it("CA-006: sem sessão não consulta indicadores",async()=>{getUser.mockResolvedValue({data:{user:null},error:null});await expect(fetchVolunteerStatistics(2026)).rejects.toThrow("Entre novamente");expect(from).not.toHaveBeenCalled()})
  it("CA-006: troca de usuário durante leitura não retorna totais da sessão anterior",async()=>{database([]);getUser.mockResolvedValueOnce({data:{user:{id:"a"}}}).mockResolvedValueOnce({data:{user:{id:"b"}}});await expect(fetchVolunteerStatistics(2026)).rejects.toThrow("sessão mudou")})
  it("CA-002: ano atual respeita virada em São Paulo, sem fuso da máquina",()=>{
    expect(getVolunteerStatisticsYear(new Date("2027-01-01T02:59:59Z"))).toBe(2026)
    expect(getVolunteerStatisticsYear(new Date("2027-01-01T03:00:00Z"))).toBe(2027)
  })
})

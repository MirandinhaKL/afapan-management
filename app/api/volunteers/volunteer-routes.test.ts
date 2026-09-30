import { describe,expect,it,vi } from "vitest"

vi.mock("@/lib/supabase-server",()=>({createSupabaseServiceClient:vi.fn()}))

import { GET } from "@/app/api/volunteers/campaign/[token]/route"
import { POST } from "@/app/api/volunteers/submit/route"

describe("rotas públicas de voluntários",()=>{
  it("não consulta o banco para token de campanha malformado",async()=>{
    const response=await GET(new Request("http://localhost/api/volunteers/campaign/invalido"),{params:Promise.resolve({token:"invalido"})})
    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({error:"Formulário indisponível."})
  })

  it("rejeita envio com token malformado",async()=>{
    const response=await POST(new Request("http://localhost/api/volunteers/submit",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:"invalido"})}))
    expect(response.status).toBe(400)
  })

  it("rejeita formulário incompleto antes de acessar o banco",async()=>{
    const response=await POST(new Request("http://localhost/api/volunteers/submit",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:"00000000-0000-0000-0000-000000000001",firstName:""})}))
    expect(response.status).toBe(400)
    const body=await response.json()
    expect(body.fields).toContain("firstName")
  })
})

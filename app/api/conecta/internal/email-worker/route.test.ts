// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { POST } from "./route"

const { simulate, serviceClient } = vi.hoisted(() => ({ simulate: vi.fn(), serviceClient: vi.fn() }))
vi.mock("@/lib/conecta/email-worker", () => ({ runEmailSimulation: simulate }))
vi.mock("@/lib/supabase-server", () => ({ createSupabaseServiceClient: serviceClient }))

const secret = "x".repeat(32)
const request = (token: string, body: object = { action: "run" }) =>
  new Request("http://localhost/api/conecta/internal/email-worker", {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv("CONECTA_EMAIL_MODE", "simulation")
  vi.stubEnv("CONECTA_WORKER_SECRET", secret)
  vi.stubEnv("CONECTA_PUBLIC_ORIGIN", "https://conecta.example.test")
})
afterEach(() => vi.unstubAllEnvs())

it("só processa a fila quando a simulação está habilitada e o segredo confere", async () => {
  vi.stubEnv("CONECTA_EMAIL_MODE", "")
  expect((await POST(request(secret))).status).toBe(503)
  vi.stubEnv("CONECTA_EMAIL_MODE", "simulation")
  expect((await POST(request("incorreto"))).status).toBe(401)
  expect(serviceClient).not.toHaveBeenCalled()
  const service = {}
  serviceClient.mockReturnValueOnce(service)
  simulate.mockResolvedValue({ status: "idle" })
  const response = await POST(request(secret))
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({ status: "idle" })
  expect(simulate).toHaveBeenCalledWith(service, "https://conecta.example.test")
})

it("exige justificativa na conferência de um resultado incerto", async () => {
  const jobId = "eb0d2421-8577-4bb5-850d-d9b36b540f11"
  const operation = { action: "reconcile", jobId, result: "failed", note: "" }
  expect((await POST(request(secret, operation))).status).toBe(400)
  const rpc = vi.fn().mockResolvedValue({ data: true })
  serviceClient.mockReturnValueOnce({ rpc })
  expect((await POST(request(secret, { ...operation, note: "Aceite descartado no simulador." }))).status).toBe(200)
  expect(rpc).toHaveBeenCalledWith("conecta_reconcile_email_simulation", {
    p_id: jobId, p_result: "failed", p_note: "Aceite descartado no simulador.",
  })
})

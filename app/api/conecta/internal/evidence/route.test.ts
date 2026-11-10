// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest"
const { rpc, sign } = vi.hoisted(() => ({ rpc: vi.fn(), sign: vi.fn() }))
vi.mock("@/lib/conecta/internal-server", () => ({ conectaInternalClient: async () => ({ rpc }) }))
vi.mock("@/lib/supabase-server", () => ({ createSupabaseServiceClient: () => ({ storage: { from: () => ({ createSignedUrl: sign }) } }) }))
import { POST } from "./route"
const id = "8e11e491-1cbb-47ad-8b76-d605d7d270ff"
const applicationId = "7a0bd0b8-f301-4ff9-a1e1-2393bf2af2fb"
beforeEach(() => {
  rpc.mockReset()
  sign.mockReset().mockResolvedValue({ data: { signedUrl: "https://example.test/file" }, error: null })
})
const request = () => new Request("http://localhost/api/conecta/internal/evidence", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, applicationId }),
})
it("personaliza o nome do comprovante com o participante da solicitação", async () => {
  rpc.mockResolvedValueOnce({ data: { path: "evidence/file", mime: "application/pdf" } })
    .mockResolvedValueOnce({ data: { name: "Karine Miranda", attachments: [{ id }] } })
  const response = await POST(request())
  expect(response.status).toBe(200)
  expect((await response.json()).filename).toBe("comprovante-conecta-afapan-karine-miranda.pdf")
  expect(sign).toHaveBeenCalledWith("evidence/file", 60, { download: "comprovante-conecta-afapan-karine-miranda.pdf" })
})
it("impede usar o nome de outra solicitação para um comprovante", async () => {
  rpc.mockResolvedValueOnce({ data: { path: "evidence/file", mime: "application/pdf" } })
    .mockResolvedValueOnce({ data: { name: "Outra pessoa", attachments: [] } })
  expect((await POST(request())).status).toBe(404)
  expect(sign).not.toHaveBeenCalled()
})

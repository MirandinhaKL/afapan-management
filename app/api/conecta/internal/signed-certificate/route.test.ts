// @vitest-environment node
import { createHash } from "node:crypto"
import { PDFDocument } from "pdf-lib"
import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { POST } from "./route"

const { session, rpc, sign } = vi.hoisted(() => ({ session: vi.fn(), rpc: vi.fn(), sign: vi.fn() }))
vi.mock("@/lib/conecta/internal-server", () => ({ conectaInternalSession: session }))
vi.mock("@/lib/supabase-server", () => ({
  createSupabaseServiceClient: () => ({ rpc, storage: { from: () => ({ createSignedUrl: sign }) } }),
}))

const applicationId = "a0b52d02-ec9d-4038-9f0e-b693f051bcba"
const certificateId = "eb0d2421-8577-4bb5-850d-d9b36b540f11"
const uploadId = "1b233844-394c-4054-8692-bd4e453cb08b"
const originalHash = "a".repeat(64)
const request = (confirmed: boolean) => new Request("http://localhost/api/conecta/internal/signed-certificate", {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ action: "confirm", applicationId, certificateId, uploadId, confirmed }),
})

beforeEach(() => {
  session.mockReset().mockResolvedValue({ userId: "staff" })
  rpc.mockReset().mockResolvedValueOnce({ data: { originalHash, signedKey: null, name: "Estudante Exemplo" } })
    .mockResolvedValue({ error: null })
  sign.mockReset().mockResolvedValue({ data: { signedUrl: "https://storage.example.test/signed.pdf" } })
})
afterEach(() => vi.unstubAllGlobals())

it("exige uma confirmação explícita e uma sessão interna", async () => {
  expect((await POST(request(false))).status).toBe(400)
  session.mockResolvedValueOnce(null)
  expect((await POST(request(true))).status).toBe(401)
  expect(rpc).not.toHaveBeenCalled()
})

it("rejeita um arquivo que imita o cabeçalho PDF", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("%PDF-1.7\nconteúdo inválido\n%%EOF")))
  expect((await POST(request(true))).status).toBe(400)
  expect(rpc).toHaveBeenCalledTimes(1)
})

it("confere a estrutura e registra o hash dos bytes recebidos", async () => {
  const pdf = await PDFDocument.create()
  pdf.addPage()
  const bytes = Buffer.from(await pdf.save())
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(bytes)))
  expect((await POST(request(true))).status).toBe(200)
  expect(sign).toHaveBeenCalledWith(`certificates/${certificateId}/signed/${uploadId}.pdf`, 60)
  expect(rpc).toHaveBeenLastCalledWith("conecta_confirm_signed_certificate", {
    p_application: applicationId, p_certificate: certificateId, p_actor: "staff", p_upload: uploadId,
    p_hash: createHash("sha256").update(bytes).digest("hex"),
  })
})

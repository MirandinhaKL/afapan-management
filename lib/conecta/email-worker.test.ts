// @vitest-environment node
import { createHash } from "node:crypto"
import { afterEach, expect, it, vi } from "vitest"
import { runEmailSimulation } from "./email-worker"

const jobId = "eb0d2421-8577-4bb5-850d-d9b36b540f11"
const bytes = Buffer.from("%PDF-fictício")
const certificate = {
  purpose: "certificate", eventKey: "certificate:example", recipient: "estudante@example.test",
  name: "Estudante <script>", modality: "Visita & oficina", code: "A".repeat(32),
  signedKey: "certificates/emission/signed/document.pdf",
  signedHash: createHash("sha256").update(bytes).digest("hex"),
}

function mockService(first: unknown, latest = first) {
  let reads = 0
  const rpc = vi.fn(async (operation: string) => {
    if (operation === "conecta_claim_email_simulation") return { data: jobId }
    if (operation === "conecta_email_simulation_context") return { data: reads++ === 0 ? first : latest }
    return { data: true }
  })
  const storage = { from: () => ({
    createSignedUrl: async () => ({ data: { signedUrl: "https://storage.example.test/signed.pdf" }, error: null }),
  }) }
  return { rpc, service: { rpc, storage } as unknown as Parameters<typeof runEmailSimulation>[0] }
}

afterEach(() => vi.unstubAllGlobals())

it("prepara o certificado com os mesmos bytes e escapa os dados do e-mail", async () => {
  const { service } = mockService(certificate)
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(bytes)))
  const send = vi.fn().mockResolvedValue("accepted")
  expect(await runEmailSimulation(service, "https://conecta.example.test", { send })).toEqual({ jobId, status: "accepted" })
  const message = send.mock.calls[0][0]
  expect(Buffer.from(message.attachment.bytes)).toEqual(bytes)
  expect(message.recipient).toBe(certificate.recipient)
  expect(message.html).toContain("Estudante &lt;script&gt;")
  expect(message.html).toContain("Visita &amp; oficina")
})

it("cancela quando a emissão deixa de estar vigente antes do despacho", async () => {
  const { service, rpc } = mockService(certificate, null)
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(bytes)))
  const send = vi.fn()
  expect(await runEmailSimulation(service, "https://conecta.example.test", { send })).toEqual({ jobId, status: "cancelled" })
  expect(send).not.toHaveBeenCalled()
  expect(rpc).toHaveBeenLastCalledWith("conecta_finish_email_simulation", expect.objectContaining({ p_result: "cancelled" }))
})

it("registra falha recuperável quando os bytes divergem do hash conferido", async () => {
  const { service, rpc } = mockService(certificate)
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("arquivo divergente")))
  const send = vi.fn()
  expect(await runEmailSimulation(service, "https://conecta.example.test", { send })).toEqual({ jobId, status: "failed" })
  expect(send).not.toHaveBeenCalled()
  expect(rpc).toHaveBeenLastCalledWith("conecta_finish_email_simulation", expect.objectContaining({ p_result: "failed" }))
})

it("registra resultado incerto se o provedor falhar depois de ser chamado", async () => {
  const { service } = mockService({ purpose: "rejection", eventKey: "rejection:test", recipient: "estudante@example.test", reason: "Revisão necessária" })
  const send = vi.fn().mockRejectedValue(new Error("Timeout"))
  expect(await runEmailSimulation(service, "https://conecta.example.test", { send })).toEqual({ jobId, status: "uncertain" })
  expect(send).toHaveBeenCalledTimes(1)
})

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
vi.mock("@/lib/supabase", () => ({ supabase: { auth: { getSession: async () => ({ data: { session: { access_token: "test" } } }) } } }))
import { ConectaCertificateActions } from "./conecta-certificate-actions"

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })
it("mostra o motivo registrado ao abrir uma emissão invalidada", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true, json: async () => ({
      certificate: {
        id: "cert", code: "A".repeat(32), generated: true, published: false, invalidated: true,
        invalidationReason: "Carga horária incorreta na emissão anterior.",
      },
    }),
  }))
  render(<ConectaCertificateActions applicationId="example" />)
  expect(await screen.findByText("Motivo da invalidação")).toBeInTheDocument()
  expect(screen.getByText("Carga horária incorreta na emissão anterior.")).toBeInTheDocument()
  expect(screen.getByRole("button", { name: "Gerar nova emissão" })).toBeEnabled()
})

it("indica geração em andamento e libera retentativa após falha", async () => {
  let rejectGeneration!: (error: Error) => void
  const generation = new Promise<never>((_, reject) => { rejectGeneration = reject })
  vi.stubGlobal("fetch", vi.fn().mockImplementation(async (_url, options) =>
    JSON.parse(options.body).action === "generate" ? generation : { ok: true, json: async () => ({ certificate: null }) },
  ))
  render(<ConectaCertificateActions applicationId="example" />)
  fireEvent.click(await screen.findByRole("button", { name: "Gerar certificado" }))
  expect(await screen.findByRole("button", { name: "Gerando certificado…" })).toBeDisabled()
  expect(screen.getByRole("status")).toHaveTextContent("Gerando certificado. Aguarde a conclusão.")
  await act(async () => { rejectGeneration(new Error("Falha simulada")); await generation.catch(() => {}) })
  expect(await screen.findByRole("alert")).toHaveTextContent("Falha simulada")
  await waitFor(() => expect(screen.getByRole("button", { name: "Gerar certificado" })).toBeEnabled())
})

it("mantém aviso até receber o PDF e salva o certificado com o nome do participante", async () => {
  let completeDownload!: (value: Blob) => void
  const body = new Promise<Blob>(resolve => { completeDownload = resolve })
  const createUrl = vi.fn().mockReturnValue("blob:certificado")
  const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {})
  vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: createUrl, revokeObjectURL: vi.fn() }))
  vi.stubGlobal("fetch", vi.fn().mockImplementation(async (url, options) => {
    if (url === "https://storage.example.test/file") return { ok: true, blob: () => body }
    if (JSON.parse(options.body).action === "status") return { ok: true, json: async () => ({
      certificate: { id: "cert", code: "A".repeat(32), generated: true, published: false, invalidated: false },
    }) }
    return { ok: true, json: async () => ({ url: "https://storage.example.test/file", filename: "certificado-conecta-afapan-karine-miranda.pdf" }) }
  }))
  render(<ConectaCertificateActions applicationId="example" />)
  fireEvent.click(await screen.findByRole("button", { name: "Baixar certificado" }))
  expect(await screen.findByRole("status")).toHaveTextContent("Preparando o PDF para download")
  expect(click).not.toHaveBeenCalled()
  let savedName = ""
  click.mockImplementation(function (this: HTMLAnchorElement) { savedName = this.download })
  await act(async () => { completeDownload(new Blob(["%PDF-1.7"])); await body })
  await waitFor(() => expect(savedName).toBe("certificado-conecta-afapan-karine-miranda.pdf"))
  expect(createUrl).toHaveBeenCalled()
})

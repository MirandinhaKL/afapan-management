import { describe, expect, it } from "vitest"
import { evidenceMetadata, matchesUploadSignature, uploadManifestSchema, uploadRequestSchema } from "./uploads"

describe("comprovantes Conecta", () => {
  it("aceita 50 MB somados e bloqueia um byte acima, também na conferência de envio", () => {
    const files = [{ mime: "video/mp4", bytes: 35 * 1024 * 1024 }, { mime: "application/pdf", bytes: 15 * 1024 * 1024 }]
    expect(uploadRequestSchema.safeParse({ files }).success).toBe(true)
    const over = [{ ...files[0], bytes: files[0].bytes + 1 }, files[1]]
    expect(uploadRequestSchema.safeParse({ files: over }).success).toBe(false)
    const manifest = over.map((file, index) => ({ ...file, id: `00000000-0000-4000-8000-00000000000${index}`, path: `evidence/${index}` }))
    expect(uploadManifestSchema.safeParse(manifest).success).toBe(false)
  })
  it("aceita zero comprovantes e bloqueia formatos ativos e excesso de tamanho", () => {
    expect(uploadRequestSchema.safeParse({ files: [] }).success).toBe(true)
    expect(uploadRequestSchema.safeParse({ files: [{ mime: "text/html", bytes: 10 }] }).success).toBe(false)
    expect(uploadRequestSchema.safeParse({ files: [{ mime: "image/png", bytes: 11 * 1024 * 1024 }] }).success).toBe(false)
    expect(uploadRequestSchema.safeParse({ files: Array.from({ length: 3 }, () => ({ mime: "video/mp4", bytes: 50 * 1024 * 1024 })) }).success).toBe(false)
    expect(uploadRequestSchema.safeParse({ files: [{ mime: "application/pdf", bytes: 10 }] }).success).toBe(true)
  })
  it("aceita PDF sem MIME informado pelo navegador, preservando a validação do conteúdo", () => {
    expect(evidenceMetadata({ name: "cartilha.PDF", type: "", size: 10 })).toEqual({ mime: "application/pdf", bytes: 10 })
    expect(uploadRequestSchema.safeParse({ files: [evidenceMetadata({ name: "pagina.html", type: "", size: 10 })] }).success).toBe(false)
    expect(matchesUploadSignature("application/pdf", new TextEncoder().encode("<html>"))).toBe(false)
  })
  it("não aceita HTML disfarçado de imagem ou PDF", () => {
    const html = new TextEncoder().encode("<html>não é imagem</html>")
    expect(matchesUploadSignature("image/png", html)).toBe(false)
    expect(matchesUploadSignature("application/pdf", html)).toBe(false)
    expect(matchesUploadSignature("image/png", Uint8Array.of(137,80,78,71,13,10,26,10))).toBe(true)
    expect(matchesUploadSignature("application/pdf", new TextEncoder().encode("%PDF-1.7"))).toBe(true)
  })
})

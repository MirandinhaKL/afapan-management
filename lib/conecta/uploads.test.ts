import { describe, expect, it } from "vitest"
import { matchesUploadSignature, uploadRequestSchema } from "./uploads"

describe("comprovantes Conecta", () => {
  it("exige comprovante, bloqueia formatos ativos e limita tamanho individual e total", () => {
    expect(uploadRequestSchema.safeParse({ files: [] }).success).toBe(false)
    expect(uploadRequestSchema.safeParse({ files: [{ mime: "text/html", bytes: 10 }] }).success).toBe(false)
    expect(uploadRequestSchema.safeParse({ files: [{ mime: "image/png", bytes: 11 * 1024 * 1024 }] }).success).toBe(false)
    expect(uploadRequestSchema.safeParse({ files: Array.from({ length: 3 }, () => ({ mime: "video/mp4", bytes: 50 * 1024 * 1024 })) }).success).toBe(false)
    expect(uploadRequestSchema.safeParse({ files: [{ mime: "application/pdf", bytes: 10 }] }).success).toBe(true)
  })
  it("não aceita HTML disfarçado de imagem ou PDF", () => {
    const html = new TextEncoder().encode("<html>não é imagem</html>")
    expect(matchesUploadSignature("image/png", html)).toBe(false)
    expect(matchesUploadSignature("application/pdf", html)).toBe(false)
    expect(matchesUploadSignature("image/png", Uint8Array.of(137,80,78,71,13,10,26,10))).toBe(true)
    expect(matchesUploadSignature("application/pdf", new TextEncoder().encode("%PDF-1.7"))).toBe(true)
  })
})

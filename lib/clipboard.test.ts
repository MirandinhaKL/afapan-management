import { afterEach, describe, expect, it, vi } from "vitest"
import { copyTextToClipboard } from "@/lib/clipboard"

describe("cópia de texto para a área de transferência", () => {
  afterEach(() => vi.restoreAllMocks())

  it("copia o link usando a API do navegador", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } })

    await expect(copyTextToClipboard("https://gestao.afapan.com.br/voluntariado/cadastro")).resolves.toBe(true)
    expect(writeText).toHaveBeenCalledWith("https://gestao.afapan.com.br/voluntariado/cadastro")
  })

  it("usa a alternativa compatível quando a API moderna falha", async () => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new Error("bloqueado")) } })
    const execCommand = vi.fn().mockReturnValue(true)
    Object.defineProperty(document, "execCommand", { configurable: true, value: execCommand })

    await expect(copyTextToClipboard("link")).resolves.toBe(true)
    expect(execCommand).toHaveBeenCalledWith("copy")
  })

  it("informa falha quando nenhuma estratégia consegue copiar", async () => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined })
    Object.defineProperty(document, "execCommand", { configurable: true, value: undefined })

    await expect(copyTextToClipboard("link")).resolves.toBe(false)
  })
})

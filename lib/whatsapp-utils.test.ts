import { describe, expect, it } from "vitest"
import { generateWhatsAppLink, generateWhatsAppMessage } from "@/lib/whatsapp-utils"

const expectedMessage = `Olá Aline Fernanda Silvestrini!

Este é o 1º formulário para registro da quantidade de baldes destinados à composteira.

O preenchimento faz parte do compromisso assumido no projeto e é essencial para acompanharmos os resultados do Compostando Juntos.

*Informe a quantidade de baldes destinados à composteira no período de 04/12/2025 a 28/02/2026.*

Clique no link abaixo para registrar a quantidade de baldes:

https://gestao.afapan.com.br/bucket/token-123

Obrigado por contribuir com a compostagem e fortalecer essa iniciativa!`

describe("mensagem do WhatsApp", () => {
  it("gera a mensagem com ordinal, intervalo e link do formulário", () => {
    expect(
      generateWhatsAppMessage(
        "token-123",
        "Aline Fernanda Silvestrini",
        "Registro 1",
        "https://gestao.afapan.com.br",
        "2025-12-04",
        "2026-02-28"
      )
    ).toBe(expectedMessage)
  })

  it("usa a mesma mensagem no link direto do WhatsApp", () => {
    const link = generateWhatsAppLink(
      "token-123",
      "Aline Fernanda Silvestrini",
      "Registro 1",
      {
        baseUrl: "https://gestao.afapan.com.br",
        phoneNumber: "(54) 99999-9999",
      },
      "2025-12-04",
      "2026-02-28"
    )

    expect(link).toBe(`https://wa.me/5554999999999?text=${encodeURIComponent(expectedMessage)}`)
  })
})

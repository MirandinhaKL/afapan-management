import { describe, expect, it } from "vitest"
import { getBucketLinkAccessError } from "@/lib/bucket-link-validation"

describe("validação de acesso ao link de baldes", () => {
  const now = new Date("2026-08-13T12:00:00.000Z")

  it("permite utilizar um link ativo e ainda não enviado", () => {
    expect(getBucketLinkAccessError({
      is_active: true,
      submitted: false,
      expires_at: "2026-08-14T12:00:00.000Z",
    }, now)).toBeNull()
  })

  it("bloqueia um link que já foi utilizado", () => {
    expect(getBucketLinkAccessError({
      is_active: false,
      submitted: true,
      expires_at: null,
    }, now)).toEqual({
      message: "Este link já foi utilizado. O número de baldes já foi registrado.",
      status: 409,
    })
  })

  it("bloqueia um link expirado", () => {
    expect(getBucketLinkAccessError({
      is_active: true,
      submitted: false,
      expires_at: "2026-08-12T12:00:00.000Z",
    }, now)).toEqual({ message: "Link expirado.", status: 410 })
  })
})

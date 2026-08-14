import { describe, expect, it } from "vitest"
import { formatBucketPeriodDate, formatBucketPeriodRange } from "@/lib/bucket-period"

describe("período de coleta de baldes", () => {
  it("formata a data no padrão brasileiro", () => {
    expect(formatBucketPeriodDate("2026-02-28")).toBe("28/02/2026")
  })

  it("formata o intervalo completo", () => {
    expect(formatBucketPeriodRange("2025-12-04", "2026-02-28"))
      .toBe("de 04/12/2025 a 28/02/2026")
  })

  it("não cria um intervalo incompleto", () => {
    expect(formatBucketPeriodRange("2025-12-04", undefined)).toBeNull()
  })
})

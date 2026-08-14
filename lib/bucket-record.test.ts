import { describe, expect, it } from "vitest"
import { getBucketPeriodRecordKey } from "./bucket-record"

describe("getBucketPeriodRecordKey", () => {
  it("identifica o trimestre e o número do registro da campanha", () => {
    expect(getBucketPeriodRecordKey("2026-02-28", 1)).toBe("2026-Q1-R1")
    expect(getBucketPeriodRecordKey("2026-07-15", 3)).toBe("2026-Q3-R3")
  })

  it("rejeita data ou número de período inválidos", () => {
    expect(() => getBucketPeriodRecordKey("2026-13-01", 1)).toThrow(
      "Data de monitoramento inválida"
    )
    expect(() => getBucketPeriodRecordKey("2026-02-28", 0)).toThrow(
      "Número do período inválido"
    )
  })
})

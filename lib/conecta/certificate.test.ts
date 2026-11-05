// @vitest-environment node
import { readFileSync, writeFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { certificateSnapshot, certificateStatement, renderCertificate } from "./certificate"

const sample = certificateSnapshot.parse({
  version: 1, code: "ABCDEF0123456789ABCDEF0123456789", name: "Mariana Ribeiro Alves",
  cpf: "00000000000", course: "Gestão Ambiental", institution: "Instituição de Ensino Exemplo",
  modality: "Compostando nas Escolas", startDate: "2026-10-14", endDate: "2026-10-16",
  issuedAt: "2026-10-16T17:00:00+00:00", minutes: 360, signer: "Nome da pessoa signatária",
  title: "Representação institucional", city: "Cidade Exemplo",
})

describe("Certificado Conecta AFAPAN", () => {
  it("informa período, CPF formatado e carga reconhecida no parágrafo principal", () => {
    const statement = certificateStatement(sample)
    expect(statement).toContain("A AFAPAN certifica que o(a) estudante, inscrito(a) no CPF 000.000.000-00")
    expect(statement).toContain("de 14 de outubro de 2026 a 16 de outubro de 2026, totalizando a carga horária de 6 horas.")
    expect(certificateStatement({ ...sample, startDate: sample.endDate, minutes: 95 }))
      .toContain("em 16 de outubro de 2026, totalizando a carga horária de 1 hora e 35 minutos.")
  })

  it("gera o mesmo PDF A4 horizontal ao repetir uma emissão com os mesmos dados", () => {
    const logo = readFileSync("public/afapan-favicon-master.png")
    const pdf = Buffer.from(renderCertificate(sample, logo))
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-")
    expect(pdf.toString("latin1")).toMatch(/\/MediaBox \[0 0 841\.\d+ 595\.\d+\]/)
    expect(pdf.equals(renderCertificate(sample, logo))).toBe(true)
    if (process.env.CONECTA_TEST_PREVIEW_PATH) {
      writeFileSync(process.env.CONECTA_TEST_PREVIEW_PATH, renderCertificate(sample, logo, true))
    }
  })
})

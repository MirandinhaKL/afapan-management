// @vitest-environment node
import { readFileSync, writeFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { certificateFilename, certificateSnapshot, certificateStatement, renderCertificate } from "./certificate"

const sample = certificateSnapshot.parse({
  version: 1, code: "ABCDEF0123456789ABCDEF0123456789", name: "Mariana Ribeiro Alves",
  cpf: "00000000000", course: "Gestão Ambiental", institution: "Instituição de Ensino Exemplo",
  modality: "Compostando nas Escolas", startDate: "2026-10-14", endDate: "2026-10-16",
  issuedAt: "2026-10-16T17:00:00+00:00", minutes: 360, signer: "Nome da pessoa signatária",
  title: "Representação institucional", city: "Cidade Exemplo",
})

describe("Certificado Conecta AFAPAN", () => {
  it("inclui o nome do participante no arquivo sem acentos ou separadores de caminho", () => {
    expect(certificateFilename("Karine Miranda")).toBe("certificado-conecta-afapan-karine-miranda.pdf")
    expect(certificateFilename("João da Conceição")).toBe("certificado-conecta-afapan-joao-da-conceicao.pdf")
    expect(certificateFilename("../Ana / Silva")).toBe("certificado-conecta-afapan-ana-silva.pdf")
  })
  it("informa período, CPF formatado e carga reconhecida no parágrafo principal", () => {
    const statement = certificateStatement(sample)
    expect(statement).toContain("A Associação Farroupilhense de Proteção ao Ambiente Natural (AFAPAN) certifica que o(a) estudante, inscrito(a) no CPF 000.000.000-00")
    expect(statement).toContain("de 14 de outubro de 2026 a 16 de outubro de 2026, totalizando a carga horária de 6 horas.")
    expect(certificateStatement({ ...sample, startDate: sample.endDate, minutes: 95 }))
      .toContain("em 16 de outubro de 2026, totalizando a carga horária de 1 hora e 35 minutos.")
  })

  it("acomoda um parágrafo longo em uma única página com o nome completo da associação", () => {
    const longField = "Formação em gestão ambiental e desenvolvimento sustentável ".repeat(3).slice(0, 160)
    const logo = readFileSync("public/afapan-favicon-master.png")
    const pdf = renderCertificate({ ...sample, course: longField, institution: longField, modality: longField }, logo)
    expect(Buffer.from(pdf).toString("latin1")).toMatch(/\/Count 1\b/)
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

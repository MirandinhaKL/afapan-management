import { describe, expect, it } from "vitest"
import { parseImport, participantImportHeaders } from "./compostagem-importacao"

const encode = (fields: string[]) => fields.map(value => '"' + value.replaceAll('"', '""') + '"').join(",")
const sample = ["10/2/2026 12:05:55", " Ana@Example.com ", "  Ana   Lúcia da Silva ", "012.345.678-90", "999999999", "Rua A, 1", "", 'Linha 1\nLinha "2"']
const csv = (...rows: string[][]) => [participantImportHeaders, ...rows].map(encode).join("\r\n")

describe("importação de participantes de compostagem", () => {
  it("aceita e-mail e data ausentes apenas no modo histórico", () => {
    const legacy = csv(["", "", "Ana Silva", "", "54999999999", "", "", ""])
    const [historical] = parseImport(legacy, {}, true)
    expect(historical.errors).toEqual([])
    expect(historical.data).toMatchObject({ email: null, respondidoEm: null })
    expect(parseImport(legacy, {})[0].errors).toHaveLength(2)
    const invalid = csv(["incorreta", "sem-arroba", "Ana Silva", "", "", "", "", ""])
    expect(parseImport(invalid, {}, true)[0].errors).toHaveLength(2)
  })

  it("lê colunas reordenadas e preserva acentos, aspas, endereço e respostas em várias linhas", () => {
    const [first, second] = parseImport("\uFEFF" + [
      [...participantImportHeaders].reverse(), [...sample].reverse(),
      [...sample.slice(0, 1), "outra@example.com", ...sample.slice(2)].reverse(),
    ].map(encode).join("\r\n"), { "2": "54", "4": "51" })
    expect(first.errors).toEqual([])
    expect(first.data).toMatchObject({
      linha: 2, nome: "Ana", sobrenome: "Lúcia da Silva", email: "ana@example.com",
      respondidoEm: "2026-10-02T15:05:55.000Z", cpf: "01234567890", telefone: "54999999999",
      endereco: "Rua A, 1", geracao: null, intencao: 'Linha 1\nLinha "2"',
    })
    expect(first.aviso).toBe("***.***.***-90")
    expect(second.data).toMatchObject({ linha: 4, telefone: "51999999999" })
  })

  it("aceita nome único e ausência dos campos opcionais", () => {
    const [row] = parseImport(csv([sample[0], sample[1], "Ana", "", "", " ", "", ""]), {})
    expect(row.errors).toEqual([])
    expect(row.data).toMatchObject({ nome: "Ana", sobrenome: null, cpf: null, telefone: null, endereco: null, geracao: null, intencao: null })
    expect(row.aviso).toMatch(/CPF ausente/)
  })

  it("marca e-mails repetidos, DDD pendente e datas inválidas sem invalidar o arquivo", () => {
    const rows = parseImport(csv(sample, [...sample], ["2/30/2026 12:00:00", "b@example.com", "", "", "", "", "", ""]), {})
    expect(rows[0].errors).toContain("E-mail repetido no arquivo.")
    expect(rows[1].errors).toContain("Confirme o DDD do telefone.")
    expect(rows[2].errors).toEqual(["Nome obrigatório.", "Timestamp ausente ou inválido."])
  })

  it("interrompe a leitura quando faltam colunas, há cabeçalhos repetidos ou aspas abertas", () => {
    expect(() => parseImport("Timestamp,Email Address", {})).toThrow(/Cabeçalho/)
    expect(() => parseImport(encode([...participantImportHeaders, "Timestamp"]), {})).toThrow(/ambíguo/)
    expect(() => parseImport(csv(sample) + '\n"aberto', {})).toThrow(/Aspas abertas/)
  })
})

const headers = [
  "Timestamp", "Email Address", "Nome Completo:",
  "CPF: (essa informação será utilizada apenas para o Termo de Compromisso, que será assinado por você no dia da capacitação)",
  "Celular (Whatsapp):", "Endereço completo (Rua, número, bairro, cep):",
  "Qual a sua geração atual de resíduos?", "Qual seria a sua intenção em participar deste programa?",
]

export const maxImportBytes = 1024 * 1024
export const participantImportHeaders = headers

export function nomeCompleto(participante?: { nome?: string; sobrenome?: string | null } | null) {
  return [participante?.nome, participante?.sobrenome].filter(Boolean).join(" ")
}

function readCsv(csv: string) {
  const rows: { linha: number; cells: string[] }[] = []
  let cells: string[] = []
  let value = ""
  let mode: "plain" | "quoted" | "closed" = "plain"
  let line = 1
  let start = 1
  const source = csv.replace(/^\uFEFF/, "")
  for (let index = 0; index < source.length; index++) {
    const char = source[index]
    if (mode === "quoted") {
      if (char === '"' && source[index + 1] === '"') {
        value += '"'
        index++
      } else if (char === '"') {
        mode = "closed"
      } else {
        value += char
        if (char === "\n") line++
      }
      continue
    }
    if (char === "," || char === "\n" || char === "\r") {
      cells.push(value)
      value = ""
      mode = "plain"
      if (char !== ",") {
        if (char === "\r" && source[index + 1] === "\n") index++
        rows.push({ linha: start, cells })
        cells = []
        start = ++line
      }
    } else if (char === '"' && mode === "plain" && value === "") {
      mode = "quoted"
    } else if (char === '"' || mode === "closed") {
      throw new Error(`CSV ilegível na linha ${start}.`)
    } else {
      value += char
    }
  }
  if (mode === "quoted") throw new Error(`Aspas abertas na linha ${start}.`)
  if (cells.length || value || mode === "closed") rows.push({ linha: start, cells: [...cells, value] })
  return rows.filter(({ cells }) => cells.some(cell => cell.trim()))
}

const brasilia = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
})

function responseDate(value: string) {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2}):(\d{2})$/.exec(value)
  if (!match) return null
  const [, month, day, year, hour, minute, second] = match.map(part => part.padStart(2, "0"))
  const local = `${year}-${month}-${day} ${hour}:${minute}:${second}`
  const target = Date.parse(local.replace(" ", "T") + "Z")
  if (!Number.isFinite(target)) return null
  let guess = target
  for (let attempt = 0; attempt < 3; attempt++) {
    const formatted = brasilia.format(guess)
    if (formatted === local) return new Date(guess).toISOString()
    guess += target - Date.parse(formatted.replace(" ", "T") + "Z")
  }
  return null
}

export function parseImport(csv: string, ddds: Record<string, string>, historico = false) {
  const [header, ...rows] = readCsv(csv)
  if (!header) throw new Error("O CSV está vazio.")
  if (rows.length > 1000) throw new Error("O CSV pode conter até 1.000 inscrições.")
  const labels = header.cells.map(cell => cell.trim().normalize("NFC"))
  const indexes = headers.map(label => {
    const index = labels.indexOf(label)
    if (index < 0 || index !== labels.lastIndexOf(label)) throw new Error(`Cabeçalho ausente ou ambíguo: ${label}`)
    return index
  })
  const emails = new Map<string, number>()
  for (const { cells } of rows) {
    const email = cells[indexes[1]]?.trim().toLowerCase()
    if (email) emails.set(email, (emails.get(email) ?? 0) + 1)
  }
  return rows.map(({ linha, cells }) => {
    const [timestamp, rawEmail, fullName, rawCpf, rawPhone] = indexes.slice(0, 5).map(index => cells[index]?.trim() ?? "")
    const [nome = "", ...rest] = fullName.split(/\s+/)
    const email = rawEmail.toLowerCase()
    const cpfDigits = rawCpf.replace(/[.\-\s]/g, "")
    const phoneDigits = rawPhone.replace(/[()+.\-\s]/g, "")
    const local = /^\d{9}$/.test(phoneDigits)
    const confirmedDdd = ddds[String(linha)] ?? ""
    const respondidoEm = responseDate(timestamp)
    const errors: string[] = []
    if (cells.length !== labels.length) errors.push("Quantidade de colunas incompatível.")
    if (!nome) errors.push("Nome obrigatório.")
    if ((!historico || email) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("E-mail ausente ou inválido.")
    if ((emails.get(email) ?? 0) > 1) errors.push("E-mail repetido no arquivo.")
    if ((!historico || timestamp) && !respondidoEm) errors.push("Timestamp ausente ou inválido.")
    if (local && !/^[1-9][0-9]$/.test(confirmedDdd)) errors.push("Confirme o DDD do telefone.")
    if (rawPhone && !local && !/^\d{10,11}$/.test(phoneDigits)) errors.push("Telefone em formato incompatível.")
    const cpf = /^\d{11}$/.test(cpfDigits) ? cpfDigits : null
    const optional = (index: number) => {
      const value = cells[indexes[index]]
      return value?.trim() ? value : null
    }
    const data = {
      linha, email: email || null, nome, sobrenome: rest.join(" ") || null, respondidoEm, cpf,
      telefone: local ? confirmedDdd + phoneDigits : phoneDigits || null,
      endereco: optional(5), geracao: optional(6), intencao: optional(7),
    }
    return {
      data, errors, local,
      aviso: cpf ? `***.***.***-${cpf.slice(-2)}` : "CPF ausente ou em formato incompatível.",
    }
  })
}

export type ImportResult = {
  historico?: boolean
  requerRevisaoSemTelefone?: boolean
  linhas: {
    linha: number
    nome: string
    sobrenome: string | null
    status: "novo" | "vincular" | "importado" | "pendente"
    erros: string[]
    cpf: string
    dddSugerido: string | null
  }[]
  novosVinculos: number
  comprovante: string | null
  gravado: boolean
  mudou: boolean
}

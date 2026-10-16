import { VOLUNTEER_ACTIVITIES, VOLUNTEER_COMMUNICATION_CHANNELS, VOLUNTEER_FREQUENCIES, PREVIOUS_VOLUNTEERING_OPTIONS } from "@/lib/volunteers"

export type ExportRow = Record<string, unknown> & { id: string }
export type ExportField = { label: string; value: string; section: string; textual?: boolean }
export type ExportRecord = { id: string; name: string; fields: ExportField[] }
export function getVolunteerPdfFields(record: ExportRecord) {
  return record.fields.filter(field=>field.section!=="Informações administrativas")
}
const text = (value: unknown) => value == null ? "" : String(value)
const yesNo = (value: unknown) => value === true ? "Sim" : value === false ? "Não" : ""
const civil = (value: unknown) => text(value).replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$3/$2/$1")
const label = (options: readonly { value: string; label: string }[], value: unknown) => options.find(o => o.value === value)?.label ?? text(value)
export const exportInstant = (date: Date) => new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "medium" }).format(date)
const instant = (value: unknown) => value ? exportInstant(new Date(String(value))) : ""
export function exportFilename(date: Date, format: "csv" | "pdf") {
  const parts = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).format(date)
  return `afapan-voluntarios-${parts.replace(" ", "-").replaceAll(":", "")}.${format}`
}
export function mapExportRecord(row: ExportRow): ExportRecord {
  const fields: ExportField[] = []
  const add = (section: string, name: string, value: unknown, textual = false) => fields.push({ section, label: name, value: text(value), textual })
  const identity = "Identificação e contato", profile = "Participação e perfil", story = "Relatos", admin = "Informações administrativas", guardian = "Responsável"
  add(identity, "Identificador", row.id, true)
  for (const [key, name] of [["nome", "Nome"], ["sobrenome", "Sobrenome"]]) add(identity, name, row[key])
  add(identity, "Nascimento", civil(row.data_nascimento))
  for (const [key, name] of [["telefone", "Telefone"], ["email", "E-mail"], ["rua", "Rua"], ["numero", "Número"], ["complemento", "Complemento"], ["bairro", "Bairro"], ["cidade", "Cidade"], ["estado", "Estado"]]) add(identity, name, row[key], key === "telefone" || key === "numero")
  add(profile, "Profissão", row.profissao); add(profile, "Habilidades e experiências", row.habilidades)
  add(profile, "Início na AFAPAN", row.inicio_atividades_mes && row.inicio_atividades_ano ? `${String(row.inicio_atividades_mes).padStart(2, "0")}/${row.inicio_atividades_ano}` : "")
  const availability = Array.isArray(row.volunteer_availability) ? row.volunteer_availability[0] : row.volunteer_availability
  add(profile, "Frequência", label(VOLUNTEER_FREQUENCIES, (availability as { frequencia?: string } | null)?.frequencia))
  const interests = Array.isArray(row.volunteer_interests) ? row.volunteer_interests as { atividade: string }[] : []
  add(profile, "Atividades de interesse", [...new Set(interests.map(i => label(VOLUNTEER_ACTIVITIES, i.atividade)))].sort((a,b)=>a.localeCompare(b,"pt-BR")).join(" | "))
  add(profile, "Experiência de voluntariado", label(PREVIOUS_VOLUNTEERING_OPTIONS, row.experiencia_voluntariado))
  add(profile, "Canais de comunicação", Array.isArray(row.canais_comunicacao) ? row.canais_comunicacao.map(v=>label(VOLUNTEER_COMMUNICATION_CHANNELS,v)).join(" | ") : "")
  add(profile, "Autorização de imagem", yesNo(row.uso_imagem_autorizado))
  add(story, "Ideia de projeto", row.ideia_projeto); add(story, "História e trajetória", row.historia_afapan)
  add(story, "Expectativas (histórico)", row.expectativas); add(story, "Como conheceu (histórico)", row.como_conheceu)
  add(guardian, "Nome do responsável", row.responsavel_nome); add(guardian, "Telefone do responsável", row.responsavel_telefone, true)
  add(guardian, "Autorização do responsável", yesNo(row.responsavel_autorizou))
  add(admin, "Situação", ({ aguardando_validacao: "Aguardando validação", ativo: "Ativo", inativo: "Inativo", sem_confirmacao: "Sem confirmação" } as Record<string,string>)[text(row.status)] ?? row.status)
  add(admin, "Origem", row.origem === "publico" ? "Público" : row.origem === "assistido" ? "Assistido" : row.origem)
  add(admin, "Criação (America/Sao_Paulo)", instant(row.criado_em)); add(admin, "Atualização (America/Sao_Paulo)", instant(row.atualizado_em))
  add(admin, "Campanha histórica", row.campaign_id, true)
  return { id: row.id, name: `${text(row.nome)} ${text(row.sobrenome)}`.trim(), fields }
}
export function recordsForExport(rows: ExportRow[]) {
  return rows.filter(r=>!r.arquivado_em).sort((a,b)=>text(a.nome).localeCompare(text(b.nome),"pt-BR") || text(a.sobrenome).localeCompare(text(b.sobrenome),"pt-BR") || a.id.localeCompare(b.id)).map(mapExportRecord)
}
function csvCell(value: string, textual = false) {
  // Apostrophe is an explicit text marker for spreadsheet import, never a formula.
  const safe = value && (textual || /^[\s\u0000-\u001f]*[=+\-@]/u.test(value) || /^[\t\r\n]/u.test(value)) ? `'${value}` : value
  return `"${safe.replaceAll('"', '""')}"`
}
export function serializeVolunteerCsv(records: ExportRecord[]) {
  if (!records.length) throw new Error("Não há voluntários não arquivados para exportar.")
  const excluded = new Set(["Identificador", "Nome do responsável", "Telefone do responsável", "Autorização do responsável", "Situação", "Origem", "Atualização (America/Sao_Paulo)", "Campanha histórica"])
  const fields = records.map(record=>record.fields.filter(field=>!excluded.has(field.label)))
  return "\uFEFF" + [fields[0].map(f=>csvCell(f.label)).join(";"), ...fields.map(row=>row.map(f=>csvCell(f.value,f.textual)).join(";"))].join("\r\n")
}
export function downloadExport(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url; link.download = filename
  document.body.appendChild(link)
  try { link.click() } finally { link.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000) }
}

export const VOLUNTEER_FREQUENCIES = [
  { value: "diaria", label: "Diariamente" },
  { value: "semanal", label: "Uma vez por semana" },
  { value: "quinzenal", label: "A cada 15 dias" },
  { value: "mensal", label: "Uma vez por mês" },
  { value: "eventual", label: "Eventualmente" },
] as const

export const VOLUNTEER_ACTIVITY_GROUPS = [
  { title: "Preservação da Mata Atlântica", icon: "🌱", activities: [
    { value: "plantio_arvores_nativas", label: "Plantio de árvores nativas" },
    { value: "retirada_plantas_exoticas_invasoras", label: "Retirada de plantas exóticas invasoras" },
  ] },
  { title: "Reciclagem", icon: "♻️", activities: [
    { value: "coletas_residuos", label: "Coletas mensais e especiais de resíduos" },
    { value: "mutiroes_limpeza_areas_publicas", label: "Mutirões de limpeza de áreas públicas" },
    { value: "ecopontos", label: "Ecopontos" },
  ] },
  { title: "Compostagem", icon: "🌱", activities: [
    { value: "compostagem_domestica", label: "Compostagem doméstica" },
    { value: "compostagem_escolas", label: "Compostagem nas escolas" },
  ] },
  { title: "Educação Ambiental", icon: "🌎", activities: [
    { value: "oficinas_conscientizacao", label: "Oficinas de conscientização" },
    { value: "caminhos_residuos", label: "Acompanhamento de turmas no projeto Caminhos dos Resíduos" },
    { value: "palestras_atividades_educativas", label: "Palestras e atividades educativas" },
  ] },
  { title: "Projetos e Eventos", icon: "🤝", activities: [
    { value: "apoio_projetos_eventos", label: "Apoio e organização de projetos e eventos" },
    { value: "comunicacao_divulgacao", label: "Comunicação e divulgação" },
  ] },
] as const

export const VOLUNTEER_UNDECIDED_ACTIVITY = { value: "ainda_nao_sei", label: "Ainda não sei, quero conhecer as opções" } as const
export type VolunteerActivity = typeof VOLUNTEER_ACTIVITY_GROUPS[number]["activities"][number]["value"] | typeof VOLUNTEER_UNDECIDED_ACTIVITY["value"]
export const VOLUNTEER_ACTIVITIES = [
  ...VOLUNTEER_ACTIVITY_GROUPS.flatMap<{ value: VolunteerActivity; label: string }>((group) => [...group.activities]),
  VOLUNTEER_UNDECIDED_ACTIVITY,
]

export const VOLUNTEER_COMMUNICATION_CHANNELS = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "radio_tv_jornal", label: "Rádio, TV ou jornal" },
  { value: "site", label: "Site" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "nao_acompanho", label: "Não acompanho" },
] as const

export const PREVIOUS_VOLUNTEERING_OPTIONS = [
  { value: "atualmente", label: "Sim, atualmente" },
  { value: "anteriormente", label: "Já fui, mas não sou mais" },
  { value: "nunca", label: "Não" },
] as const

export type VolunteerFrequency = typeof VOLUNTEER_FREQUENCIES[number]["value"]
export type VolunteerCommunicationChannel = typeof VOLUNTEER_COMMUNICATION_CHANNELS[number]["value"]
export type PreviousVolunteering = typeof PREVIOUS_VOLUNTEERING_OPTIONS[number]["value"]
export type VolunteerStatus = "aguardando_validacao" | "ativo" | "sem_confirmacao" | "inativo"
export type VolunteerOrigin = "publico" | "assistido"

export const AFAPAN_CONTACT_EMAIL = "afapan.ong@gmail.com"
export const AFAPAN_CONTACT_WHATSAPP = "(54) 9941-9286"

export interface VolunteerInput {
  firstName: string
  lastName: string
  birthDate: string
  phone: string
  email?: string
  street?: string
  number?: string
  complement?: string
  neighborhood: string
  city: string
  state?: string
  profession?: string
  skills?: string
  activityStartMonth?: number | null
  activityStartYear?: number | null
  frequency: VolunteerFrequency
  activities: VolunteerActivity[]
  expectations?: string
  discoverySource?: string
  previousVolunteering?: PreviousVolunteering | null
  communicationChannels?: VolunteerCommunicationChannel[]
  projectIdea?: string
  imageUseAuthorized?: boolean | null
  afapanStory?: string
  guardianName?: string
  guardianPhone?: string
  guardianAuthorized?: boolean
  privacyAccepted: boolean
  participationAccepted: boolean
}

export interface Volunteer extends VolunteerInput {
  id: string
  normalizedPhone: string
  status: VolunteerStatus
  origin: VolunteerOrigin
  campaignId?: string
  createdAt: string
  updatedAt: string
  archivedAt?: string
}

export interface VolunteerFilters {
  search?: string
  status?: VolunteerStatus | "all"
  city?: string
  neighborhood?: string
  activity?: VolunteerActivity | "all"
  frequency?: VolunteerFrequency | "all"
  archive?: "active" | "archived" | "all"
}

export interface VolunteerCampaign {
  id: string
  name: string
  deadline: string
  active: boolean
  privacyText: string
  privacyVersion: string
  participationText: string
  participationVersion: string
  updatedAt: string
}

export interface VolunteerValidationError {
  field: keyof VolunteerInput | "form"
  message: string
}

export function normalizeBrazilianPhone(value: string) {
  let digits = (value || "").replace(/\D/g, "")
  if ((digits.length === 10 || digits.length === 11) && !digits.startsWith("55")) digits = `55${digits}`
  return digits
}

export function isValidBrazilianPhone(value: string) {
  const normalized = normalizeBrazilianPhone(value)
  return normalized.startsWith("55") && (normalized.length === 12 || normalized.length === 13)
}

export function maskBrazilianPhone(value: string) {
  let digits = value.replace(/\D/g, "")
  if (digits.startsWith("55") && digits.length > 11) digits = digits.slice(2)
  digits = digits.slice(0, 11)
  if (digits.length <= 2) return digits.length ? `(${digits}` : ""
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function maskBrazilianDate(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

export function maskMonthYear(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 6)
  return digits.length <= 2 ? digits : `${digits.slice(0, 2)}/${digits.slice(2)}`
}

function dateParts(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number)
    return { year, month, day }
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [day, month, year] = value.split("/").map(Number)
    return { year, month, day }
  }
  return null
}

function parseLocalDate(value: string) {
  const parts = dateParts(value)
  if (!parts) return null
  const date = new Date(parts.year, parts.month - 1, parts.day)
  if (date.getFullYear() !== parts.year || date.getMonth() !== parts.month - 1 || date.getDate() !== parts.day) return null
  return date
}

export function brazilianDateToIso(value: string) {
  const parts = dateParts(value)
  if (!parts || !parseLocalDate(value)) return null
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`
}

export function isoDateToBrazilian(value: string) {
  const parts = dateParts(value)
  if (!parts || !parseLocalDate(value)) return ""
  return `${String(parts.day).padStart(2, "0")}/${String(parts.month).padStart(2, "0")}/${parts.year}`
}

export function parseMonthYear(value: string) {
  if (!/^\d{2}\/\d{4}$/.test(value)) return { month: null, year: null }
  const [month, year] = value.split("/").map(Number)
  return { month, year }
}

export function calculateAge(birthDate: string, today = new Date()) {
  const birth = parseLocalDate(birthDate)
  if (!birth || birth > today) return null
  let age = today.getFullYear() - birth.getFullYear()
  const birthdayOccurred = today.getMonth() > birth.getMonth()
    || (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate())
  if (!birthdayOccurred) age -= 1
  return age
}

export function isMinor(birthDate: string, today = new Date()) {
  const age = calculateAge(birthDate, today)
  return age !== null && age < 18
}

export function getBirthDateValidationError(birthDate: string, today = new Date()) {
  if (!birthDate) return "Informe a data de nascimento."
  const birth = parseLocalDate(birthDate)
  if (!birth) return "Informe uma data de nascimento válida no formato dd/mm/aaaa."
  if (birth > today) return "A data de nascimento não pode ser futura."
  return null
}

export function getEmailValidationError(email?: string) {
  if (!email?.trim()) return null
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? null : "Informe um e-mail válido."
}

export function formatBirthday(birthDate: string) {
  const birth = parseLocalDate(birthDate)
  if (!birth) return "Não informado"
  return `${String(birth.getDate()).padStart(2, "0")}/${String(birth.getMonth() + 1).padStart(2, "0")}`
}

export function validateActivityStart(month?: number | null, year?: number | null, today = new Date()) {
  if (month == null && year == null) return true
  if (month == null || year == null || !Number.isInteger(month) || !Number.isInteger(year)) return false
  if (month < 1 || month > 12 || year < 1900) return false
  return year < today.getFullYear() || (year === today.getFullYear() && month <= today.getMonth() + 1)
}

export function formatActivityStart(month?: number | null, year?: number | null) {
  if (month == null || year == null) return "Não informado"
  return `${String(month).padStart(2, "0")}/${year}`
}

export function getFrequencyLabel(value: VolunteerFrequency) {
  return VOLUNTEER_FREQUENCIES.find((item) => item.value === value)?.label || value
}

export function validateVolunteerInput(input: VolunteerInput, today = new Date()) {
  const errors: VolunteerValidationError[] = []
  if (!input.firstName?.trim()) errors.push({ field: "firstName", message: "Informe o nome." })
  if (!input.lastName?.trim()) errors.push({ field: "lastName", message: "Informe o sobrenome." })
  const age = calculateAge(input.birthDate, today)
  const birthDateError = getBirthDateValidationError(input.birthDate, today)
  if (birthDateError) errors.push({ field: "birthDate", message: birthDateError })
  if (!isValidBrazilianPhone(input.phone)) errors.push({ field: "phone", message: "Informe um telefone com DDD válido." })
  const emailError = getEmailValidationError(input.email)
  if (emailError) errors.push({ field: "email", message: emailError })
  if (!input.neighborhood?.trim()) errors.push({ field: "neighborhood", message: "Informe o bairro." })
  if (!input.city?.trim()) errors.push({ field: "city", message: "Informe a cidade." })
  if (!VOLUNTEER_FREQUENCIES.some((item) => item.value === input.frequency)) errors.push({ field: "frequency", message: "Selecione uma frequência válida." })
  if (!Array.isArray(input.activities) || input.activities.length === 0) errors.push({ field: "activities", message: "Selecione ao menos uma atividade." })
  else if (input.activities.some((activity) => !VOLUNTEER_ACTIVITIES.some((item) => item.value === activity))) errors.push({ field: "activities", message: "Selecione atividades válidas." })
  if (!validateActivityStart(input.activityStartMonth, input.activityStartYear, today)) errors.push({ field: "activityStartMonth", message: "Informe mês e ano válidos e não futuros." })
  if (input.previousVolunteering && !PREVIOUS_VOLUNTEERING_OPTIONS.some((item) => item.value === input.previousVolunteering)) errors.push({ field: "previousVolunteering", message: "Selecione uma opção válida." })
  if (input.communicationChannels?.some((channel) => !VOLUNTEER_COMMUNICATION_CHANNELS.some((item) => item.value === channel))) errors.push({ field: "communicationChannels", message: "Selecione canais válidos." })
  if (age !== null && age < 18) {
    if (!input.guardianName?.trim()) errors.push({ field: "guardianName", message: "Informe o nome do responsável." })
    if (!input.guardianPhone || !isValidBrazilianPhone(input.guardianPhone)) errors.push({ field: "guardianPhone", message: "Informe o telefone do responsável." })
    if (!input.guardianAuthorized) errors.push({ field: "guardianAuthorized", message: "A autorização do responsável é obrigatória." })
  }
  if (!input.privacyAccepted) errors.push({ field: "privacyAccepted", message: "Confirme a ciência sobre o uso dos dados." })
  if (!input.participationAccepted) errors.push({ field: "participationAccepted", message: "Confirme o interesse em continuar como voluntário." })
  return errors
}

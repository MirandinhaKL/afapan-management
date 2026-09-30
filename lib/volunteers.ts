export const VOLUNTEER_DAYS = [
  { value: "segunda", label: "Segunda-feira" },
  { value: "terca", label: "Terça-feira" },
  { value: "quarta", label: "Quarta-feira" },
  { value: "quinta", label: "Quinta-feira" },
  { value: "sexta", label: "Sexta-feira" },
  { value: "sabado", label: "Sábado" },
  { value: "domingo", label: "Domingo" },
] as const

export const VOLUNTEER_SHIFTS = [
  { value: "manha", label: "Manhã" },
  { value: "tarde", label: "Tarde" },
  { value: "noite", label: "Noite" },
] as const

export const VOLUNTEER_FREQUENCIES = [
  { value: "eventual", label: "Eventual" },
  { value: "semanal", label: "Semanal" },
  { value: "quinzenal", label: "Quinzenal" },
  { value: "mensal", label: "Mensal" },
] as const

export const VOLUNTEER_ACTIVITIES = [
  { value: "plantio_mudas", label: "Plantio de mudas de árvores" },
  { value: "coleta_residuos", label: "Coleta de resíduos" },
  { value: "limpeza_areas_publicas", label: "Limpeza em áreas públicas" },
  { value: "retirada_plantas_exoticas", label: "Retirada de plantas exóticas de parques" },
  { value: "conscientizacao_ambiental", label: "Mutirão de conscientização ambiental" },
  { value: "caminhos_residuos", label: "Acompanhamento de turma Caminhos dos Resíduos" },
  { value: "compostagem_escola", label: "Compostagem doméstica na escola" },
  { value: "ecopontos_bairros", label: "Ecopontos nos bairros" },
  { value: "outras", label: "Outras atividades" },
  { value: "ainda_nao_sei", label: "Ainda não sei, quero conhecer as opções" },
] as const

export type VolunteerDay = typeof VOLUNTEER_DAYS[number]["value"]
export type VolunteerShift = typeof VOLUNTEER_SHIFTS[number]["value"]
export type VolunteerFrequency = typeof VOLUNTEER_FREQUENCIES[number]["value"]
export type VolunteerActivity = typeof VOLUNTEER_ACTIVITIES[number]["value"]
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
  availableDays: VolunteerDay[]
  availableShifts: VolunteerShift[]
  frequency: VolunteerFrequency
  availabilityNotes?: string
  activities: VolunteerActivity[]
  otherActivityDescription?: string
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
  day?: VolunteerDay | "all"
  archive?: "active" | "archived" | "all"
}

export interface VolunteerCampaign {
  id: string
  name: string
  publicToken: string
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
  if ((digits.length === 10 || digits.length === 11) && !digits.startsWith("55")) {
    digits = `55${digits}`
  }
  return digits
}

export function isValidBrazilianPhone(value: string) {
  const normalized = normalizeBrazilianPhone(value)
  return normalized.startsWith("55") && (normalized.length === 12 || normalized.length === 13)
}

function parseLocalDate(value: string) {
  if (!value) return null
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return null
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null
  return date
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

export function formatBirthday(birthDate: string) {
  const birth = parseLocalDate(birthDate)
  if (!birth) return "Não informado"
  return `${String(birth.getDate()).padStart(2, "0")}/${String(birth.getMonth() + 1).padStart(2, "0")}`
}

export function validateActivityStart(
  month?: number | null,
  year?: number | null,
  today = new Date()
) {
  if (month == null && year == null) return true
  if (month == null || year == null || !Number.isInteger(month) || !Number.isInteger(year)) return false
  if (month < 1 || month > 12 || year < 1900) return false
  return year < today.getFullYear()
    || (year === today.getFullYear() && month <= today.getMonth() + 1)
}

export function formatActivityStart(month?: number | null, year?: number | null) {
  if (month == null || year == null) return "Não informado"
  return `${String(month).padStart(2, "0")}/${year}`
}

export function validateVolunteerInput(input: VolunteerInput, today = new Date()) {
  const errors: VolunteerValidationError[] = []
  if (!input.firstName?.trim()) errors.push({ field: "firstName", message: "Informe o nome." })
  if (!input.lastName?.trim()) errors.push({ field: "lastName", message: "Informe o sobrenome." })
  const age = calculateAge(input.birthDate, today)
  if (age === null) errors.push({ field: "birthDate", message: "Informe uma data de nascimento válida." })
  if (!isValidBrazilianPhone(input.phone)) errors.push({ field: "phone", message: "Informe um telefone com DDD válido." })
  if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    errors.push({ field: "email", message: "Informe um e-mail válido." })
  }
  if (!input.neighborhood?.trim()) errors.push({ field: "neighborhood", message: "Informe o bairro." })
  if (!input.city?.trim()) errors.push({ field: "city", message: "Informe a cidade." })
  if (!Array.isArray(input.availableDays) || input.availableDays.length === 0) errors.push({ field: "availableDays", message: "Selecione ao menos um dia disponível." })
  if (!Array.isArray(input.availableShifts) || input.availableShifts.length === 0) errors.push({ field: "availableShifts", message: "Selecione ao menos um turno." })
  if (!VOLUNTEER_FREQUENCIES.some((item) => item.value === input.frequency)) errors.push({ field: "frequency", message: "Selecione uma frequência válida." })
  if (!Array.isArray(input.activities) || input.activities.length === 0) errors.push({ field: "activities", message: "Selecione ao menos uma atividade." })
  if (Array.isArray(input.activities) && input.activities.includes("outras") && !input.otherActivityDescription?.trim()) {
    errors.push({ field: "otherActivityDescription", message: "Descreva as outras atividades." })
  }
  if (!validateActivityStart(input.activityStartMonth, input.activityStartYear, today)) {
    errors.push({ field: "activityStartMonth", message: "Informe mês e ano válidos e não futuros." })
  }
  if (age !== null && age < 18) {
    if (!input.guardianName?.trim()) errors.push({ field: "guardianName", message: "Informe o nome do responsável." })
    if (!input.guardianPhone || !isValidBrazilianPhone(input.guardianPhone)) {
      errors.push({ field: "guardianPhone", message: "Informe o telefone do responsável." })
    }
    if (!input.guardianAuthorized) errors.push({ field: "guardianAuthorized", message: "A autorização do responsável é obrigatória." })
  }
  if (!input.privacyAccepted) errors.push({ field: "privacyAccepted", message: "Confirme a ciência sobre o uso dos dados." })
  if (!input.participationAccepted) errors.push({ field: "participationAccepted", message: "Confirme o interesse em continuar como voluntário." })
  return errors
}

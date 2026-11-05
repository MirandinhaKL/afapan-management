import { z } from "zod"

export function normalizeCpf(value: string) {
  return value.replace(/[.\s-]/g, "")
}

export function isValidCpf(value: string) {
  const cpf = normalizeCpf(value)
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false
  return [9, 10].every(position => {
    const sum = [...cpf.slice(0, position)].reduce((total, digit, i) => total + Number(digit) * (position + 1 - i), 0)
    return ((sum * 10) % 11) % 10 === Number(cpf[position])
  })
}

export function isCivilDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000-")) return false
  const date = new Date(value)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

const civilDate = z.string().refine(isCivilDate, "Data inválida")
const cpf = z.string().refine(isValidCpf, "CPF inválido").transform(normalizeCpf)
export const correctionTokenSchema = z.string().regex(/^[a-f0-9]{64}$/)
export const correctionSchema = z.object({
  report: z.string().trim().min(1).max(5000),
  tasks: z.array(z.string().uuid()).max(100),
  declaredMinutes: z.number().int().positive().max(2_147_483_647).optional(),
  attachments: z.array(z.string().uuid()).min(1).max(5),
}).strict()
export const resendSchema = z.object({
  cpf, birthDate: civilDate, code: z.string().trim().min(1).max(80).optional(),
}).strict()

export const applicationSchema = z.object({
  cpf, birthDate: civilDate, startDate: civilDate, endDate: civilDate,
  name: z.string().trim().min(3).max(160),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().regex(/^\+?[\d ()-]{10,24}$/).refine(value => {
    const digits = value.replace(/\D/g, "")
    return digits.length === 10 || digits.length === 11 || /^55\d{10,11}$/.test(digits)
  }, "WhatsApp inválido"),
  institution: z.string().trim().min(1).max(160),
  course: z.string().trim().min(1).max(160),
  instagram: z.string().trim().max(80).optional(),
  activityReference: z.string().trim().max(160).optional(),
  report: z.string().trim().min(1).max(5000),
  modalityVersion: z.string().uuid(),
  attachments: z.array(z.string().uuid()).min(1).max(5),
  tasks: z.array(z.string().uuid()).max(100),
  declaredMinutes: z.number().int().positive().max(2_147_483_647).optional(),
}).strict().superRefine((input, context) => {
  if (input.startDate > input.endDate) context.addIssue({ code: "custom", path: ["endDate"], message: "O fim deve ser igual ou posterior ao início." })
  if (input.birthDate > input.startDate) context.addIssue({ code: "custom", path: ["birthDate"], message: "Nascimento posterior à atividade." })
  for (const field of ["tasks", "attachments"] as const) {
    if (new Set(input[field]).size !== input[field].length) context.addIssue({ code: "custom", path: [field], message: "Itens repetidos." })
  }
})

type Task = { id: string; minutes: number }
type Modality = { mode: "checklist"; tasks: readonly Task[] } | { mode: "free" }

export function recognizedMinutes(modality: Modality, selectedIds: readonly string[], freeMinutes?: number): number {
  if (modality.mode === "free") {
    if (selectedIds.length || freeMinutes === undefined || !Number.isSafeInteger(freeMinutes) || freeMinutes <= 0 || freeMinutes > 2_147_483_647) {
      throw new Error("Informe uma carga horária válida para a visita.")
    }
    return freeMinutes
  }
  if (!selectedIds.length || new Set(selectedIds).size !== selectedIds.length || freeMinutes !== undefined) throw new Error("Confira as tarefas reconhecidas.")
  const values = new Map(modality.tasks.map(task => [task.id, task.minutes]))
  const total = selectedIds.reduce((sum, id) => {
    const minutes = values.get(id)
    if (minutes === undefined || !Number.isSafeInteger(minutes) || minutes <= 0) throw new Error("Tarefa inválida para a modalidade.")
    return sum + minutes
  }, 0)
  if (!Number.isSafeInteger(total) || total > 2_147_483_647) throw new Error("Carga horária inválida.")
  return total
}

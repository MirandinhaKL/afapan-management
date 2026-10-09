import { z } from "zod"
import { VOLUNTEER_ACTIVITIES, VOLUNTEER_FREQUENCIES, VOLUNTEER_COMMUNICATION_CHANNELS, PREVIOUS_VOLUNTEERING_OPTIONS } from "@/lib/volunteers"

export const VOLUNTEER_REGISTRATION_PATH = "/voluntariado/cadastro"

export const volunteerFormSettingsSchema = z.object({
  privacyText: z.string().refine((value) => Boolean(value.trim())),
  privacyVersion: z.string().refine((value) => Boolean(value.trim())),
  participationText: z.string().refine((value) => Boolean(value.trim())),
  participationVersion: z.string().refine((value) => Boolean(value.trim())),
})

export type VolunteerFormSettings = z.infer<typeof volunteerFormSettingsSchema>

// Strip unknown fields: public callers cannot choose campaign, status, origin or persisted consent text.
export const publicVolunteerPayloadSchema = z.object({
  firstName: z.string().min(1, "Informe o nome."),
  lastName: z.string().min(1, "Informe o sobrenome."),
  birthDate: z.string(),
  phone: z.string(),
  email: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string(),
  city: z.string(),
  state: z.string().optional(),
  profession: z.string().optional(),
  skills: z.string().optional(),
  activityStartMonth: z.number().nullable().optional(),
  activityStartYear: z.number().nullable().optional(),
  frequency: z.enum(VOLUNTEER_FREQUENCIES.map((item) => item.value) as [typeof VOLUNTEER_FREQUENCIES[number]["value"], ...typeof VOLUNTEER_FREQUENCIES[number]["value"][]]),
  activities: z.array(z.enum(VOLUNTEER_ACTIVITIES.map((item) => item.value) as [typeof VOLUNTEER_ACTIVITIES[number]["value"], ...typeof VOLUNTEER_ACTIVITIES[number]["value"][]])),
  expectations: z.string().optional(),
  discoverySource: z.string().optional(),
  previousVolunteering: z.enum(PREVIOUS_VOLUNTEERING_OPTIONS.map((item) => item.value) as [typeof PREVIOUS_VOLUNTEERING_OPTIONS[number]["value"], ...typeof PREVIOUS_VOLUNTEERING_OPTIONS[number]["value"][]]).nullable().optional(),
  communicationChannels: z.array(z.enum(VOLUNTEER_COMMUNICATION_CHANNELS.map((item) => item.value) as [typeof VOLUNTEER_COMMUNICATION_CHANNELS[number]["value"], ...typeof VOLUNTEER_COMMUNICATION_CHANNELS[number]["value"][]])).optional(),
  projectIdea: z.string().optional(),
  imageUseAuthorized: z.boolean().nullable().optional(),
  afapanStory: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  guardianAuthorized: z.boolean().optional(),
  privacyAccepted: z.boolean(),
  participationAccepted: z.boolean(),
  privacyVersion: z.string().refine((value) => Boolean(value.trim())),
  participationVersion: z.string().refine((value) => Boolean(value.trim())),
  website: z.string().optional(),
})

export type PublicVolunteerPayload = z.infer<typeof publicVolunteerPayloadSchema>

export async function fetchVolunteerFormSettings(): Promise<VolunteerFormSettings> {
  const response = await fetch("/api/volunteers/form", { cache: "no-store" })
  const result = await response.json().catch(() => null)
  if (!response.ok) throw new Error("Não foi possível carregar os textos do formulário. Tente novamente.")
  const parsed = volunteerFormSettingsSchema.safeParse(result)
  if (!parsed.success) throw new Error("Não foi possível carregar os textos do formulário. Tente novamente.")
  return parsed.data
}

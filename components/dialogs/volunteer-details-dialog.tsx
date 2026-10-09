"use client"

import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  PREVIOUS_VOLUNTEERING_OPTIONS,
  VOLUNTEER_ACTIVITIES,
  VOLUNTEER_COMMUNICATION_CHANNELS,
  calculateAge,
  formatActivityStart,
  formatBirthday,
  getFrequencyLabel,
  isoDateToBrazilian,
  type Volunteer,
} from "@/lib/volunteers"

export function VolunteerDetailsDialog({ volunteer, open, onOpenChange }: { volunteer: Volunteer | null; open: boolean; onOpenChange: (value: boolean) => void }) {
  if (!volunteer) return null
  const labels = (values: string[], items: readonly { value: string; label: string }[]) => values.map((value) => items.find((item) => item.value === value)?.label || value).join(", ") || "Não informado"
  const previous = PREVIOUS_VOLUNTEERING_OPTIONS.find((item) => item.value === volunteer.previousVolunteering)?.label || "Não informado"
  const image = volunteer.imageUseAuthorized == null ? "Não informado" : volunteer.imageUseAuthorized ? "Autorizado" : "Não autorizado"
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>{volunteer.firstName} {volunteer.lastName}</DialogTitle><DialogDescription>Cadastro completo do voluntário.</DialogDescription></DialogHeader><div className="grid gap-5 text-sm sm:grid-cols-2">
    <section className="space-y-2"><h3 className="font-semibold">Identificação e contato</h3><p><b>Telefone:</b> {volunteer.phone}</p><p><b>E-mail:</b> {volunteer.email || "Não informado"}</p><p><b>Nascimento:</b> {isoDateToBrazilian(volunteer.birthDate)} ({calculateAge(volunteer.birthDate)} anos)</p><p><b>Aniversário:</b> {formatBirthday(volunteer.birthDate)}</p><p><b>Início na AFAPAN:</b> {formatActivityStart(volunteer.activityStartMonth, volunteer.activityStartYear)}</p><p><b>Situação:</b> <Badge>{volunteer.status.replaceAll("_", " ")}</Badge></p></section>
    <section className="space-y-2"><h3 className="font-semibold">Endereço</h3><p>{[volunteer.street, volunteer.number, volunteer.complement].filter(Boolean).join(", ") || "Rua não informada"}</p><p>{volunteer.neighborhood} · {volunteer.city}/{volunteer.state || "-"}</p><h3 className="pt-2 font-semibold">Perfil</h3><p><b>Profissão:</b> {volunteer.profession || "Não informada"}</p><p><b>Habilidades:</b> {volunteer.skills || "Não informadas"}</p></section>
    <section className="space-y-2 sm:col-span-2"><h3 className="font-semibold">Disponibilidade e interesses</h3><p><b>Frequência:</b> {getFrequencyLabel(volunteer.frequency)}</p><p><b>Atividades:</b> {labels(volunteer.activities, VOLUNTEER_ACTIVITIES)}</p></section>
    <section className="space-y-2 sm:col-span-2"><h3 className="font-semibold">Informações opcionais</h3><p><b>O que espera da AFAPAN:</b> {volunteer.expectations || "Não informado"}</p><p><b>Como conheceu:</b> {volunteer.discoverySource || "Não informado"}</p><p><b>Experiência anterior:</b> {previous}</p><p><b>Canais:</b> {labels(volunteer.communicationChannels || [], VOLUNTEER_COMMUNICATION_CHANNELS)}</p><p><b>Ideia de projeto:</b> {volunteer.projectIdea || "Não informado"}</p><p><b>História com a AFAPAN:</b> {volunteer.afapanStory || "Não informado"}</p><p><b>Uso de imagem:</b> {image}</p></section>
    {volunteer.guardianName && <section className="space-y-2 sm:col-span-2"><h3 className="font-semibold">Responsável</h3><p>{volunteer.guardianName} · {volunteer.guardianPhone}</p></section>}
  </div></DialogContent></Dialog>
}

"use client"

import { useMemo, useState } from "react"
import { CheckCircle2, HeartHandshake } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  VOLUNTEER_ACTIVITIES,
  VOLUNTEER_DAYS,
  VOLUNTEER_FREQUENCIES,
  VOLUNTEER_SHIFTS,
  isMinor,
  validateVolunteerInput,
  type VolunteerActivity,
  type VolunteerDay,
  type VolunteerFrequency,
  type VolunteerInput,
  type VolunteerShift,
  AFAPAN_CONTACT_EMAIL,
  AFAPAN_CONTACT_WHATSAPP,
} from "@/lib/volunteers"

interface CampaignData {
  name: string
  deadline: string
  privacyText: string
  participationText: string
}

const initialValue: VolunteerInput = {
  firstName: "", lastName: "", birthDate: "", phone: "", email: "", street: "", number: "", complement: "",
  neighborhood: "", city: "Farroupilha", state: "RS", profession: "", skills: "", activityStartMonth: null,
  activityStartYear: null, availableDays: [], availableShifts: [], frequency: "eventual", availabilityNotes: "",
  activities: [], otherActivityDescription: "", guardianName: "", guardianPhone: "", guardianAuthorized: false,
  privacyAccepted: false, participationAccepted: false,
}

function CheckOption({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm hover:bg-muted/50"><input type="checkbox" className="mt-1 h-4 w-4 accent-primary" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span>{label}</span></label>
}

export function VolunteerPublicForm({ token, campaign }: { token: string; campaign: CampaignData }) {
  const [value, setValue] = useState<VolunteerInput>(initialValue)
  const [website, setWebsite] = useState("")
  const [startMonth, setStartMonth] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invalidFields, setInvalidFields] = useState<string[]>([])
  const minor = useMemo(() => Boolean(value.birthDate && isMinor(value.birthDate)), [value.birthDate])

  const update = <K extends keyof VolunteerInput>(field: K, next: VolunteerInput[K]) => {
    setValue((current) => ({ ...current, [field]: next }))
    setError(null)
    setInvalidFields((fields) => fields.filter((item) => item !== field))
  }
  const toggleArray = <T extends VolunteerDay | VolunteerShift | VolunteerActivity>(field: "availableDays" | "availableShifts" | "activities", item: T, checked: boolean) => {
    const current = value[field] as T[]
    update(field as keyof VolunteerInput, (checked ? [...current, item] : current.filter((value) => value !== item)) as never)
  }

  const handleStartMonth = (next: string) => {
    setStartMonth(next)
    if (!next) {
      update("activityStartMonth", null)
      update("activityStartYear", null)
      return
    }
    const [year, month] = next.split("-").map(Number)
    update("activityStartMonth", month)
    update("activityStartYear", year)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const errors = validateVolunteerInput(value)
    if (errors.length > 0) {
      setInvalidFields(errors.map((item) => String(item.field)))
      setError(errors[0].message)
      document.getElementById(String(errors[0].field))?.focus()
      return
    }
    try {
      setSubmitting(true)
      setError(null)
      const response = await fetch("/api/volunteers/submit", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, website, ...value }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(result?.error || "Não foi possível enviar o cadastro.")
      setSubmitted(true)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível enviar o cadastro.")
    } finally { setSubmitting(false) }
  }

  if (submitted) return <Card className="w-full max-w-2xl"><CardContent className="space-y-4 py-10 text-center"><CheckCircle2 className="mx-auto h-12 w-12 text-green-600" /><h1 className="text-2xl font-bold">Cadastro recebido!</h1><p className="text-muted-foreground">A AFAPAN fará a validação dos seus dados antes de confirmar sua participação como voluntário(a).</p></CardContent></Card>

  return <Card className="w-full max-w-4xl shadow-lg"><CardHeader className="border-b bg-primary text-primary-foreground"><div className="flex items-center gap-3"><HeartHandshake className="h-8 w-8" /><div><CardTitle className="text-2xl">Voluntariado AFAPAN</CardTitle><CardDescription className="text-primary-foreground/80">{campaign.name} · Responda até {new Date(campaign.deadline).toLocaleDateString("pt-BR")}</CardDescription></div></div></CardHeader><CardContent className="p-5 sm:p-8"><form onSubmit={handleSubmit} className="space-y-6" noValidate>
    <div className="absolute -left-[10000px]" aria-hidden="true"><Label htmlFor="website">Site</Label><Input id="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></div>
    <section className="space-y-4"><div><h2 className="text-xl font-semibold">Seus dados</h2><p className="text-sm text-muted-foreground">Campos marcados com * são obrigatórios.</p></div><div className="grid gap-4 sm:grid-cols-2">
      <div><Label htmlFor="firstName">Nome *</Label><Input id="firstName" value={value.firstName} onChange={(e) => update("firstName", e.target.value)} aria-invalid={invalidFields.includes("firstName")} /></div>
      <div><Label htmlFor="lastName">Sobrenome *</Label><Input id="lastName" value={value.lastName} onChange={(e) => update("lastName", e.target.value)} aria-invalid={invalidFields.includes("lastName")} /></div>
      <div><Label htmlFor="birthDate">Data de nascimento *</Label><Input id="birthDate" type="date" value={value.birthDate} onChange={(e) => update("birthDate", e.target.value)} aria-invalid={invalidFields.includes("birthDate")} /></div>
      <div><Label htmlFor="phone">Telefone com WhatsApp *</Label><Input id="phone" inputMode="tel" placeholder="(54) 99999-9999" value={value.phone} onChange={(e) => update("phone", e.target.value)} aria-invalid={invalidFields.includes("phone")} /></div>
      <div><Label htmlFor="email">E-mail (opcional)</Label><Input id="email" type="email" value={value.email} onChange={(e) => update("email", e.target.value)} /></div>
      <div><Label htmlFor="activityStart">Início das atividades na AFAPAN (opcional)</Label><Input id="activityStart" type="month" max={new Date().toISOString().slice(0, 7)} value={startMonth} onChange={(e) => handleStartMonth(e.target.value)} aria-invalid={invalidFields.includes("activityStartMonth")} /></div>
    </div></section>
    <section className="space-y-4 border-t pt-6"><h2 className="text-xl font-semibold">Endereço</h2><div className="grid gap-4 sm:grid-cols-2">
      <div><Label htmlFor="neighborhood">Bairro *</Label><Input id="neighborhood" value={value.neighborhood} onChange={(e) => update("neighborhood", e.target.value)} aria-invalid={invalidFields.includes("neighborhood")} /></div>
      <div><Label htmlFor="city">Cidade *</Label><Input id="city" value={value.city} onChange={(e) => update("city", e.target.value)} aria-invalid={invalidFields.includes("city")} /></div>
      <div><Label htmlFor="street">Rua (opcional)</Label><Input id="street" value={value.street} onChange={(e) => update("street", e.target.value)} /></div>
      <div><Label htmlFor="number">Número (opcional)</Label><Input id="number" value={value.number} onChange={(e) => update("number", e.target.value)} /></div>
      <div><Label htmlFor="complement">Complemento (opcional)</Label><Input id="complement" value={value.complement} onChange={(e) => update("complement", e.target.value)} /></div>
      <div><Label htmlFor="state">Estado (opcional)</Label><Input id="state" value={value.state} onChange={(e) => update("state", e.target.value)} /></div>
    </div></section>
    <section className="space-y-4 border-t pt-6"><h2 className="text-xl font-semibold">Como você pode contribuir?</h2><div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="profession">Profissão (opcional)</Label><Input id="profession" value={value.profession} onChange={(e) => update("profession", e.target.value)} /></div><div><Label htmlFor="skills">Habilidades e experiências (opcional)</Label><Textarea id="skills" value={value.skills} onChange={(e) => update("skills", e.target.value)} /></div></div><fieldset><legend className="mb-2 font-medium">Atividades de interesse *</legend><div id="activities" tabIndex={-1} className="grid gap-2 sm:grid-cols-2">{VOLUNTEER_ACTIVITIES.map((item) => <CheckOption key={item.value} label={item.label} checked={value.activities.includes(item.value)} onChange={(checked) => toggleArray("activities", item.value, checked)} />)}</div></fieldset>{value.activities.includes("outras") && <div><Label htmlFor="otherActivityDescription">Quais outras atividades? *</Label><Textarea id="otherActivityDescription" value={value.otherActivityDescription} onChange={(e) => update("otherActivityDescription", e.target.value)} /></div>}</section>
    <section className="space-y-4 border-t pt-6"><h2 className="text-xl font-semibold">Disponibilidade</h2><fieldset><legend className="mb-2 font-medium">Dias disponíveis *</legend><div id="availableDays" tabIndex={-1} className="grid gap-2 sm:grid-cols-3">{VOLUNTEER_DAYS.map((item) => <CheckOption key={item.value} label={item.label} checked={value.availableDays.includes(item.value)} onChange={(checked) => toggleArray("availableDays", item.value, checked)} />)}</div></fieldset><fieldset><legend className="mb-2 font-medium">Turnos *</legend><div id="availableShifts" tabIndex={-1} className="grid gap-2 sm:grid-cols-3">{VOLUNTEER_SHIFTS.map((item) => <CheckOption key={item.value} label={item.label} checked={value.availableShifts.includes(item.value)} onChange={(checked) => toggleArray("availableShifts", item.value, checked)} />)}</div></fieldset><div><Label htmlFor="frequency">Frequência pretendida *</Label><Select value={value.frequency} onValueChange={(next: VolunteerFrequency) => update("frequency", next)}><SelectTrigger id="frequency"><SelectValue /></SelectTrigger><SelectContent>{VOLUNTEER_FREQUENCIES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div><div><Label htmlFor="availabilityNotes">Observações sobre disponibilidade (opcional)</Label><Textarea id="availabilityNotes" value={value.availabilityNotes} onChange={(e) => update("availabilityNotes", e.target.value)} /></div></section>
    {minor && <section className="space-y-4 rounded-lg border border-amber-300 bg-amber-50 p-4"><h2 className="text-xl font-semibold">Responsável pelo menor</h2><div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="guardianName">Nome do responsável *</Label><Input id="guardianName" value={value.guardianName} onChange={(e) => update("guardianName", e.target.value)} /></div><div><Label htmlFor="guardianPhone">Telefone do responsável *</Label><Input id="guardianPhone" inputMode="tel" value={value.guardianPhone} onChange={(e) => update("guardianPhone", e.target.value)} /></div></div><CheckOption label="Declaro que o responsável autoriza a participação do menor nas atividades de voluntariado da AFAPAN." checked={Boolean(value.guardianAuthorized)} onChange={(checked) => update("guardianAuthorized", checked)} /></section>}
    <section className="space-y-3 border-t pt-6"><h2 className="text-xl font-semibold">Confirmações</h2><CheckOption label={campaign.privacyText} checked={value.privacyAccepted} onChange={(checked) => update("privacyAccepted", checked)} /><CheckOption label={campaign.participationText} checked={value.participationAccepted} onChange={(checked) => update("participationAccepted", checked)} /></section>
    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
    <Button type="submit" size="lg" className="w-full text-base" disabled={submitting}>{submitting ? "Enviando..." : "Enviar cadastro"}</Button>
    <p className="text-center text-sm text-muted-foreground">Precisa corrigir um cadastro? WhatsApp {AFAPAN_CONTACT_WHATSAPP} · {AFAPAN_CONTACT_EMAIL}</p>
  </form></CardContent></Card>
}

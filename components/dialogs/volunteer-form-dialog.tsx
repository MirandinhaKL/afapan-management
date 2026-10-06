"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  PREVIOUS_VOLUNTEERING_OPTIONS,
  VOLUNTEER_ACTIVITIES,
  VOLUNTEER_COMMUNICATION_CHANNELS,
  VOLUNTEER_FREQUENCIES,
  isoDateToBrazilian,
  isMinor,
  maskBrazilianDate,
  maskMonthYear,
  parseMonthYear,
  validateVolunteerInput,
  type Volunteer,
  type VolunteerActivity,
  type VolunteerCommunicationChannel,
  type VolunteerFrequency,
  type VolunteerInput,
  type VolunteerStatus,
} from "@/lib/volunteers"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  volunteer?: Volunteer | null
  onSave: (input: VolunteerInput & { status?: VolunteerStatus }) => Promise<boolean>
  saving?: boolean
}

const empty: VolunteerInput = {
  firstName: "", lastName: "", birthDate: "", phone: "", email: "", street: "", number: "", complement: "",
  neighborhood: "", city: "Farroupilha", state: "RS", profession: "", skills: "", activityStartMonth: null,
  activityStartYear: null, frequency: "eventual", activities: [], otherActivityDescription: "", expectations: "",
  discoverySource: "", previousVolunteering: null, communicationChannels: [], projectIdea: "", imageUseAuthorized: null,
  afapanStory: "", guardianName: "", guardianPhone: "", guardianAuthorized: false,
  privacyAccepted: true, participationAccepted: true,
}

export function VolunteerFormDialog({ open, onOpenChange, volunteer, onSave, saving = false }: Props) {
  const [value, setValue] = useState<VolunteerInput>(empty)
  const [status, setStatus] = useState<VolunteerStatus>("ativo")
  const [start, setStart] = useState("")
  const [error, setError] = useState<string | null>(null)
  const minor = useMemo(() => Boolean(value.birthDate && isMinor(value.birthDate)), [value.birthDate])

  useEffect(() => {
    if (!open) return
    setValue(volunteer ? { ...volunteer, birthDate: isoDateToBrazilian(volunteer.birthDate) } : empty)
    setStatus(volunteer?.status || "ativo")
    setStart(volunteer?.activityStartMonth && volunteer.activityStartYear ? `${String(volunteer.activityStartMonth).padStart(2, "0")}/${volunteer.activityStartYear}` : "")
    setError(null)
  }, [open, volunteer])

  const update = <K extends keyof VolunteerInput>(field: K, next: VolunteerInput[K]) => setValue((current) => ({ ...current, [field]: next }))
  const toggleActivity = (activity: VolunteerActivity, checked: boolean) => update("activities", checked ? [...value.activities, activity] : value.activities.filter((item) => item !== activity))
  const toggleChannel = (channel: VolunteerCommunicationChannel, checked: boolean) => {
    const current = value.communicationChannels || []
    update("communicationChannels", checked ? [...current, channel] : current.filter((item) => item !== channel))
  }
  const updateStart = (input: string) => {
    const masked = maskMonthYear(input)
    setStart(masked)
    const parsed = parseMonthYear(masked)
    update("activityStartMonth", parsed.month)
    update("activityStartYear", parsed.year)
  }
  const save = async () => {
    const errors = validateVolunteerInput(value)
    if (errors.length) { setError(errors[0].message); return }
    if (await onSave({ ...value, status })) onOpenChange(false)
  }

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto"><DialogHeader><DialogTitle>{volunteer ? "Editar voluntário" : "Cadastrar voluntário"}</DialogTitle><DialogDescription>Cadastro assistido pela equipe da AFAPAN.</DialogDescription></DialogHeader><div className="space-y-6 py-2">
    <section className="space-y-3"><h3 className="font-semibold">Identificação e contato</h3><div className="grid gap-4 sm:grid-cols-2">
      <div><Label>Nome *</Label><Input value={value.firstName} onChange={(event) => update("firstName", event.target.value)} /></div><div><Label>Sobrenome *</Label><Input value={value.lastName} onChange={(event) => update("lastName", event.target.value)} /></div>
      <div><Label>Data de nascimento *</Label><Input inputMode="numeric" placeholder="dd/mm/aaaa" maxLength={10} value={value.birthDate} onChange={(event) => update("birthDate", maskBrazilianDate(event.target.value))} /></div><div><Label>Telefone *</Label><Input value={value.phone} onChange={(event) => update("phone", event.target.value)} /></div>
      <div><Label>E-mail</Label><Input value={value.email} onChange={(event) => update("email", event.target.value)} /></div><div><Label>Início na AFAPAN</Label><Input inputMode="numeric" placeholder="MM/AAAA" maxLength={7} value={start} onChange={(event) => updateStart(event.target.value)} /></div>
    </div></section>
    <section className="space-y-3"><h3 className="font-semibold">Endereço</h3><div className="grid gap-4 sm:grid-cols-2"><div><Label>Bairro *</Label><Input value={value.neighborhood} onChange={(event) => update("neighborhood", event.target.value)} /></div><div><Label>Cidade *</Label><Input value={value.city} onChange={(event) => update("city", event.target.value)} /></div><div><Label>Rua</Label><Input value={value.street} onChange={(event) => update("street", event.target.value)} /></div><div><Label>Número</Label><Input value={value.number} onChange={(event) => update("number", event.target.value)} /></div><div><Label>Complemento</Label><Input value={value.complement} onChange={(event) => update("complement", event.target.value)} /></div><div><Label>Estado</Label><Input value={value.state} onChange={(event) => update("state", event.target.value)} /></div></div></section>
    <section className="space-y-3"><h3 className="font-semibold">Perfil e disponibilidade</h3><div className="grid gap-4 sm:grid-cols-2"><div><Label>Profissão</Label><Input value={value.profession} onChange={(event) => update("profession", event.target.value)} /></div><div><Label>Habilidades</Label><Textarea value={value.skills} onChange={(event) => update("skills", event.target.value)} /></div><div><Label>Frequência *</Label><Select value={value.frequency} onValueChange={(next: VolunteerFrequency) => update("frequency", next)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{VOLUNTEER_FREQUENCIES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div><div><Label>Situação</Label><Select value={status} onValueChange={(next: VolunteerStatus) => setStatus(next)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="aguardando_validacao">Aguardando validação</SelectItem><SelectItem value="ativo">Ativo</SelectItem><SelectItem value="sem_confirmacao">Sem confirmação</SelectItem><SelectItem value="inativo">Inativo</SelectItem></SelectContent></Select></div></div>
      <fieldset><legend className="mb-2 font-medium">Atividades de interesse *</legend><div className="grid gap-2 sm:grid-cols-2">{VOLUNTEER_ACTIVITIES.map((item) => <label key={item.value} className="flex gap-2 rounded border p-2"><input type="checkbox" checked={value.activities.includes(item.value)} onChange={(event) => toggleActivity(item.value, event.target.checked)} />{item.label}</label>)}</div></fieldset>{value.activities.includes("outras") && <div><Label>Outras atividades *</Label><Textarea value={value.otherActivityDescription} onChange={(event) => update("otherActivityDescription", event.target.value)} /></div>}
    </section>
    <section className="space-y-3"><h3 className="font-semibold">Informações opcionais</h3><div className="grid gap-4 sm:grid-cols-2"><div><Label>O que espera da AFAPAN?</Label><Textarea value={value.expectations} onChange={(event) => update("expectations", event.target.value)} /></div><div><Label>Como conheceu a AFAPAN?</Label><Textarea value={value.discoverySource} onChange={(event) => update("discoverySource", event.target.value)} /></div><div><Label>Experiência anterior de voluntariado</Label><Select value={value.previousVolunteering || "nao_informado"} onValueChange={(next) => update("previousVolunteering", next === "nao_informado" ? null : next as VolunteerInput["previousVolunteering"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="nao_informado">Não informado</SelectItem>{PREVIOUS_VOLUNTEERING_OPTIONS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div><div><Label>Uso de imagem</Label><Select value={value.imageUseAuthorized == null ? "nao_informado" : value.imageUseAuthorized ? "sim" : "nao"} onValueChange={(next) => update("imageUseAuthorized", next === "nao_informado" ? null : next === "sim")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="nao_informado">Não informado</SelectItem><SelectItem value="sim">Autorizado</SelectItem><SelectItem value="nao">Não autorizado</SelectItem></SelectContent></Select></div></div>
      <fieldset><legend className="mb-2 font-medium">Canais pelos quais acompanha a AFAPAN</legend><div className="grid gap-2 sm:grid-cols-2">{VOLUNTEER_COMMUNICATION_CHANNELS.map((item) => <label key={item.value} className="flex gap-2 rounded border p-2"><input type="checkbox" checked={(value.communicationChannels || []).includes(item.value)} onChange={(event) => toggleChannel(item.value, event.target.checked)} />{item.label}</label>)}</div></fieldset>
      <div><Label>Ideia de projeto</Label><Textarea value={value.projectIdea} onChange={(event) => update("projectIdea", event.target.value)} /></div><div><Label>História e vínculo com a AFAPAN</Label><Textarea value={value.afapanStory} onChange={(event) => update("afapanStory", event.target.value)} /></div>
    </section>
    {minor && <section className="space-y-3 rounded border border-amber-300 bg-amber-50 p-4"><h3 className="font-semibold">Responsável pelo menor</h3><div className="grid gap-4 sm:grid-cols-2"><div><Label>Nome *</Label><Input value={value.guardianName} onChange={(event) => update("guardianName", event.target.value)} /></div><div><Label>Telefone *</Label><Input value={value.guardianPhone} onChange={(event) => update("guardianPhone", event.target.value)} /></div></div><label className="flex gap-2"><input type="checkbox" checked={Boolean(value.guardianAuthorized)} onChange={(event) => update("guardianAuthorized", event.target.checked)} />Autorização confirmada</label></section>}
    {error && <p className="text-sm text-destructive">{error}</p>}
  </div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button><Button onClick={() => void save()} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button></DialogFooter></DialogContent></Dialog>
}

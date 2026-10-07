"use client"

import Image from "next/image"
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
  AFAPAN_CONTACT_EMAIL,
  AFAPAN_CONTACT_WHATSAPP,
  PREVIOUS_VOLUNTEERING_OPTIONS,
  VOLUNTEER_ACTIVITIES,
  VOLUNTEER_COMMUNICATION_CHANNELS,
  VOLUNTEER_FREQUENCIES,
  getBirthDateValidationError,
  getEmailValidationError,
  isMinor,
  maskBrazilianDate,
  maskBrazilianPhone,
  maskMonthYear,
  parseMonthYear,
  validateVolunteerInput,
  type VolunteerActivity,
  type VolunteerCommunicationChannel,
  type VolunteerFrequency,
  type VolunteerInput,
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
  activityStartYear: null, frequency: "eventual", activities: [], otherActivityDescription: "", expectations: "",
  discoverySource: "", previousVolunteering: null, communicationChannels: [], projectIdea: "", imageUseAuthorized: null,
  afapanStory: "", guardianName: "", guardianPhone: "", guardianAuthorized: false,
  privacyAccepted: false, participationAccepted: false,
}

function CheckOption({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm hover:bg-muted/50"><input type="checkbox" className="mt-1 h-4 w-4 accent-primary" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span>{label}</span></label>
}

export function VolunteerPublicForm({ campaign }: { campaign: CampaignData }) {
  const [value, setValue] = useState<VolunteerInput>(initialValue)
  const [website, setWebsite] = useState("")
  const [startMonth, setStartMonth] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [birthDateError, setBirthDateError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [invalidFields, setInvalidFields] = useState<string[]>([])
  const minor = useMemo(() => Boolean(value.birthDate && isMinor(value.birthDate)), [value.birthDate])
  const allActivitiesSelected = VOLUNTEER_ACTIVITIES.every((item) => value.activities.includes(item.value))

  const update = <K extends keyof VolunteerInput>(field: K, next: VolunteerInput[K]) => {
    setValue((current) => ({ ...current, [field]: next }))
    setError(null)
    setInvalidFields((fields) => fields.filter((item) => item !== field))
  }

  const toggleActivity = (item: VolunteerActivity, checked: boolean) => update("activities", checked ? [...value.activities, item] : value.activities.filter((current) => current !== item))
  const toggleAllActivities = (checked: boolean) => update("activities", checked ? VOLUNTEER_ACTIVITIES.map((item) => item.value) : [])
  const toggleChannel = (item: VolunteerCommunicationChannel, checked: boolean) => {
    const channels = value.communicationChannels || []
    update("communicationChannels", checked ? [...channels, item] : channels.filter((current) => current !== item))
  }

  const handleStartMonth = (next: string) => {
    const masked = maskMonthYear(next)
    setStartMonth(masked)
    const parsed = parseMonthYear(masked)
    update("activityStartMonth", parsed.month)
    update("activityStartYear", parsed.year)
  }

  const validateBirthDate = (birthDate: string) => {
    const validationError = getBirthDateValidationError(birthDate)
    setBirthDateError(validationError)
    setInvalidFields((fields) => validationError ? Array.from(new Set([...fields, "birthDate"])) : fields.filter((item) => item !== "birthDate"))
  }

  const handleBirthDate = (next: string) => {
    const masked = maskBrazilianDate(next)
    update("birthDate", masked)
    if (masked.length === 10) validateBirthDate(masked)
    else setBirthDateError(null)
  }

  const validateEmail = (email: string) => {
    const validationError = getEmailValidationError(email)
    setEmailError(validationError)
    setInvalidFields((fields) => validationError ? Array.from(new Set([...fields, "email"])) : fields.filter((item) => item !== "email"))
  }

  const handleEmail = (next: string) => {
    update("email", next)
    if (emailError || !next.trim()) validateEmail(next)
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ website, ...value }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(result?.error || "Não foi possível enviar o cadastro.")
      setSubmitted(true)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível enviar o cadastro.")
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) return <Card className="w-full max-w-2xl"><CardContent className="space-y-4 py-10 text-center"><CheckCircle2 className="mx-auto h-12 w-12 text-green-600" /><h1 className="text-2xl font-bold">Cadastro recebido!</h1><p className="text-muted-foreground">A AFAPAN fará a validação dos seus dados antes de confirmar sua participação como voluntário(a).</p></CardContent></Card>

  return <Card className="w-full max-w-4xl overflow-hidden py-0 shadow-lg">
    <CardHeader className="relative flex min-h-28 items-center justify-center border-b bg-primary px-16 py-6 text-center text-primary-foreground">
      <HeartHandshake className="absolute left-5 h-8 w-8 sm:left-8" aria-hidden="true" />
      <div className="flex flex-col items-center justify-center gap-2"><CardTitle className="text-2xl">Voluntariado AFAPAN</CardTitle><CardDescription className="text-center text-primary-foreground/80">{campaign.name} · Responda até {new Date(campaign.deadline).toLocaleDateString("pt-BR")}</CardDescription></div>
    </CardHeader>
    <div className="relative aspect-[4/3] w-full bg-muted sm:aspect-[16/7]"><Image src="/voluntarios-afapan-rosto-crianca-desfocado.png" alt="Voluntários da AFAPAN reunidos" fill priority sizes="(max-width: 896px) 100vw, 896px" className="object-cover object-center" /></div>
    <CardContent className="p-5 sm:p-8">
      <div className="mb-8 space-y-3 rounded-xl bg-green-50 p-5 text-green-950">
        <h2 className="text-xl font-semibold">Que bom ter você por aqui! 💚</h2>
        <p>A AFAPAN é uma associação sem fins lucrativos que conta com pessoas voluntárias para cuidar do nosso ambiente e fortalecer ações em Farroupilha.</p>
        <p>Queremos conhecer você um pouco melhor e entender como gostaria de colaborar. O formulário é simples e rápido de preencher.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-7 [&_[data-slot=label]]:mb-2" noValidate>
        <div className="absolute -left-[10000px]" aria-hidden="true"><Label htmlFor="website">Site</Label><Input id="website" tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} /></div>

        <section className="space-y-4"><div><h2 className="text-xl font-semibold">Seus dados</h2><p className="text-sm text-muted-foreground">Campos marcados com * são obrigatórios.</p></div><div className="grid gap-4 sm:grid-cols-2">
          <div><Label className="font-bold" htmlFor="firstName">Nome *</Label><Input id="firstName" autoComplete="given-name" value={value.firstName} onChange={(event) => update("firstName", event.target.value)} aria-invalid={invalidFields.includes("firstName")} /></div>
          <div><Label className="font-bold" htmlFor="lastName">Sobrenome *</Label><Input id="lastName" autoComplete="family-name" value={value.lastName} onChange={(event) => update("lastName", event.target.value)} aria-invalid={invalidFields.includes("lastName")} /></div>
          <div><Label className="font-bold" htmlFor="birthDate">Data de nascimento *</Label><Input id="birthDate" inputMode="numeric" placeholder="dd/mm/aaaa" maxLength={10} value={value.birthDate} onChange={(event) => handleBirthDate(event.target.value)} onBlur={() => validateBirthDate(value.birthDate)} aria-invalid={Boolean(birthDateError) || invalidFields.includes("birthDate")} aria-describedby={birthDateError ? "birthDate-error" : undefined} />{birthDateError && <p id="birthDate-error" role="alert" className="mt-2 text-sm text-destructive">{birthDateError}</p>}</div>
          <div><Label className="font-bold" htmlFor="phone">Telefone com WhatsApp *</Label><Input id="phone" inputMode="tel" autoComplete="tel" placeholder="(54) 99999-9999" maxLength={15} value={value.phone} onChange={(event) => update("phone", maskBrazilianPhone(event.target.value))} aria-invalid={invalidFields.includes("phone")} /></div>
          <div><Label htmlFor="email">E-mail</Label><Input id="email" type="email" autoComplete="email" value={value.email} onChange={(event) => handleEmail(event.target.value)} onBlur={() => validateEmail(value.email || "")} aria-invalid={Boolean(emailError)} aria-describedby={emailError ? "email-error" : undefined} />{emailError && <p id="email-error" role="alert" className="mt-2 text-sm text-destructive">{emailError}</p>}</div>
          <div><Label htmlFor="activityStart">Início das atividades na AFAPAN</Label><Input id="activityStart" inputMode="numeric" placeholder="MM/AAAA" maxLength={7} value={startMonth} onChange={(event) => handleStartMonth(event.target.value)} aria-invalid={invalidFields.includes("activityStartMonth")} /></div>
        </div></section>

        <section className="space-y-4 border-t pt-6"><h2 className="text-xl font-semibold">Endereço</h2><div className="grid gap-4 sm:grid-cols-2">
          <div><Label className="font-bold" htmlFor="neighborhood">Bairro *</Label><Input id="neighborhood" value={value.neighborhood} onChange={(event) => update("neighborhood", event.target.value)} aria-invalid={invalidFields.includes("neighborhood")} /></div>
          <div><Label className="font-bold" htmlFor="city">Cidade *</Label><Input id="city" value={value.city} onChange={(event) => update("city", event.target.value)} aria-invalid={invalidFields.includes("city")} /></div>
          <div><Label htmlFor="street">Rua</Label><Input id="street" value={value.street} onChange={(event) => update("street", event.target.value)} /></div>
          <div><Label htmlFor="number">Número</Label><Input id="number" value={value.number} onChange={(event) => update("number", event.target.value)} /></div>
          <div><Label htmlFor="complement">Complemento</Label><Input id="complement" value={value.complement} onChange={(event) => update("complement", event.target.value)} /></div>
          <div><Label htmlFor="state">Estado</Label><Input id="state" value={value.state} onChange={(event) => update("state", event.target.value)} /></div>
        </div></section>

        <section className="space-y-4 border-t pt-6"><h2 className="text-xl font-semibold">Como você gostaria de contribuir?</h2><div className="grid gap-4 sm:grid-cols-2">
          <div><Label htmlFor="profession">Profissão</Label><Input id="profession" value={value.profession} onChange={(event) => update("profession", event.target.value)} /></div>
          <div><Label htmlFor="skills">Habilidades e experiências</Label><Textarea id="skills" value={value.skills} onChange={(event) => update("skills", event.target.value)} /></div>
        </div><fieldset><legend className="mb-3 font-bold">Atividades de interesse *</legend><div className="mb-3"><CheckOption label="Marcar todas as atividades" checked={allActivitiesSelected} onChange={toggleAllActivities} /></div><div id="activities" tabIndex={-1} className="grid gap-2 sm:grid-cols-2">{VOLUNTEER_ACTIVITIES.map((item) => <CheckOption key={item.value} label={item.label} checked={value.activities.includes(item.value)} onChange={(checked) => toggleActivity(item.value, checked)} />)}</div></fieldset>{value.activities.includes("outras") && <div><Label htmlFor="otherActivityDescription">Quais outras atividades?</Label><Textarea id="otherActivityDescription" value={value.otherActivityDescription} onChange={(event) => update("otherActivityDescription", event.target.value)} /></div>}</section>

        <section className="space-y-4 border-t pt-6"><h2 className="text-xl font-semibold">Disponibilidade</h2><div><Label className="font-bold" htmlFor="frequency">Com que frequência você poderia participar? *</Label><Select value={value.frequency} onValueChange={(next: VolunteerFrequency) => update("frequency", next)}><SelectTrigger id="frequency"><SelectValue /></SelectTrigger><SelectContent>{VOLUNTEER_FREQUENCIES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div></section>

        <section className="space-y-4 border-t pt-6"><div><h2 className="text-xl font-semibold">Conte um pouco mais sobre você</h2></div>
          <div><Label htmlFor="expectations">O que você espera da AFAPAN?</Label><Textarea id="expectations" value={value.expectations} onChange={(event) => update("expectations", event.target.value)} /></div>
          <div><Label htmlFor="discoverySource">Como você conheceu a AFAPAN?</Label><Textarea id="discoverySource" value={value.discoverySource} onChange={(event) => update("discoverySource", event.target.value)} /></div>
          <div><Label htmlFor="previousVolunteering">Você é ou já foi voluntário(a) em outra instituição?</Label><Select value={value.previousVolunteering || "nao_informado"} onValueChange={(next) => update("previousVolunteering", next === "nao_informado" ? null : next as VolunteerInput["previousVolunteering"])}><SelectTrigger id="previousVolunteering"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="nao_informado">Prefiro não responder</SelectItem>{PREVIOUS_VOLUNTEERING_OPTIONS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div>
          <fieldset><legend className="mb-2 font-medium">Por onde você acompanha a AFAPAN?</legend><div className="grid gap-2 sm:grid-cols-2">{VOLUNTEER_COMMUNICATION_CHANNELS.map((item) => <CheckOption key={item.value} label={item.label} checked={(value.communicationChannels || []).includes(item.value)} onChange={(checked) => toggleChannel(item.value, checked)} />)}</div></fieldset>
          <div><Label htmlFor="projectIdea">Tem algum projeto que gostaria de criar ou desenvolver na AFAPAN?</Label><Textarea id="projectIdea" value={value.projectIdea} onChange={(event) => update("projectIdea", event.target.value)} /></div>
          <div><Label htmlFor="afapanStory">Conte um pouco da sua história e do seu vínculo com a AFAPAN</Label><Textarea id="afapanStory" value={value.afapanStory} onChange={(event) => update("afapanStory", event.target.value)} /></div>
          <div><Label htmlFor="imageUseAuthorized">Você autoriza o uso da sua imagem em divulgações da AFAPAN?</Label><Select value={value.imageUseAuthorized == null ? "nao_informado" : value.imageUseAuthorized ? "sim" : "nao"} onValueChange={(next) => update("imageUseAuthorized", next === "nao_informado" ? null : next === "sim")}><SelectTrigger id="imageUseAuthorized"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="nao_informado">Prefiro não responder</SelectItem><SelectItem value="sim">Autorizo</SelectItem><SelectItem value="nao">Não autorizo</SelectItem></SelectContent></Select></div>
        </section>

        {minor && <section className="space-y-4 rounded-lg border border-amber-300 bg-amber-50 p-4"><h2 className="text-xl font-semibold">Responsável pelo menor</h2><div className="grid gap-4 sm:grid-cols-2"><div><Label className="font-bold" htmlFor="guardianName">Nome do responsável *</Label><Input id="guardianName" value={value.guardianName} onChange={(event) => update("guardianName", event.target.value)} /></div><div><Label className="font-bold" htmlFor="guardianPhone">Telefone do responsável *</Label><Input id="guardianPhone" inputMode="tel" maxLength={15} value={value.guardianPhone} onChange={(event) => update("guardianPhone", maskBrazilianPhone(event.target.value))} /></div></div><CheckOption label="Declaro que o responsável autoriza a participação do menor nas atividades de voluntariado da AFAPAN." checked={Boolean(value.guardianAuthorized)} onChange={(checked) => update("guardianAuthorized", checked)} /></section>}

        <section className="space-y-3 border-t pt-6"><h2 className="text-xl font-semibold">Confirmações</h2><CheckOption label={campaign.privacyText} checked={value.privacyAccepted} onChange={(checked) => update("privacyAccepted", checked)} /><CheckOption label={campaign.participationText} checked={value.participationAccepted} onChange={(checked) => update("participationAccepted", checked)} /></section>
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        <Button type="submit" size="lg" className="w-full text-base" disabled={submitting}>{submitting ? "Enviando..." : "Enviar cadastro"}</Button>
        <p className="text-center text-sm text-muted-foreground">Precisa corrigir um cadastro? WhatsApp {AFAPAN_CONTACT_WHATSAPP} · {AFAPAN_CONTACT_EMAIL}</p>
      </form>
    </CardContent>
  </Card>
}

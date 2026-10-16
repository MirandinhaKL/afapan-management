"use client"

import { useEffect, useState } from "react"
import { CalendarDays, Clock, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchVolunteerStatistics, type VolunteerStatistics } from "@/lib/volunteer-statistics"
import { getVolunteerStatisticsYear } from "@/lib/volunteer-statistics-year"

type Result = { key: string; data?: VolunteerStatistics; error?: string }
export function VolunteerStatisticsCards({ revision = 0 }: { revision?: number }) {
  const [year, setYear] = useState(() => getVolunteerStatisticsYear())
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const key = `${revision}/${attempt}/${year}`
  useEffect(() => {
    let obsolete = false
    void fetchVolunteerStatistics(year).then(data => {
      if (!obsolete) setResult({ key, data })
    }).catch(error => {
      if (!obsolete) setResult({ key, error: error instanceof Error ? error.message : "Não foi possível carregar os indicadores." })
    })
    return () => { obsolete = true }
  }, [key, year])
  useEffect(() => {
    const checkYear = () => setYear(getVolunteerStatisticsYear())
    const onVisible = () => { if (document.visibilityState === "visible") checkYear() }
    const timer = setInterval(checkYear, 60_000)
    document.addEventListener("visibilitychange", onVisible)
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", onVisible) }
  }, [])
  const current = result?.key === key ? result : null
  const data = current?.data
  const loading = !current
  const cards = [
    { title: "Ativos", value: data?.active, note: "Voluntários não arquivados", Icon: Users },
    { title: "Aguardando validação", value: data?.awaitingValidation, note: "Cadastros não arquivados", Icon: Clock },
    { title: `Novos voluntários em ${year}`, value: data?.startedThisYear, note: "Início das atividades na AFAPAN no ano · Não arquivados", Icon: CalendarDays },
  ]
  return <section aria-label="Indicadores de voluntários" aria-busy={loading} className="space-y-3">
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {cards.map(({ title, value, note, Icon }) => <Card key={title}>
        <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">{title}</CardTitle><Icon size={16} className="text-muted-foreground" aria-hidden="true" /></CardHeader>
        <CardContent>{loading ? <Skeleton className="mb-1 h-8 w-16" aria-label={`Carregando ${title}`} /> : <p className="text-2xl font-bold">{current?.error ? "Indisponível" : value?.toLocaleString("pt-BR")}</p>}<p className="text-xs text-muted-foreground">{note}</p></CardContent>
      </Card>)}
    </div>
    {current?.error && <div className="flex flex-wrap items-center gap-3"><p role="alert" className="text-sm text-destructive">{current.error}</p><Button variant="outline" onClick={() => setAttempt(value => value + 1)}>Tentar novamente os indicadores</Button></div>}
    <p role="status" aria-label="Estado dos indicadores" aria-live="polite" className="sr-only">{loading ? "Carregando indicadores de voluntários." : data ? "Indicadores de voluntários atualizados." : "Indicadores indisponíveis."}</p>
  </section>
}

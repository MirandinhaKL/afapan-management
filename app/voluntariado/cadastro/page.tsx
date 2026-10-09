"use client"

import { useEffect, useState } from "react"
import { AlertTriangle } from "lucide-react"
import { VolunteerPublicForm } from "@/components/volunteer-public-form"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { fetchVolunteerFormSettings, type VolunteerFormSettings } from "@/lib/volunteer-registration"

export default function VolunteerRegistrationPage() {
  const [configuration, setConfiguration] = useState<VolunteerFormSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadAttempt, setLoadAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchVolunteerFormSettings()
      .then((settings) => { if (!cancelled) setConfiguration(settings) })
      .catch(() => { if (!cancelled) setError("Não foi possível carregar o formulário. Tente novamente.") })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [loadAttempt])

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-green-50 p-4"><Spinner className="h-10 w-10" /></main>
  if (error || !configuration) return <main className="flex min-h-screen items-center justify-center bg-green-50 p-4"><Card className="max-w-md"><CardContent className="space-y-3 py-8 text-center"><AlertTriangle className="mx-auto h-10 w-10 text-amber-600" /><h1 className="text-xl font-bold">Não foi possível carregar o formulário</h1><p className="text-muted-foreground" role="alert">{error || "Tente novamente em alguns instantes."}</p><Button onClick={() => setLoadAttempt((current) => current + 1)}>Tentar novamente</Button></CardContent></Card></main>
  return <main className="flex min-h-screen justify-center bg-green-50 p-3 py-8 sm:p-8"><VolunteerPublicForm configuration={configuration} /></main>
}

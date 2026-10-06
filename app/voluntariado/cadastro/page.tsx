"use client"

import { useEffect, useState } from "react"
import { AlertTriangle } from "lucide-react"
import { VolunteerPublicForm } from "@/components/volunteer-public-form"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"

interface CampaignData {
  name: string
  deadline: string
  privacyText: string
  participationText: string
}

export default function VolunteerRegistrationPage() {
  const [campaign, setCampaign] = useState<CampaignData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/volunteers/campaign/active")
      .then(async (response) => {
        const result = await response.json().catch(() => null)
        if (!response.ok) throw new Error(result?.error || "Formulário indisponível.")
        setCampaign(result)
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Formulário indisponível."))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-green-50 p-4"><Spinner className="h-10 w-10" /></main>
  if (error || !campaign) return <main className="flex min-h-screen items-center justify-center bg-green-50 p-4"><Card className="max-w-md"><CardContent className="space-y-3 py-8 text-center"><AlertTriangle className="mx-auto h-10 w-10 text-amber-600" /><h1 className="text-xl font-bold">Formulário indisponível</h1><p className="text-muted-foreground">{error || "Este formulário não está disponível no momento."}</p></CardContent></Card></main>
  return <main className="flex min-h-screen justify-center bg-green-50 p-3 py-8 sm:p-8"><VolunteerPublicForm campaign={campaign} /></main>
}

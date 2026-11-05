import type { Metadata } from "next"
import { ConectaApplicationForm } from "@/components/conecta-application-form"

export const metadata: Metadata = { title: "Registrar atividade | Conecta AFAPAN" }
export default function ConectaActivitiesPage() {
  return <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
    <header className="space-y-2">
      <p className="text-sm font-semibold text-primary">Conecta AFAPAN</p>
      <h1 className="text-3xl font-bold">Registre sua atividade voluntária</h1>
      <p className="text-muted-foreground">Informe as tarefas realizadas e anexe os comprovantes. A equipe da AFAPAN vai analisar o pedido antes de reconhecer as horas.</p>
    </header>
    <ConectaApplicationForm />
  </main>
}

import type { Metadata } from "next"
import Image from "next/image"
import { ConectaApplicationForm } from "@/components/conecta-application-form"

export const metadata: Metadata = { title: "Registrar atividade | Conecta AFAPAN" }
export default function ConectaActivitiesPage() {
  return <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
    <header className="space-y-4">
      <p className="text-center text-sm font-semibold text-primary">Conecta AFAPAN</p>
      <div className="flex items-start gap-4 sm:gap-5">
        <Image
          src="/afapan-favicon-master.png"
          alt="Logotipo da AFAPAN"
          width={64}
          height={64}
          className="h-12 w-12 shrink-0 object-contain sm:h-20 sm:w-20"
          priority
        />
      <div className="min-w-0 space-y-2">
      <h1 className="text-3xl font-bold">Registre sua atividade voluntária</h1>
      <p className="text-muted-foreground">Informe as tarefas realizadas e anexe os comprovantes. A equipe da AFAPAN vai analisar o pedido antes de reconhecer as horas.</p>
      </div>
      </div>
    </header>
    <ConectaApplicationForm />
  </main>
}

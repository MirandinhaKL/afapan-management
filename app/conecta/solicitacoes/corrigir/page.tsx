import type { Metadata } from "next"
import { ConectaCorrectionForm } from "@/components/conecta-correction-form"

export const metadata: Metadata = { title: "Corrigir solicitação | Conecta AFAPAN", referrer: "no-referrer", robots: { index: false, follow: false } }
export default function ConectaCorrectionPage() {
  return <main className="mx-auto max-w-3xl space-y-4 px-4 py-8"><h1 className="text-2xl font-bold">Corrigir solicitação</h1><ConectaCorrectionForm /></main>
}

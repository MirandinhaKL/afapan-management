import { NextResponse } from "next/server"

export async function GET() {
  // Compatibility response for already-open old pages; never executes expiration.
  return NextResponse.json({
    error: "O cadastro agora está disponível continuamente. Atualize a página para abrir o formulário.",
  }, { status: 410, headers: { "Cache-Control": "no-store" } })
}

import { createHash, createHmac } from "node:crypto"
import { NextResponse } from "next/server"

export const conectaBucket = "conecta-documents"
export const sha256 = (value: string) => createHash("sha256").update(value).digest("hex")
export function correctionToken(id: string) {
  const secret = process.env.CONECTA_FORM_SECRET
  if (!secret || secret.length < 32) throw new Error("Configuração indisponível")
  return createHmac("sha256", secret).update(`correction:${id}`).digest("hex")
}
export const conectaResponse = (body: object, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } })
export async function readSmallJson(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) throw new Error("Formato inválido")
  const reader = request.body?.getReader()
  if (!reader) throw new Error("Dados ausentes")
  const decoder = new TextDecoder("utf-8", { fatal: true })
  let content = "", total = 0
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      total += value.length
      if (total > 64 * 1024) throw new Error("Dados acima do limite")
      content += decoder.decode(value, { stream: true })
    }
    return JSON.parse(content + decoder.decode()) as unknown
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock() }
}

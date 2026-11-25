import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto"
import { z } from "zod"
import { conectaInternalSession } from "@/lib/conecta/internal-server"
import { createSupabaseServiceClient } from "@/lib/supabase-server"
import { maxImportBytes, parseImport, type ImportResult } from "@/lib/compostagem-importacao"

const confirmation = z.object({
  turma: z.string().uuid(),
  ddds: z.record(z.string()).default({}),
  comprovante: z.string().nullable().default(null),
  revisouSemTelefone: z.boolean().default(false),
})
const classification = z.object({
  linha: z.number(),
  acao: z.enum(["novo", "vincular", "importado", "pendente"]),
  motivo: z.string().nullable(),
  participante: z.string().nullable(),
  vinculo: z.string().nullable(),
})
const receipt = z.object({
  usuario: z.string(),
  turma: z.string(),
  arquivo: z.string(),
  expira: z.number(),
  confirmadas: z.record(classification),
})

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } })
}

function key(purpose: string) {
  const secret = process.env.COMPOSTAGEM_IMPORT_SECRET
  if (!secret) throw new Error("Configuração de servidor indisponível.")
  return createHmac("sha256", secret).update(purpose).digest()
}

function signature(value: string) {
  return createHmac("sha256", key("compostagem-importacao-assinatura")).update(value).digest("hex")
}

function seal(value: z.infer<typeof receipt>) {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key("compostagem-importacao-previa"), iv)
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url")
}

function open(value: string) {
  try {
    const bytes = Buffer.from(value, "base64url")
    const decipher = createDecipheriv("aes-256-gcm", key("compostagem-importacao-previa"), bytes.subarray(0, 12))
    decipher.setAuthTag(bytes.subarray(12, 28))
    const decoded = Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()])
    return receipt.parse(JSON.parse(decoded.toString("utf8")))
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  try {
    const session = await conectaInternalSession(request)
    if (!session) return json({ erro: "Sessão inválida." }, 401)

    const db = createSupabaseServiceClient()
    const grant = await db.from("compostagem_importadores").select("usuario_id").eq("usuario_id", session.userId).maybeSingle()
    if (grant.error) throw grant.error
    if (!grant.data) return json({ erro: "Sem permissão para importar participantes." }, 403)

    const limit = maxImportBytes + 512 * 1024
    const reader = request.body?.getReader()
    if (!reader) return json({ erro: "Envie um arquivo CSV." }, 400)
    const parts: Uint8Array[] = []
    let size = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > limit) {
        await reader.cancel()
        return json({ erro: "Arquivo acima do tamanho permitido." }, 413)
      }
      parts.push(value)
    }
    let form: FormData
    try {
      form = await new Response(Buffer.concat(parts), {
        headers: { "Content-Type": request.headers.get("content-type") ?? "" },
      }).formData()
    } catch {
      return json({ erro: "Envio inválido." }, 400)
    }
    const file = form.get("arquivo")
    if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".csv")) {
      return json({ erro: "Envie um arquivo CSV." }, 400)
    }
    if (file.size > maxImportBytes) return json({ erro: "O CSV pode ter até 1 MiB." }, 413)
    let config: z.infer<typeof confirmation>
    let rows: ReturnType<typeof parseImport>
    let csv: string
    try {
      config = confirmation.parse(JSON.parse(String(form.get("opcoes"))))
      csv = new TextDecoder("utf-8", { fatal: true }).decode(await file.arrayBuffer())
    } catch {
      return json({ erro: "Selecione uma turma válida e envie um CSV em UTF-8." }, 400)
    }
    const historico = process.env.COMPOSTAGEM_IMPORT_HISTORICO === "true"
    try {
      rows = parseImport(csv, config.ddds, historico)
    } catch (error) {
      return json({ erro: (error as Error).message }, 400)
    }
    const arquivo = signature(JSON.stringify([csv, Object.entries(config.ddds).sort(), historico]))
    const previous = config.comprovante ? open(config.comprovante) : null
    if (config.comprovante && (!previous || previous.usuario !== session.userId || previous.turma !== config.turma ||
      previous.arquivo !== arquivo || previous.expira <= Date.now())) {
      return json({ erro: "Gere uma nova prévia antes de confirmar." }, 409)
    }
    const valid = rows.filter(row => !row.errors.length).map(({ data }) => {
      const { linha, ...fields } = data
      return { linha, ...fields, assinatura: signature(JSON.stringify(fields)) }
    })
    const semTelefone = new Set(valid.filter(row => !row.email && !row.telefone).map(row => row.linha))
    const requerRevisaoSemTelefone = [...semTelefone].some(linha => previous?.confirmadas[linha]?.acao === "novo")
    if (requerRevisaoSemTelefone && !config.revisouSemTelefone) {
      return json({ erro: "Revise os novos cadastros sem e-mail e telefone antes de confirmar." }, 400)
    }
    const { data, error } = await db.rpc("processar_importacao_compostagem", {
      p_usuario: session.userId, p_turma: config.turma, p_linhas: valid, p_confirmadas: previous?.confirmadas ?? null,
    })
    if (error) throw error
    if (data.proibido) return json({ erro: "Sem permissão para importar participantes." }, 403)
    if (data.turmaAusente) return json({ erro: "Turma não encontrada." }, 404)
    const classified = classification.array().parse(data.linhas)
    const byLine = new Map(classified.map(item => [item.linha, item]))
    const gravado = Boolean(previous && !data.mudou)
    const result: ImportResult = {
      historico,
      requerRevisaoSemTelefone: classified.some(item => item.acao === "novo" && semTelefone.has(item.linha)),
      linhas: rows.map(({ data: row, errors, aviso, local }) => {
        const item = byLine.get(row.linha)
        return {
          linha: row.linha, nome: row.nome, sobrenome: row.sobrenome, cpf: aviso,
          status: item?.acao ?? "pendente", erros: item?.motivo ? [...errors, item.motivo] : errors,
          dddSugerido: local ? "54" : null,
        }
      }),
      novosVinculos: classified.filter(item => item.acao === "novo" || (item.acao === "vincular" && !item.vinculo)).length,
      comprovante: gravado ? null : seal({
        usuario: session.userId, turma: config.turma, arquivo, expira: Date.now() + 15 * 60_000,
        confirmadas: Object.fromEntries(classified.filter(item => item.acao !== "pendente").map(item => [item.linha, item])),
      }),
      gravado,
      mudou: Boolean(data.mudou),
    }
    return json(result)
  } catch {
    return json({ erro: "Falha ao processar a importação. Tente novamente." }, 500)
  }
}

export async function GET(request: Request) {
  try {
    if (!await conectaInternalSession(request)) return json({ erro: "Sessão inválida." }, 401)
    const params = new URL(request.url).searchParams
    const ids = z.object({ turma: z.string().uuid(), participante: z.string().uuid() }).safeParse(Object.fromEntries(params))
    if (!ids.success) return json({ erro: "Inscrição inválida." }, 400)
    const db = createSupabaseServiceClient()
    const { data, error } = await db.from("compostagem_inscricoes")
      .select("cpf, participantes_turmas!inner(participante_id, turma_id)")
      .eq("participantes_turmas.participante_id", ids.data.participante)
      .eq("participantes_turmas.turma_id", ids.data.turma)
      .maybeSingle()
    if (error) throw error
    return data ? json({ cpf: data.cpf }) : json({ erro: "Inscrição importada não encontrada." }, 404)
  } catch {
    return json({ erro: "Falha ao consultar CPF." }, 500)
  }
}

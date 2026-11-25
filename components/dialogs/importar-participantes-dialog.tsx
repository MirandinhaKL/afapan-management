"use client"

import { useState } from "react"
import { CheckCircle2, Loader2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { requestCompostagemImport } from "@/lib/compostagem-importacao-client"
import type { ImportResult } from "@/lib/compostagem-importacao"

const labels = {
  novo: "Novo cadastro", vincular: "Cadastro existente", importado: "Já importado", pendente: "Pendente",
}

export function ImportarParticipantesDialog({ turmas, onImported }: {
  turmas: { id: string; nome: string }[]
  onImported: (turma: string) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [turma, setTurma] = useState("")
  const [arquivo, setArquivo] = useState<File>()
  const [ddds, setDdds] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState<ImportResult>()
  const [stale, setStale] = useState(false)
  const [revisouSemTelefone, setRevisouSemTelefone] = useState(false)
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState("")

  function reset() {
    setRevisouSemTelefone(false)
    setPreview(undefined)
    setDdds({})
    setStale(false)
    setError("")
  }

  function changeOpen(value: boolean) {
    if (busy) return
    setOpen(value)
    if (!value) {
      setTurma("")
      setArquivo(undefined)
      reset()
    }
  }

  async function submit(confirm: boolean) {
    if (!arquivo || !turma || busy) return
    setBusy(true)
    setConfirming(confirm)
    setError("")
    const form = new FormData()
    form.set("arquivo", arquivo)
    form.set("opcoes", JSON.stringify({ turma, ddds, comprovante: confirm ? preview?.comprovante : null,
      ...(revisouSemTelefone && { revisouSemTelefone }),
    }))
    try {
      const result = await requestCompostagemImport<ImportResult>("", form)
      setPreview(result)
      setRevisouSemTelefone(false)
      setStale(false)
      if (result.gravado) {
        setArquivo(undefined)
        try {
          await onImported(turma)
        } catch {
          setError("O lote foi gravado. Recarregue a página para atualizar os participantes.")
        }
      }
    } catch (failure) {
      setError((failure as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const count = (status: keyof typeof labels) => preview?.linhas.filter(row => row.status === status).length ?? 0
  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild><Button variant="outline">Importar participantes</Button></DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogTitle className="flex items-center gap-2">
          <Upload className="size-5 shrink-0" aria-hidden="true" />
          Importar participantes
        </DialogTitle>
        <DialogDescription>Selecione a turma de destino e revise as inscrições do CSV antes de gravar.</DialogDescription>
        <label className="grid gap-1 text-sm">
          Turma
          <select className="rounded-md border bg-background p-2" value={turma} disabled={busy} onChange={event => {
            setTurma(event.target.value)
            setArquivo(undefined)
            reset()
          }}>
            <option value="">Selecione uma turma</option>
            {turmas.map(item => <option key={item.id} value={item.id}>{item.nome}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Arquivo CSV
          <Input key={turma} type="file" className="file:mr-4" accept=".csv,text/csv" disabled={!turma || busy} onChange={event => {
            setArquivo(event.target.files?.[0])
            reset()
          }} />
        </label>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {busy && !preview?.gravado && (
          <p role="status" className="flex items-center gap-2 rounded-md border bg-muted p-3 text-sm">
            <Loader2 className="size-4 shrink-0 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            {confirming ? "Salvando inscrições…" : "Processando prévia…"}
          </p>
        )}
        {preview?.gravado && (
          <p role="status" className="flex items-center gap-2 rounded-md border border-green-600/30 bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
            <CheckCircle2 className="size-5 shrink-0" aria-hidden="true" />
            Importação concluída com sucesso. As linhas válidas foram salvas na turma selecionada.
          </p>
        )}
        {preview && (
          <div className="space-y-2 text-sm">
            {preview.historico && <p>Modo histórico ativo. E-mail e data da resposta podem ficar em branco.</p>}
            {preview.requerRevisaoSemTelefone && !preview.gravado && (
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={revisouSemTelefone} disabled={busy}
                  onChange={event => setRevisouSemTelefone(event.target.checked)} />
                Revisei os novos cadastros sem e-mail e telefone.
              </label>
            )}
            {preview.mudou && <p role="status">Os dados mudaram. Revise a nova prévia antes de confirmar.</p>}
            <p role="status">
              {preview.linhas.length} inscrições · {count("novo")} novos cadastros · {preview.novosVinculos} novos vínculos · {count("importado")} já importadas · {count("pendente")} pendentes
            </p>
            <ul className="max-h-64 space-y-2 overflow-y-auto">
              {preview.linhas.map(row => (
                <li key={row.linha} className="rounded-md border p-2">
                  <p className="font-medium">Linha {row.linha} · {[row.nome, row.sobrenome].filter(Boolean).join(" ")} · {labels[row.status]}</p>
                  {row.erros.map(message => <p key={message} className="text-destructive">{message}</p>)}
                  <p>CPF {row.cpf}</p>
                  {row.dddSugerido && !preview.gravado && (
                    <div className="mt-1 flex items-center gap-2">
                      <Input aria-label={`DDD da linha ${row.linha}`} className="w-24" inputMode="numeric" maxLength={2}
                        placeholder={row.dddSugerido} value={ddds[row.linha] ?? ""} disabled={busy}
                        onChange={event => {
                          const value = event.target.value
                          setDdds(current => ({ ...current, [row.linha]: value }))
                          setStale(true)
                        }} />
                      {!ddds[row.linha] && <Button size="sm" variant="outline" disabled={busy} onClick={() => {
                        setDdds(current => ({ ...current, [row.linha]: row.dddSugerido! }))
                        setStale(true)
                      }}>Usar DDD {row.dddSugerido}</Button>}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" disabled={busy} onClick={() => changeOpen(false)}>{preview?.gravado ? "Fechar" : "Cancelar"}</Button>
          <Button variant="secondary" disabled={!arquivo || !turma || busy} onClick={() => submit(false)}>
            {preview ? "Atualizar prévia" : "Gerar prévia"}
          </Button>
          <Button disabled={busy || stale || !preview?.comprovante ||
            (preview.requerRevisaoSemTelefone && !revisouSemTelefone) ||
            !preview.linhas.some(row => row.status === "novo" || row.status === "vincular")}
            onClick={() => submit(true)}>
            {busy && confirming && <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
            {busy && confirming ? "Salvando…" : "Confirmar linhas válidas"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

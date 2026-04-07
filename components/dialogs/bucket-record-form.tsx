"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"

interface BucketRecordFormProps {
  initialData?: {
    quantidade: number
    dataRegistro: string
  }
  onSubmit: (data: { quantidade: number; dataRegistro: string }) => void
  onCancel: () => void
  isLoading?: boolean
  isEditing?: boolean
}

export function BucketRecordForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  isEditing = false,
}: BucketRecordFormProps) {
  const today = new Date().toISOString().split("T")[0]
  const [quantidade, setQuantidade] = useState(
    initialData?.quantidade?.toString() || ""
  )
  const [dataRegistro, setDataRegistro] = useState(
    initialData?.dataRegistro || today
  )
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const qtd = parseInt(quantidade)
    if (!quantidade || isNaN(qtd) || qtd < 0) {
      setError("Por favor, informe uma quantidade válida de baldes")
      return
    }

    if (!dataRegistro) {
      setError("Por favor, selecione uma data")
      return
    }

    const recordDate = new Date(dataRegistro)
    const maxDate = new Date()
    if (recordDate > maxDate) {
      setError("A data não pode ser no futuro")
      return
    }

    onSubmit({
      quantidade: qtd,
      dataRegistro,
    })

    // Reset form
    setQuantidade("")
    setDataRegistro(today)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="quantidade">Quantidade de baldes</Label>
        <Input
          id="quantidade"
          type="number"
          min="0"
          max="100"
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
          placeholder="Ex: 8"
          disabled={isLoading}
          className="focus-visible:ring-primary"
        />
        <p className="text-xs text-muted-foreground">
          Digite a quantidade de baldes coletados
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="data-registro" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Data do Registro
        </Label>
        <Input
          id="data-registro"
          type="date"
          value={dataRegistro}
          onChange={(e) => setDataRegistro(e.target.value)}
          disabled={isLoading}
          className="focus-visible:ring-primary"
        />
        <p className="text-xs text-muted-foreground">
          Data quando os baldes foram coletados
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex gap-2 border-t border-border/50 pt-4">
        <Button
          type="submit"
          disabled={isLoading || !quantidade || !dataRegistro}
          className="flex-1"
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-background border-t-transparent" />
              Salvando...
            </>
          ) : isEditing ? (
            "Atualizar Registro"
          ) : (
            "Criar Registro"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}

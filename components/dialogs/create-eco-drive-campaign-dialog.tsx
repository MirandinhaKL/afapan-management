"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Truck } from "lucide-react"
import {
  ECO_DRIVE_MATERIALS,
  type CreateEcoDriveCampaignInput,
  type EcoDriveCampaignStatus,
  type EcoDriveMaterialType,
} from "@/lib/eco-drive"

interface CreateEcoDriveCampaignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (input: CreateEcoDriveCampaignInput) => Promise<boolean>
  isSaving?: boolean
}

const initialMaterialValues = () => Object.fromEntries(
  ECO_DRIVE_MATERIALS.map((material) => [material.type, ""])
) as Record<EcoDriveMaterialType, string>

export function CreateEcoDriveCampaignDialog({
  open,
  onOpenChange,
  onCreate,
  isSaving = false,
}: CreateEcoDriveCampaignDialogProps) {
  const [name, setName] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [location, setLocation] = useState("")
  const [volunteerCount, setVolunteerCount] = useState("0")
  const [status, setStatus] = useState<EcoDriveCampaignStatus>("planejada")
  const [notes, setNotes] = useState("")
  const [materials, setMaterials] = useState(initialMaterialValues)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!open) return
    setName("")
    setEventDate("")
    setLocation("")
    setVolunteerCount("0")
    setStatus("planejada")
    setNotes("")
    setMaterials(initialMaterialValues())
    setSubmitted(false)
  }, [open])

  const volunteerNumber = Number(volunteerCount)
  const basicFieldsInvalid = !name.trim() || !eventDate || !location.trim()
  const volunteersInvalid = !Number.isInteger(volunteerNumber) || volunteerNumber < 0
  const hasNegativeValue = volunteerNumber < 0 || ECO_DRIVE_MATERIALS.some((material) => {
    const value = materials[material.type]
    return value.trim() !== "" && Number(value) < 0
  })
  const materialsInvalid = ECO_DRIVE_MATERIALS.some((material) => {
    const value = materials[material.type]
    if (value.trim() === "") return false
    const quantity = Number(value)
    return !Number.isFinite(quantity)
      || quantity < 0
      || (material.unit === "unidade" && !Number.isInteger(quantity))
  })

  const handleCreate = async () => {
    setSubmitted(true)
    if (basicFieldsInvalid || volunteersInvalid || materialsInvalid) return

    const created = await onCreate({
      name,
      eventDate,
      location,
      volunteerCount: volunteerNumber,
      status,
      notes,
      materials: ECO_DRIVE_MATERIALS.map((material) => ({
        type: material.type,
        quantity: Number(materials[material.type] || 0),
        unit: material.unit,
      })),
    })

    if (created) onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto p-6 sm:p-8">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" aria-hidden="true" />
            Nova campanha Eco Drive
          </DialogTitle>
          <DialogDescription>
            Cadastre o evento mensal e as quantidades de materiais recebidos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Dados da campanha</CardTitle>
              <CardDescription>Informe quando e onde o evento será realizado.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="eco-drive-name">Nome da campanha *</Label>
                <Input
                  id="eco-drive-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ex: Eco Drive Agosto"
                  aria-invalid={submitted && !name.trim()}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eco-drive-date">Data do evento *</Label>
                <Input
                  id="eco-drive-date"
                  type="date"
                  value={eventDate}
                  onChange={(event) => setEventDate(event.target.value)}
                  aria-invalid={submitted && !eventDate}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="eco-drive-location">Local *</Label>
                <Input
                  id="eco-drive-location"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Ex: Praça da Matriz"
                  aria-invalid={submitted && !location.trim()}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eco-drive-volunteers">Número de voluntários</Label>
                <Input
                  id="eco-drive-volunteers"
                  type="number"
                  min="0"
                  step="1"
                  value={volunteerCount}
                  onChange={(event) => setVolunteerCount(event.target.value)}
                  aria-invalid={submitted && volunteersInvalid}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eco-drive-status">Status</Label>
                <Select value={status} onValueChange={(value: EcoDriveCampaignStatus) => setStatus(value)}>
                  <SelectTrigger id="eco-drive-status" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planejada">Planejada</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Materiais coletados por peso</CardTitle>
              <CardDescription>Informe o peso recebido em quilogramas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {ECO_DRIVE_MATERIALS.filter((material) => material.unit === "kg").map((material) => (
                <div
                  key={material.type}
                  className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-center sm:gap-6"
                >
                  <Label htmlFor={`eco-drive-material-${material.type}`}>
                    {material.label}
                  </Label>
                  <Input
                    id={`eco-drive-material-${material.type}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={materials[material.type]}
                    onChange={(event) => setMaterials((current) => ({
                      ...current,
                      [material.type]: event.target.value,
                    }))}
                    placeholder="0"
                    aria-invalid={submitted && materialsInvalid}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Materiais coletados por unidade</CardTitle>
              <CardDescription>Informe a quantidade individual de cada item.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {ECO_DRIVE_MATERIALS.filter((material) => material.unit === "unidade").map((material) => (
                <div
                  key={material.type}
                  className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-center sm:gap-6"
                >
                  <Label htmlFor={`eco-drive-material-${material.type}`}>
                    {material.label}
                  </Label>
                  <Input
                    id={`eco-drive-material-${material.type}`}
                    type="number"
                    min="0"
                    step="1"
                    value={materials[material.type]}
                    onChange={(event) => setMaterials((current) => ({
                      ...current,
                      [material.type]: event.target.value,
                    }))}
                    placeholder="0"
                    aria-invalid={submitted && materialsInvalid}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Observações</CardTitle>
              <CardDescription>Registre informações complementares sobre a campanha.</CardDescription>
            </CardHeader>
            <CardContent>
              <Label htmlFor="eco-drive-notes" className="sr-only">Observações</Label>
              <Textarea
                id="eco-drive-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Informações adicionais sobre a campanha"
                rows={3}
              />
            </CardContent>
          </Card>

          {submitted && (basicFieldsInvalid || volunteersInvalid || materialsInvalid) && (
            <p className="text-sm text-destructive">
              {hasNegativeValue
                ? "Não são permitidos números negativos."
                : "Revise os campos obrigatórios e informe somente quantidades válidas."}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar campanha"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

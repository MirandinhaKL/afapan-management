"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
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
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova campanha Eco Drive</DialogTitle>
          <DialogDescription>
            Cadastre o evento mensal e as quantidades de materiais recebidos.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2 md:grid-cols-2">
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
              <SelectTrigger id="eco-drive-status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="planejada">Planejada</SelectItem>
                <SelectItem value="concluida">Concluída</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 border-t pt-4 md:col-span-2">
            <div>
              <Label>Materiais coletados por peso</Label>
              <p className="text-xs text-muted-foreground">
                Informe o peso recebido em quilogramas.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {ECO_DRIVE_MATERIALS.filter((material) => material.unit === "kg").map((material) => (
                <div key={material.type} className="grid grid-cols-[1fr_110px] items-center gap-3">
                  <Label htmlFor={`eco-drive-material-${material.type}`} className="font-normal">
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
            </div>
          </div>

          <div className="space-y-3 border-t pt-4 md:col-span-2">
            <div>
              <Label>Materiais coletados por unidade</Label>
              <p className="text-xs text-muted-foreground">
                Informe a quantidade individual de cada item.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {ECO_DRIVE_MATERIALS.filter((material) => material.unit === "unidade").map((material) => (
                <div key={material.type} className="grid grid-cols-[1fr_110px] items-center gap-3">
                  <Label htmlFor={`eco-drive-material-${material.type}`} className="font-normal">
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
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="eco-drive-notes">Observações</Label>
            <Textarea
              id="eco-drive-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Informações adicionais sobre a campanha"
              rows={3}
            />
          </div>

          {submitted && (basicFieldsInvalid || volunteersInvalid || materialsInvalid) && (
            <p className="text-sm text-destructive md:col-span-2">
              Revise os campos obrigatórios e informe somente quantidades válidas.
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

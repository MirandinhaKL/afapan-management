"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ECO_DRIVE_MATERIALS, getEcoDriveLocationLabel, type EcoDriveCampaign } from "@/lib/eco-drive"

interface Props {
  campaign: EcoDriveCampaign | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const formatDate = (value: string) => value.split("-").reverse().join("/")

export function EcoDriveCampaignDetailsDialog({ campaign, open, onOpenChange }: Props) {
  if (!campaign) return null
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{campaign.name}</DialogTitle>
          <DialogDescription>Dados completos da campanha Eco Drive.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Dados da campanha</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>Data:</strong> {formatDate(campaign.eventDate)}</p>
              <p><strong>Local:</strong> {getEcoDriveLocationLabel(campaign.location)}</p>
              <p><strong>Voluntários:</strong> {campaign.volunteerCount}</p>
              <p><strong>Status:</strong> <Badge variant={campaign.status === "concluida" ? "default" : "secondary"}>{campaign.status === "concluida" ? "Concluída" : "Planejada"}</Badge></p>
              {campaign.archivedAt && <p><strong>Arquivada em:</strong> {new Date(campaign.archivedAt).toLocaleString("pt-BR")}</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Observações</CardTitle></CardHeader>
            <CardContent className="whitespace-pre-wrap text-sm text-muted-foreground">{campaign.notes || "Nenhuma observação informada."}</CardContent>
          </Card>
          {(["kg", "unidade"] as const).map((unit) => (
            <Card key={unit} className="sm:col-span-2">
              <CardHeader><CardTitle className="text-base">Materiais por {unit === "kg" ? "peso" : "unidade"}</CardTitle></CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {ECO_DRIVE_MATERIALS.filter((item) => item.unit === unit).map((item) => (
                  <div key={item.type} className="flex justify-between gap-4 border-b pb-2 text-sm">
                    <span>{item.label}</span>
                    <strong>{campaign.materials.find((saved) => saved.type === item.type)?.quantity || 0} {unit === "kg" ? "kg" : "un."}</strong>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

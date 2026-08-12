"use client"

import { useEffect, useMemo, useState } from "react"
import { Boxes, CalendarDays, Plus, Scale, Users } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CreateEcoDriveCampaignDialog } from "@/components/dialogs/create-eco-drive-campaign-dialog"
import { createEcoDriveCampaign, fetchEcoDriveCampaigns } from "@/lib/eco-drive-queries"
import {
  calculateEcoDriveStats,
  getEcoDriveCampaignTotals,
  type CreateEcoDriveCampaignInput,
  type EcoDriveCampaign,
} from "@/lib/eco-drive"

const formatKg = (value: number) => new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  maximumFractionDigits: 2,
}).format(value)

const formatDate = (value: string) => {
  const [year, month, day] = value.split("-")
  return year && month && day ? `${day}/${month}/${year}` : value
}

export function EcoDrivePage() {
  const [campaigns, setCampaigns] = useState<EcoDriveCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    fetchEcoDriveCampaigns()
      .then(setCampaigns)
      .catch((error) => {
        console.error("Erro ao carregar campanhas Eco Drive:", error)
        toast.error("Não foi possível carregar as campanhas do Eco Drive", {
          description: "Confirme se as tabelas do módulo foram criadas no Supabase.",
        })
      })
      .finally(() => setLoading(false))
  }, [])

  const stats = useMemo(() => calculateEcoDriveStats(campaigns), [campaigns])

  const handleCreate = async (input: CreateEcoDriveCampaignInput) => {
    try {
      setSaving(true)
      const campaign = await createEcoDriveCampaign(input)
      setCampaigns((current) => [campaign, ...current])
      toast.success("Campanha Eco Drive salva com sucesso!")
      return true
    } catch (error) {
      console.error("Erro ao criar campanha Eco Drive:", error)
      toast.error("Não foi possível salvar a campanha", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      })
      return false
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Eco Drive</h2>
          <p className="text-muted-foreground">
            Campanhas mensais de coleta e reciclagem em Farroupilha.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={16} />
          Nova campanha
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Campanhas</CardTitle>
            <CalendarDays size={16} className="text-muted-foreground" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats.campaigns}</p><p className="text-xs text-muted-foreground">{stats.completedCampaigns} concluídas</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total coletado</CardTitle>
            <Scale size={16} className="text-muted-foreground" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{formatKg(stats.totalKg)} kg</p><p className="text-xs text-muted-foreground">Somente campanhas concluídas</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Itens por unidade</CardTitle>
            <Boxes size={16} className="text-muted-foreground" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats.totalUnits}</p><p className="text-xs text-muted-foreground">Em campanhas concluídas</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Voluntários</CardTitle>
            <Users size={16} className="text-muted-foreground" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats.totalVolunteers}</p><p className="text-xs text-muted-foreground">Nas campanhas concluídas</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Campanhas cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="py-10 text-center">
              <Boxes className="mx-auto mb-3 text-muted-foreground" size={32} />
              <p className="font-medium">Nenhuma campanha cadastrada</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Crie a primeira campanha mensal do Eco Drive.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campanha</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead className="text-right">Voluntários</TableHead>
                    <TableHead className="text-right">Coleta</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell>{formatDate(campaign.eventDate)}</TableCell>
                      <TableCell>{campaign.location}</TableCell>
                      <TableCell className="text-right">{campaign.volunteerCount}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatKg(getEcoDriveCampaignTotals(campaign).kg)} kg
                        <span className="block text-xs font-normal text-muted-foreground">
                          {getEcoDriveCampaignTotals(campaign).units} un.
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={campaign.status === "concluida" ? "default" : "secondary"}>
                          {campaign.status === "concluida" ? "Concluída" : "Planejada"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateEcoDriveCampaignDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={handleCreate}
        isSaving={saving}
      />
    </div>
  )
}

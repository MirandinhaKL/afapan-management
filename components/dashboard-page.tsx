"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  mockDashboardStats,
  mockBaldesTrimestral,
  mockTurmas,
  mockParticipantes,
} from "@/lib/mock-data"
import { ExportButton } from "@/components/export-button"
import { exportPDF, exportCSV } from "@/lib/export-utils"
import { Users, Trash2, Wind, Sprout, TrendingUp } from "lucide-react"
import { toast } from "sonner"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

const statCards = [
  {
    title: "Participantes ativos",
    value: mockDashboardStats.totalParticipantesAtivos,
    icon: Users,
    description: "no semestre atual",
    format: (v: number) => String(v),
  },
  {
    title: "Baldes no trimestre",
    value: mockDashboardStats.totalBaldesTrimestre,
    icon: Trash2,
    description: "Q1 2026",
    format: (v: number) => String(v),
  },
  {
    title: "CO2 evitado",
    value: mockDashboardStats.estimativaCO2Evitado,
    icon: Wind,
    description: "kg estimados no trimestre",
    format: (v: number) => `${v} kg`,
  },
  {
    title: "Adubo gerado",
    value: mockDashboardStats.totalAduboGerado,
    icon: Sprout,
    description: "kg estimados no trimestre",
    format: (v: number) => `${v} kg`,
  },
]

function StatsCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <Card key={stat.title} className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className="rounded-lg bg-primary/10 p-2">
              <stat.icon size={18} className="text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{stat.format(stat.value)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function BaldesChart() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Evolucao trimestral de baldes</CardTitle>
            <CardDescription>Comparativo dos ultimos 5 trimestres</CardDescription>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <TrendingUp size={14} />
            Tendencia
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockBaldesTrimestral} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.015 155)" />
              <XAxis
                dataKey="trimestre"
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid oklch(0.90 0.015 155)",
                  fontSize: "13px",
                }}
                formatter={(value: number) => [`${value} baldes`, "Total"]}
              />
              <Bar dataKey="baldes" radius={[6, 6, 0, 0]}>
                {mockBaldesTrimestral.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      index === mockBaldesTrimestral.length - 1
                        ? "oklch(0.55 0.12 85)"
                        : "oklch(0.45 0.12 155)"
                    }
                    opacity={index === mockBaldesTrimestral.length - 1 ? 1 : 0.7 + index * 0.06}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

function TurmasAtivas() {
  const totalPreenchidos = mockParticipantes.filter(
    (p) => p.baldes.some((b) => b.trimestre === "2026-Q1")
  ).length
  const totalParticipantes = mockParticipantes.length
  const percentual = Math.round((totalPreenchidos / totalParticipantes) * 100)

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Turmas</CardTitle>
        <CardDescription>Status das turmas do programa de compostagem</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockTurmas.map((turma) => (
          <div
            key={turma.id}
            className="flex items-center justify-between rounded-lg border border-border/50 p-4"
          >
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">{turma.nome}</p>
              <p className="text-xs text-muted-foreground">
                {turma.totalParticipantes} participantes
              </p>
            </div>
            <Badge
              variant={turma.ativa ? "default" : "secondary"}
              className={turma.ativa ? "bg-primary text-primary-foreground" : ""}
            >
              {turma.ativa ? "Ativa" : "Encerrada"}
            </Badge>
          </div>
        ))}

        {/* Status do preenchimento trimestral */}
        <div className="rounded-lg bg-muted/50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Preenchimento Q1 2026</p>
            <p className="text-sm font-bold text-primary">{percentual}%</p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${percentual}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {totalPreenchidos} de {totalParticipantes} participantes informaram os dados
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const handleExportPDF = () => {
    const headers = ["Trimestre", "Baldes"]
    const rows = mockBaldesTrimestral.map((item) => [item.trimestre, item.baldes])

    exportPDF({
      filename: "afapan-dashboard-relatorio",
      title: "Relatorio do Dashboard",
      subtitle: `Visao geral do programa de compostagem - ${new Date().toLocaleDateString("pt-BR")}`,
      headers,
      rows,
      summaryItems: [
        { label: "Participantes ativos", value: String(mockDashboardStats.totalParticipantesAtivos) },
        { label: "Baldes no trimestre", value: String(mockDashboardStats.totalBaldesTrimestre) },
        { label: "CO2 evitado (kg)", value: String(mockDashboardStats.estimativaCO2Evitado) },
        { label: "Adubo gerado (kg)", value: String(mockDashboardStats.totalAduboGerado) },
      ],
    })
    toast.success("PDF gerado com sucesso")
  }

  const handleExportCSV = () => {
    const headers = ["Trimestre", "Total de Baldes", "CO2 Estimado (kg)", "Adubo Estimado (kg)"]
    const rows = mockBaldesTrimestral.map((item) => [
      item.trimestre,
      item.baldes,
      item.baldes * 2,
      item.baldes * 5,
    ])

    exportCSV({
      filename: "afapan-dashboard-dados",
      headers,
      rows,
    })
    toast.success("CSV gerado com sucesso")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h2>
          <p className="text-muted-foreground">
            Visao geral do programa de compostagem da AFAPAN.
          </p>
        </div>
        <ExportButton onExportPDF={handleExportPDF} onExportCSV={handleExportCSV} />
      </div>

      <StatsCards />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <BaldesChart />
        </div>
        <div className="lg:col-span-2">
          <TurmasAtivas />
        </div>
      </div>
    </div>
  )
}

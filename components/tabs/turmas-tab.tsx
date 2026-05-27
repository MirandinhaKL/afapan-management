import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, CircleUser, UserPlus, Trash2, Group } from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { type Participante, type TurmaCompostagem } from "@/lib/mock-data"

interface TurmasTabProps {
  turmasCompostagem: (TurmaCompostagem & { participantes: Participante[]; totalParticipantes?: number })[]
  loading: boolean
  onCreateTurma: () => void
  onDeleteTurma: (turmaId: string) => void
  onOpenTurmaDetail: (turma: TurmaCompostagem & { participantes: Participante[]; totalParticipantes?: number }) => void
  onOpenAddParticipant: (turma: TurmaCompostagem & { participantes: Participante[]; totalParticipantes?: number }) => void
}

export function TurmasTab({
  turmasCompostagem,
  loading,
  onCreateTurma,
  onDeleteTurma,
  onOpenTurmaDetail,
  onOpenAddParticipant,
}: TurmasTabProps) {
  const turmasOrdenadas = [...turmasCompostagem].sort((a, b) => {
    return new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Turmas de Compostagem</h3>
          <p className="text-sm text-muted-foreground">
            Organize participantes em turmas para atividades de compostagem
          </p>
        </div>
        <Button onClick={onCreateTurma}>
          <Plus size={16} className="mr-2" />
          Nova Turma
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full text-center py-8">Carregando turmas...</div>
        ) : turmasCompostagem.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            Nenhuma turma criada ainda.
          </div>
        ) : (
          turmasOrdenadas.map((turma) => (
            <Card key={turma.id} className="border-border/50">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Group size={18} className="text-primary" />
                      <h4 className="font-semibold">{turma.nome}</h4>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => onDeleteTurma(turma.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                  {turma.descricao && (
                    <p className="text-sm text-muted-foreground">{turma.descricao}</p>
                  )}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground">Participantes:</span>
                    <Badge variant="secondary">{turma.totalParticipantes ?? turma.participantes.length}</Badge>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => onOpenTurmaDetail(turma)}
                        >
                          <CircleUser size={14} className="mr-1" />
                          Ver
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Detalhes do Participante</p>
                      </TooltipContent>
                    </Tooltip>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => onOpenAddParticipant(turma)}
                    >
                      <UserPlus size={14} className="mr-1" />
                      Adicionar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

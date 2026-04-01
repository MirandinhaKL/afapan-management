"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCompostagem } from "@/hooks/use-compostagem"
import { ParticipantesTab } from "@/components/tabs/participantes-tab"
import { TurmasTab } from "@/components/tabs/turmas-tab"
import { ParticipantDetailDialog } from "@/components/dialogs/participant-detail-dialog"
import { RegisterBucketsDialog } from "@/components/dialogs/register-buckets-dialog"
import { CreateTurmaDialog } from "@/components/dialogs/create-turma-dialog"
import { CreateParticipanteDialog } from "@/components/dialogs/create-participante-dialog"
import { TurmaDetailDialog } from "@/components/dialogs/turma-detail-dialog"
import { AddParticipantDialog } from "@/components/dialogs/add-participant-dialog"
import { DeleteTurmaDialog } from "@/components/dialogs/delete-turma-dialog"

export function CompostagemPage() {
  const [turmaToDelete, setTurmaToDelete] = useState<string | null>(null)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const {
    // Participant states
    participantes,
    turmas,
    loading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    turmaFilter,
    setTurmaFilter,
    selectedParticipante,
    isDetailOpen,
    setIsDetailOpen,
    isRegisterOpen,
    setIsRegisterOpen,
    registerQuantidade,
    setRegisterQuantidade,
    filteredParticipantes,
    stats,
    isCreateParticipanteOpen,
    setIsCreateParticipanteOpen,
    handleCreateParticipante,

    // Turma states
    turmasCompostagem,
    isCreateTurmaOpen,
    setIsCreateTurmaOpen,
    newTurmaName,
    setNewTurmaName,
    newTurmaDescription,
    setNewTurmaDescription,
    selectedTurma,
    isTurmaDetailOpen,
    setIsTurmaDetailOpen,
    isAddParticipantOpen,
    setIsAddParticipantOpen,

    // Constants
    TRIMESTRE_ATUAL,

    // Utility functions
    getStatus,
    handleGerarLink,
    handleRegistrarManual,
    openDetail,
    openRegister,
    handleCreateTurma,
    handleDeleteTurma,
    handleAddParticipantToTurma,
    handleRemoveParticipantFromTurma,
    openTurmaDetail,
    openAddParticipant,
  } = useCompostagem()

  const handleDeleteTurmaClick = (turmaId: string) => {
    setTurmaToDelete(turmaId)
    setIsDeleteConfirmOpen(true)
  }

  const handleConfirmDeleteTurma = (turmaId: string) => {
    handleDeleteTurma(turmaId)
  }

  const turmaToDeleteObject = turmasCompostagem.find((t) => t.id === turmaToDelete) || null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Compostagem</h2>
          <p className="text-muted-foreground">
            Gerenciamento do programa Compostando Juntos - {TRIMESTRE_ATUAL}
          </p>
        </div>
      </div>

      <Tabs defaultValue="participantes" className="space-y-6">
        <TabsList>
          <TabsTrigger value="participantes">Participantes</TabsTrigger>
          <TabsTrigger value="turmas">Turmas</TabsTrigger>
        </TabsList>

        <TabsContent value="participantes">
          <ParticipantesTab
            filteredParticipantes={filteredParticipantes}
            stats={stats}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            turmaFilter={turmaFilter}
            onTurmaFilterChange={setTurmaFilter}
            turmas={turmas}
            loading={loading}
            getStatus={getStatus}
            onOpenDetail={openDetail}
            onOpenRegister={openRegister}
            onGerarLink={handleGerarLink}
            onCreateParticipante={() => setIsCreateParticipanteOpen(true)}
            trimestre={TRIMESTRE_ATUAL}
          />
        </TabsContent>

        <TabsContent value="turmas">
          <TurmasTab
            turmasCompostagem={turmasCompostagem}
            loading={loading}
            onCreateTurma={() => setIsCreateTurmaOpen(true)}
            onDeleteTurma={handleDeleteTurmaClick}
            onOpenTurmaDetail={openTurmaDetail}
            onOpenAddParticipant={openAddParticipant}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ParticipantDetailDialog
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        participante={selectedParticipante}
      />

      <RegisterBucketsDialog
        open={isRegisterOpen}
        onOpenChange={setIsRegisterOpen}
        participante={selectedParticipante}
        quantidade={registerQuantidade}
        onQuantidadeChange={setRegisterQuantidade}
        onRegister={handleRegistrarManual}
        trimestre={TRIMESTRE_ATUAL}
      />

      <CreateTurmaDialog
        open={isCreateTurmaOpen}
        onOpenChange={setIsCreateTurmaOpen}
        nome={newTurmaName}
        onNomeChange={setNewTurmaName}
        descricao={newTurmaDescription}
        onDescricaoChange={setNewTurmaDescription}
        onCreateTurma={handleCreateTurma}
      />

      <CreateParticipanteDialog
        open={isCreateParticipanteOpen}
        onOpenChange={setIsCreateParticipanteOpen}
        turmas={turmas}
        turmasCompostagem={turmasCompostagem}
        currentTurmaFilter={turmaFilter}
        onCreateParticipante={handleCreateParticipante}
      />

      <TurmaDetailDialog
        open={isTurmaDetailOpen}
        onOpenChange={setIsTurmaDetailOpen}
        turma={selectedTurma}
        onRemoveParticipant={handleRemoveParticipantFromTurma}
      />

      <AddParticipantDialog
        open={isAddParticipantOpen}
        onOpenChange={setIsAddParticipantOpen}
        turma={selectedTurma}
        participantes={participantes}
        onAddParticipant={handleAddParticipantToTurma}
      />

      <DeleteTurmaDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        turma={turmaToDeleteObject}
        onConfirmDelete={handleConfirmDeleteTurma}
      />
    </div>
  )
}

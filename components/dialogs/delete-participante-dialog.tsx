import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Spinner } from "@/components/ui/spinner"
import { type Participante } from "@/lib/mock-data"

interface DeleteParticipanteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  participante: Participante | null
  onConfirmDelete: (participanteId: string) => Promise<void>
}

export function DeleteParticipanteDialog({
  open,
  onOpenChange,
  participante,
  onConfirmDelete,
}: DeleteParticipanteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isDeleting) {
      onOpenChange(nextOpen)
    }
  }

  const handleConfirm = async () => {
    if (!participante || isDeleting) return

    setIsDeleting(true)
    try {
      await onConfirmDelete(participante.id)
      onOpenChange(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir participante</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza de que deseja excluir <strong>"{participante?.nome}"</strong>? Os registros
            de baldes e vínculos desse participante também serão removidos. Esta ação não pode ser
            desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex justify-end gap-2">
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={isDeleting}
            onClick={(event) => {
              event.preventDefault()
              void handleConfirm()
            }}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {isDeleting && <Spinner className="mr-2" />}
            {isDeleting ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}

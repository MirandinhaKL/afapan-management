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
import { type TurmaCompostagem } from "@/lib/mock-data"

interface DeleteTurmaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  turma: TurmaCompostagem | null
  onConfirmDelete: (turmaId: string) => Promise<void>
}

export function DeleteTurmaDialog({
  open,
  onOpenChange,
  turma,
  onConfirmDelete,
}: DeleteTurmaDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isDeleting) {
      onOpenChange(nextOpen)
    }
  }

  const handleConfirm = async () => {
    if (!turma || isDeleting) return

    setIsDeleting(true)
    try {
      await onConfirmDelete(turma.id)
      onOpenChange(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir turma</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza de que deseja excluir a turma <strong>"{turma?.nome}"</strong>? Esta ação
            não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-2 justify-end">
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

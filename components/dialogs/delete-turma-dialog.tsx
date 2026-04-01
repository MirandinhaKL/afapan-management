import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { type TurmaCompostagem } from "@/lib/mock-data"

interface DeleteTurmaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  turma: TurmaCompostagem | null
  onConfirmDelete: (turmaId: string) => void
}

export function DeleteTurmaDialog({
  open,
  onOpenChange,
  turma,
  onConfirmDelete,
}: DeleteTurmaDialogProps) {
  const handleConfirm = () => {
    if (turma) {
      onConfirmDelete(turma.id)
      onOpenChange(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir turma</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza de que deseja excluir a turma <strong>"{turma?.nome}"</strong>? Esta ação
            não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-2 justify-end">
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="bg-red-600 hover:bg-red-700 text-white">
            Excluir
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}

import { Spinner } from "@/components/ui/spinner"

interface LoadingOverlayProps {
  message?: string
}

export function LoadingOverlay({ message = "Aguarde..." }: LoadingOverlayProps) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 rounded-xl bg-white/80 p-4 backdrop-blur-sm">
      <Spinner className="w-10 h-10 text-primary" />
      <p className="text-sm font-medium text-foreground">{message}</p>
    </div>
  )
}

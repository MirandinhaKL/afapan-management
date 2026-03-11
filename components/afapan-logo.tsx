import { Leaf } from "lucide-react"

export function AfapanLogo({ className = "", size = "default" }: { className?: string; size?: "sm" | "default" | "lg" }) {
  const sizeClasses = {
    sm: "gap-2",
    default: "gap-3",
    lg: "gap-4",
  }

  const iconSize = {
    sm: 20,
    default: 28,
    lg: 36,
  }

  const textClasses = {
    sm: "text-lg",
    default: "text-2xl",
    lg: "text-3xl",
  }

  return (
    <div className={`flex items-center ${sizeClasses[size]} ${className}`}>
      <div className="flex items-center justify-center rounded-xl bg-primary p-2">
        <Leaf className="text-primary-foreground" size={iconSize[size]} />
      </div>
      <div className="flex flex-col">
        <span className={`font-sans font-bold tracking-tight text-foreground ${textClasses[size]}`}>
          AFAPAN
        </span>
        <span className="text-xs font-medium tracking-wide text-muted-foreground">
          Gestao Administrativa
        </span>
      </div>
    </div>
  )
}

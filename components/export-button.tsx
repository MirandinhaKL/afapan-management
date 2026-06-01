"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, FileText, FileSpreadsheet } from "lucide-react"

interface ExportButtonProps {
  onExportPDF: () => void
  onExportCSV: () => void
  variant?: "default" | "outline" | "ghost" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
  label?: string
}

export function ExportButton({
  onExportPDF,
  onExportCSV,
  variant = "outline",
  size = "sm",
  label = "Exportar",
}: ExportButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className="gap-2">
          <Download size={16} />
          <span className="hidden sm:inline">{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onExportPDF} className="gap-2 cursor-pointer">
          <FileText size={16} className="text-destructive" />
          Exportar PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExportCSV} className="gap-2 cursor-pointer">
          <FileSpreadsheet size={16} className="text-success" />
          Exportar CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

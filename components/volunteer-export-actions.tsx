"use client"

import { useRef, useState } from "react"
import { ExportButton } from "@/components/export-button"
import { toast } from "sonner"
import { fetchVolunteerExport } from "@/lib/volunteer-export-query"
import { downloadExport, exportFilename, recordsForExport, serializeVolunteerCsv } from "@/lib/volunteer-export-data"

export function VolunteerExportActions() {
  const lock = useRef(false)
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState("")
  const [failed,setFailed]=useState(false)
  async function run(format: "csv" | "pdf") {
    if(lock.current)return
    const progress = (text: string) => { setMessage(text); toast.loading(text,{id:"volunteer-export"}) }
    lock.current=true;setBusy(true);setFailed(false);progress("Preparando exportação de todos os voluntários não arquivados...")
    try {
      const records=recordsForExport(await fetchVolunteerExport(progress))
      if(!records.length){const text="Não há voluntários não arquivados para exportar.";setMessage(text);toast.info(text,{id:"volunteer-export"});return}
      const date=new Date()
      const blob=format==="csv" ? new Blob([serializeVolunteerCsv(records)],{type:"text/csv;charset=utf-8;"}) : await (await import("@/lib/volunteer-export-pdf")).generateVolunteerPdf(records,date,progress)
      downloadExport(blob,exportFilename(date,format))
      const text=`Download iniciado: ${records.length} voluntário(s) em ${format.toUpperCase()}.`
      setMessage(text);toast.success(text,{id:"volunteer-export",description:format==="csv"?"Importe telefones e identificadores como texto para preservar a formatação.":undefined})
    }catch(error){const text=error instanceof Error?error.message:"Não foi possível exportar. Tente novamente.";setFailed(true);setMessage(text);toast.error(text,{id:"volunteer-export"})}
    finally{lock.current=false;setBusy(false)}
  }
  return <div className="flex items-center" title="Exportar todos os voluntários não arquivados">
    <ExportButton size="default" disabled={busy} label={busy?"Exportando...":"Exportar"} onExportCSV={()=>void run("csv")} onExportPDF={()=>void run("pdf")} />
    <p role="status" aria-label="Estado da exportação" aria-live={failed?"assertive":"polite"} className="sr-only">{message}</p>
  </div>
}

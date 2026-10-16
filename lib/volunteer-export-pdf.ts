import type { ExportRecord } from "@/lib/volunteer-export-data"
import { exportInstant, getVolunteerPdfFields } from "@/lib/volunteer-export-data"

// The renderer is shared with browser QA; it never uploads personal data.
export async function generateVolunteerPdf(records: ExportRecord[], date: Date, progress?: (message: string) => void): Promise<Blob> {
  if (!records.length) throw new Error("Não há voluntários não arquivados para exportar.")
  const { default: jsPDF } = await import("jspdf")
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true })
  const logo = await new Promise<HTMLImageElement>((resolve,reject)=>{
    const image = new Image(); image.onload=()=>resolve(image); image.onerror=()=>reject(new Error("Não foi possível carregar o logotipo. Tente novamente.")); image.src="/afapan-favicon-master.png"
  })
  await document.fonts.ready
  const canvas = document.createElement("canvas"), ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Este navegador não oferece os recursos necessários para gerar o PDF.")
  const mmPerPx = 25.4 / 96
  const fontSize = 9.5, lineHeight = 4.6, left = 14, right = 196, bottom = 277
  const segmenter = new Intl.Segmenter("pt-BR", { granularity: "grapheme" })
  const width = (value: string, size: number, bold: boolean) => {
    ctx.font = `${bold ? "bold " : ""}${size * 96 / 72}px Arial, sans-serif`
    return ctx.measureText(value).width * mmPerPx
  }
  function lines(value: string, maxWidth: number, size: number, bold = false): string[] {
    const output: string[] = []
    for (const paragraph of value.replace(/\r\n?/g,"\n").split("\n")) {
      let current = ""
      for (const token of paragraph.split(/(\s+)/u)) {
        if (width(current+token,size,bold) <= maxWidth) { current+=token; continue }
        if (current.trim()) output.push(current.trimEnd())
        current=""
        for (const { segment } of segmenter.segment(token.trimStart())) {
          if (width(current+segment,size,bold)>maxWidth && current) { output.push(current); current="" }
          current+=segment
        }
      }
      output.push(current.trimEnd())
    }
    return output
  }
  function draw(value: string, x: number, y: number, size = fontSize, bold = false) {
    if (!value) return
    if (/^[\x20-\x7e\u00a0-\u00ff]*$/u.test(value)) {
      doc.setFont("helvetica",bold?"bold":"normal");doc.setFontSize(size);doc.text(value,x,y);return
    }
    // Rasterize only non-Latin lines with local system fallback fonts, including color emoji.
    // Other text remains searchable. This avoids silent loss from jsPDF's standard fonts.
    const scale=3, px=size*96/72
    ctx!.font=`${bold?"bold ":""}${px}px Arial, sans-serif`
    const metrics=ctx!.measureText(value), ascent=Math.ceil(metrics.actualBoundingBoxAscent), descent=Math.ceil(metrics.actualBoundingBoxDescent)
    const w=Math.ceil(metrics.width+4), h=ascent+descent+2
    canvas.width=w*scale;canvas.height=h*scale
    ctx!.scale(scale,scale);ctx!.fillStyle=y<28?"#005430":"#ffffff";ctx!.fillRect(0,0,w,h)
    ctx!.font=`${bold?"bold ":""}${px}px Arial, sans-serif`;ctx!.fillStyle=y<28?"#ffffff":"#183c2d";ctx!.textBaseline="alphabetic"
    ctx!.fillText(value,2,ascent+1)
    doc.addImage(canvas.toDataURL("image/jpeg",0.96),"JPEG",x-2*mmPerPx,y-(ascent+1)*mmPerPx,w*mmPerPx,h*mmPerPx)
  }
  let y=0, pageCount=0
  let current: ExportRecord
  function startPage(continued: boolean) {
    if(pageCount++) doc.addPage()
    doc.setFillColor(0,84,48);doc.rect(0,0,210,28,"F")
    doc.addImage(logo,"PNG",left,5,18,18)
    doc.setTextColor(255,255,255);draw("AFAPAN",37,13,16,true);draw("Relatório de voluntários",37,20,10)
    doc.setTextColor(24,60,45)
    y=37
    for(const nameLine of lines(current.name+(continued?" - continuação":""),right-left,13,true)){draw(nameLine,left,y,13,true);y+=6}
    y+=2
  }
  function ensure(height: number) { if(y+height>bottom) startPage(true) }
  for(let i=0;i<records.length;i++) {
    current=records[i];startPage(false)
    let section=""
    for(const field of getVolunteerPdfFields(current)) {
      if(field.section==="Responsável" && !current.fields.some(f=>f.section==="Responsável" && f.value && f.value!=="Não")) continue
      if(field.section!==section){ensure(17);section=field.section;doc.setFillColor(236,245,239);doc.rect(left,y-3,right-left,7,"F");draw(section,left+2,y+1,10,true);y+=10}
      const value=field.value || "Não informado"
      const inline=`${field.label}: ${value}`
      if(!value.includes("\n") && width(inline,fontSize,false)<=right-left){ensure(lineHeight);draw(inline,left,y);y+=lineHeight;continue}
      ensure(lineHeight*2);draw(field.label,left,y,fontSize,true);y+=lineHeight
      for(const line of lines(value,right-left,fontSize)){ensure(lineHeight);draw(line,left,y);y+=lineHeight}
      y+=1
    }
    progress?.(`Preparando PDF: ${i+1} de ${records.length}`)
    // Yield between records so progress and keyboard/navigation remain responsive.
    await new Promise(resolve=>setTimeout(resolve,0))
  }
  for(let page=1;page<=doc.getNumberOfPages();page++){
    doc.setPage(page);doc.setDrawColor(208,222,213);doc.line(left,283,right,283);doc.setTextColor(70,85,77)
    draw(`Gerado em ${exportInstant(date)} (America/Sao_Paulo)`,left,288,7)
    draw(`${records.length} voluntário(s) | Página ${page} de ${doc.getNumberOfPages()}`,left,292,7)
  }
  return doc.output("blob")
}

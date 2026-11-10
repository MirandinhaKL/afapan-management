import { jsPDF } from "jspdf"
import { z } from "zod"
import { participantSlug } from "./filenames"

const text = z.string().trim().min(1).max(160)
export const certificateSettings = z.object({ signer: text, title: text, city: text })
export const certificateSnapshot = certificateSettings.extend({
  version: z.literal(1), code: z.string().regex(/^[A-F0-9]{32}$/),
  name: text, cpf: z.string().regex(/^\d{11}$/), course: text, institution: text, modality: text,
  startDate: z.string().date(), endDate: z.string().date(), minutes: z.number().int().positive(),
  issuedAt: z.string().datetime({ offset: true }),
})
export type CertificateSnapshot = z.infer<typeof certificateSnapshot>

export function certificateFilename(name: string) {
  const participant = participantSlug(name)
  return `certificado-conecta-afapan${participant ? `-${participant}` : ""}.pdf`
}

const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "UTC" })
const issuanceFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "America/Sao_Paulo" })
const numberFormat = new Intl.NumberFormat("pt-BR")

export function certificateStatement(data: CertificateSnapshot) {
  const date = (value: string) => dateFormat.format(new Date(value))
  const period = data.startDate === data.endDate ? `em ${date(data.startDate)}`
    : `de ${date(data.startDate)} a ${date(data.endDate)}`
  const cpf = data.cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4")
  const hours = Math.floor(data.minutes / 60)
  const minutes = data.minutes % 60
  const duration = [
    hours && `${numberFormat.format(hours)} ${hours === 1 ? "hora" : "horas"}`,
    minutes && `${minutes} ${minutes === 1 ? "minuto" : "minutos"}`,
  ].filter(Boolean).join(" e ")
  return `A Associação Farroupilhense de Proteção ao Ambiente Natural (AFAPAN) certifica que o(a) estudante, inscrito(a) no CPF ${cpf}, do curso de ${data.course} da instituição ${data.institution}, participou da modalidade ${data.modality}, ${period}, totalizando a carga horária de ${duration}.`
}

export function renderCertificate(data: CertificateSnapshot, logo: Uint8Array, preview = false) {
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true })
  const issued = new Date(data.issuedAt)
  const pdfDate = issued.toISOString().slice(0, 19).replace(/[-T:]/g, "")
  pdf.setCreationDate(`D:${pdfDate}+00'00'`)
  pdf.setFileId(data.code)
  pdf.setProperties({ title: "Certificado de atividades complementares", author: "AFAPAN" })
  pdf.setFillColor("#064b36").rect(0, 0, 45, 210, "F")
  pdf.setFillColor("#b3bf39").rect(45, 0, 1, 210, "F")
  pdf.setFillColor("#ffffff").roundedRect(9, 15, 27, 27, 2, 2, "F")
  pdf.addImage(logo, "PNG", 10, 16, 25, 25)
  pdf.setFont("helvetica", "bold").setFontSize(12).setTextColor("#ffffff").text("AFAPAN", 22.5, 50, { align: "center" })
  pdf.setFont("helvetica", "normal").setFontSize(9).text("CONECTA", 22.5, 57, { align: "center" })
  const center = 171.5
  const textHeight = (lineCount: number) => lineCount * pdf.getLineHeight() / pdf.internal.scaleFactor

  function centered(value: string, y: number, size: number, font = "helvetica", style = "normal", maxHeight = Infinity) {
    const line = value.normalize("NFC").replace(/\s+/gu, " ")
    if (/[^\x20-\x7e\xa0-\xff\u2013\u2014\u2018-\u201d]/u.test(line)) {
      throw new Error("O certificado contém caracteres incompatíveis com a fonte configurada.")
    }
    pdf.setFont(font, style).setFontSize(size)
    let lines = pdf.splitTextToSize(line, 218) as string[]
    while (textHeight(lines.length) > maxHeight && size > 9) {
      size -= 1
      pdf.setFontSize(size)
      lines = pdf.splitTextToSize(line, 218) as string[]
    }
    if (textHeight(lines.length) > maxHeight) throw new Error("O texto ultrapassa a área do certificado.")
    pdf.text(lines, center, y, { align: "center" })
    return lines.length
  }
  pdf.setTextColor("#064b36")
  centered("PROGRAMA DE ATIVIDADES COMPLEMENTARES", 24, 11, "helvetica", "bold")
  centered("Certificado", 53, 40, "times")
  centered("de atividades complementares", 64, 17)
  pdf.setDrawColor("#b3bf39").setLineWidth(0.7).line(center - 12, 73, center + 12, 73)
  centered("CONFERIDO A", 86, 9, "helvetica", "bold")
  const nameLines = centered(data.name, 97, 22, "helvetica", "bold")
  const paragraphY = 112 + (nameLines - 1) * 9
  const paragraphLines = centered(certificateStatement(data), paragraphY, 14, "helvetica", "normal", 160 - paragraphY)
  const cityY = Math.max(143, paragraphY + textHeight(paragraphLines) + 4)
  centered(`${data.city}, ${issuanceFormat.format(issued)}`, cityY, 10)
  pdf.setDrawColor("#93aa9e").setLineWidth(0.25).line(center - 42, 177, center + 42, 177)
  const signerLines = centered(data.signer, 182, 10, "helvetica", "bold")
  centered(data.title, 187 + (signerLines - 1) * 4, 9)
  centered(`Código de validação ${data.code.match(/.{4}/g)?.join("-")}`, 202, 9, "helvetica", "bold")
  if (preview) pdf.setFontSize(9).text("MODELO FICTÍCIO", 285, 11, { align: "right" })
  return new Uint8Array(pdf.output("arraybuffer"))
}

import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

// ===== CSV EXPORT =====

interface CsvOptions {
  filename: string
  headers: string[]
  rows: (string | number)[][]
}

export function exportCSV({ filename, headers, rows }: CsvOptions) {
  const BOM = "\uFEFF"
  const csvContent = [
    headers.join(";"),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";")
    ),
  ].join("\n")

  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })
  triggerDownload(blob, `${filename}.csv`)
}

// ===== PDF EXPORT =====

interface PdfOptions {
  filename: string
  title: string
  subtitle?: string
  headers: string[]
  rows: (string | number)[][]
  orientation?: "portrait" | "landscape"
  summaryItems?: { label: string; value: string }[]
}

export function exportPDF({
  filename,
  title,
  subtitle,
  headers,
  rows,
  orientation = "portrait",
  summaryItems,
}: PdfOptions) {
  const doc = new jsPDF({ orientation, unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()

  // Header bar
  doc.setFillColor(27, 67, 50) // #1B4332 dark forest green
  doc.rect(0, 0, pageWidth, 28, "F")

  // Title
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text("AFAPAN", 14, 12)
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.text("Associacao Farroupilhense de Protecao ao Ambiente Natural", 14, 18)

  // Date
  const now = new Date()
  const dateStr = now.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
  doc.setFontSize(8)
  doc.text(`Gerado em: ${dateStr}`, pageWidth - 14, 12, { align: "right" })

  // Report title
  let yPos = 38
  doc.setTextColor(27, 67, 50)
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text(title, 14, yPos)

  if (subtitle) {
    yPos += 7
    doc.setTextColor(100, 100, 100)
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(subtitle, 14, yPos)
  }

  // Summary cards
  if (summaryItems && summaryItems.length > 0) {
    yPos += 10
    const cardWidth = (pageWidth - 28 - (summaryItems.length - 1) * 4) / summaryItems.length
    summaryItems.forEach((item, i) => {
      const x = 14 + i * (cardWidth + 4)
      doc.setFillColor(240, 248, 240)
      doc.roundedRect(x, yPos, cardWidth, 18, 2, 2, "F")
      doc.setDrawColor(200, 230, 200)
      doc.roundedRect(x, yPos, cardWidth, 18, 2, 2, "S")
      doc.setTextColor(27, 67, 50)
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text(item.value, x + cardWidth / 2, yPos + 8, { align: "center" })
      doc.setTextColor(100, 100, 100)
      doc.setFontSize(7)
      doc.setFont("helvetica", "normal")
      doc.text(item.label, x + cardWidth / 2, yPos + 14, { align: "center" })
    })
    yPos += 24
  } else {
    yPos += 8
  }

  // Table
  autoTable(doc, {
    startY: yPos,
    head: [headers],
    body: rows.map((row) => row.map(String)),
    headStyles: {
      fillColor: [45, 106, 79], // #2D6A4F
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: "bold",
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: [50, 50, 50],
    },
    alternateRowStyles: {
      fillColor: [245, 250, 245],
    },
    styles: {
      lineColor: [220, 235, 220],
      lineWidth: 0.3,
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Footer on every page
      const pageHeight = doc.internal.pageSize.getHeight()
      doc.setDrawColor(200, 220, 200)
      doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12)
      doc.setTextColor(150, 150, 150)
      doc.setFontSize(7)
      doc.text(
        "AFAPAN - Módulo de Gestão Administrativa",
        14,
        pageHeight - 7
      )
      doc.text(
        `Pagina ${data.pageNumber}`,
        pageWidth - 14,
        pageHeight - 7,
        { align: "right" }
      )
    },
  })

  doc.save(`${filename}.pdf`)
}

// ===== HELPERS =====

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

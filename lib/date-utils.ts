export function hasFourDigitYear(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date)
}

export function formatDatePtBr(date: string): string {
  if (!hasFourDigitYear(date)) return date
  const [year, month, day] = date.split("-")
  return `${day}/${month}/${year}`
}

export function formatPeriodRange(
  startDate?: string | null,
  endDate?: string | null,
  fallback = "informado"
): string {
  if (!startDate || !endDate) return fallback
  return `De ${formatDatePtBr(startDate)} a ${formatDatePtBr(endDate)}`
}

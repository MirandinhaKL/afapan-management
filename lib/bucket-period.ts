export function formatBucketPeriodDate(date: string) {
  const [year, month, day] = date.split("-")
  return year && month && day ? `${day}/${month}/${year}` : date
}

export function formatBucketPeriodRange(start?: string, end?: string) {
  if (!start || !end) return null
  return `de ${formatBucketPeriodDate(start)} a ${formatBucketPeriodDate(end)}`
}

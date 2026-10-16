export function getVolunteerStatisticsYear(date = new Date()): number {
  return Number(new Intl.DateTimeFormat("en-US", { year: "numeric", timeZone: "America/Sao_Paulo" }).format(date))
}

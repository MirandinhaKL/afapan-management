export function getBucketPeriodRecordKey(
  monitoringDate: string,
  periodNumber: number
) {
  const [year, month] = monitoringDate.split("-").map(Number)

  if (!year || !month || month < 1 || month > 12) {
    throw new Error("Data de monitoramento inválida")
  }

  if (!Number.isInteger(periodNumber) || periodNumber < 1) {
    throw new Error("Número do período inválido")
  }

  const quarter = Math.ceil(month / 3)
  return `${year}-Q${quarter}-R${periodNumber}`
}

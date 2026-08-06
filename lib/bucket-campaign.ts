import { type Participante } from "@/lib/mock-data"

export const TOTAL_REGISTROS_CAMPANHA = 4

export function getRegistrosCampanhaSlots(participante: Participante) {
  const slots: Array<Participante["baldes"][number] | undefined> = Array.from(
    { length: TOTAL_REGISTROS_CAMPANHA },
    () => undefined
  )

  const registrosOrdenados = [...participante.baldes].sort((a, b) => {
    const dataA = a.dataRegistro || a.trimestre
    const dataB = b.dataRegistro || b.trimestre
    return `${dataA}-${a.trimestre}`.localeCompare(`${dataB}-${b.trimestre}`)
  })

  const registrosSemSlot: Participante["baldes"] = []

  registrosOrdenados.forEach((registro) => {
    const slotMatch = registro.trimestre.match(/-R([1-4])$/)
    const slotIndex = slotMatch ? Number(slotMatch[1]) - 1 : -1

    if (slotIndex >= 0 && !slots[slotIndex]) {
      slots[slotIndex] = registro
    } else {
      registrosSemSlot.push(registro)
    }
  })

  registrosSemSlot.forEach((registro) => {
    const slotIndex = slots.findIndex((slot) => !slot)
    if (slotIndex >= 0) {
      slots[slotIndex] = registro
    }
  })

  return slots
}

export function getRegistrosCampanha(participante: Participante) {
  return getRegistrosCampanhaSlots(participante).filter(
    Boolean
  ) as Participante["baldes"]
}

export function isCampanhaBaldesPreenchida(participante: Participante) {
  const registros = getRegistrosCampanhaSlots(participante)

  return registros.every(
    (registro) => registro !== undefined && registro.quantidade > 0
  )
}

export function getPrimeiroRegistroPendenteIndex(participante: Participante) {
  return getRegistrosCampanhaSlots(participante).findIndex(
    (registro) => registro === undefined || registro.quantidade <= 0
  )
}

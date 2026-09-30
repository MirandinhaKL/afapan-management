import { createHmac } from "node:crypto"
import { AFAPAN_CONTACT_EMAIL, AFAPAN_CONTACT_WHATSAPP, normalizeBrazilianPhone, type VolunteerInput } from "@/lib/volunteers"

export interface PublicVolunteerPayload extends VolunteerInput {
  token: string
  website?: string
}

export function getVolunteerRequestHash(value: string, secret: string) {
  return createHmac("sha256", secret).update(value || "unknown").digest("hex")
}

export function prepareVolunteerRpcPayload(input: VolunteerInput) {
  return {
    ...input,
    normalizedPhone: normalizeBrazilianPhone(input.phone),
    normalizedGuardianPhone: input.guardianPhone
      ? normalizeBrazilianPhone(input.guardianPhone)
      : null,
    activityStartMonth: input.activityStartMonth ?? null,
    activityStartYear: input.activityStartYear ?? null,
  }
}

export function getPublicVolunteerError(error: unknown) {
  const candidate = error as { code?: string; message?: string }
  if (candidate?.message?.includes("PHONE_ALREADY_REGISTERED") || candidate?.code === "23505") {
    return {
      status: 409,
      message: `Já existe uma resposta para este telefone. Para corrigir seus dados, fale com a AFAPAN pelo WhatsApp ${AFAPAN_CONTACT_WHATSAPP} ou pelo e-mail ${AFAPAN_CONTACT_EMAIL}.`,
    }
  }
  if (candidate?.message?.includes("RATE_LIMITED")) {
    return { status: 429, message: "Muitas tentativas foram realizadas. Aguarde um pouco e tente novamente." }
  }
  if (candidate?.message?.includes("FORM_UNAVAILABLE") || candidate?.code === "P0002") {
    return { status: 410, message: "Este formulário não está disponível no momento." }
  }
  return { status: 500, message: "Não foi possível enviar o cadastro. Tente novamente." }
}

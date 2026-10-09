import { createHmac } from "node:crypto"
import { AFAPAN_CONTACT_EMAIL, AFAPAN_CONTACT_WHATSAPP, brazilianDateToIso, normalizeBrazilianPhone } from "@/lib/volunteers"
import { publicVolunteerPayloadSchema, type PublicVolunteerPayload } from "@/lib/volunteer-registration"
export type { PublicVolunteerPayload } from "@/lib/volunteer-registration"

export function getVolunteerRequestHash(value: string, secret: string) {
  return createHmac("sha256", secret).update(value || "unknown").digest("hex")
}

export function prepareVolunteerRpcPayload(input: PublicVolunteerPayload) {
  const { website: _website, ...value } = publicVolunteerPayloadSchema.parse(input)
  return {
    ...value,
    birthDate: brazilianDateToIso(input.birthDate),
    normalizedPhone: normalizeBrazilianPhone(input.phone),
    normalizedGuardianPhone: input.guardianPhone
      ? normalizeBrazilianPhone(input.guardianPhone)
      : null,
    activityStartMonth: input.activityStartMonth ?? null,
    activityStartYear: input.activityStartYear ?? null,
    communicationChannels: input.communicationChannels ?? [],
    previousVolunteering: input.previousVolunteering ?? null,
    imageUseAuthorized: input.imageUseAuthorized ?? null,
  }
}

export function getPublicVolunteerError(error: unknown) {
  const candidate = error as { code?: string; message?: string }
  if (candidate?.message?.includes("FORM_VERSION_OUTDATED")) {
    return { status: 409, code: "FORM_VERSION_OUTDATED", message: "Os textos de confirmação foram atualizados. Atualize os textos abaixo e confirme novamente antes de enviar." }
  }
  if (candidate?.message?.includes("PHONE_ALREADY_REGISTERED") || candidate?.code === "23505") {
    return {
      status: 409,
      message: `Já existe uma resposta para este telefone. Para corrigir seus dados, fale com a AFAPAN pelo WhatsApp ${AFAPAN_CONTACT_WHATSAPP} ou pelo e-mail ${AFAPAN_CONTACT_EMAIL}.`,
    }
  }
  if (candidate?.message?.includes("RATE_LIMITED")) {
    return { status: 429, message: "Muitas tentativas foram realizadas. Aguarde um pouco e tente novamente." }
  }
  return { status: 500, message: "Não foi possível enviar o cadastro. Tente novamente." }
}

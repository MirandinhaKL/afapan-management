export interface WhatsAppTemplateConfig {
  accessToken: string
  phoneNumberId: string
  templateName: string
  templateLanguage: string
}

export interface SendBucketTemplateParams {
  to: string
  participanteNome: string
  periodoLabel: string
  link: string
}

export function getWhatsAppTemplateConfig(): WhatsAppTemplateConfig | null {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME
  const templateLanguage = process.env.WHATSAPP_TEMPLATE_LANGUAGE || "pt_BR"

  if (!accessToken || !phoneNumberId || !templateName) {
    return null
  }

  return {
    accessToken,
    phoneNumberId,
    templateName,
    templateLanguage,
  }
}

export function formatBrazilWhatsAppPhone(phone: string) {
  const digits = phone.replace(/\D/g, "")

  if (!digits) return ""
  if (digits.startsWith("55")) return digits
  return `55${digits}`
}

export async function sendBucketCollectionTemplate(
  config: WhatsAppTemplateConfig,
  params: SendBucketTemplateParams
) {
  const response = await fetch(
    `https://graph.facebook.com/v23.0/${config.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: formatBrazilWhatsAppPhone(params.to),
        type: "template",
        template: {
          name: config.templateName,
          language: {
            code: config.templateLanguage,
          },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: params.participanteNome },
                { type: "text", text: params.periodoLabel },
                { type: "text", text: params.link },
              ],
            },
          ],
        },
      }),
    }
  )

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      data?.error?.message ||
      data?.message ||
      `WhatsApp API returned ${response.status}`
    throw new Error(message)
  }

  return data
}

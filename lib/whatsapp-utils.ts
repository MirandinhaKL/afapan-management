/**
 * Utilitários para gerar links do WhatsApp com informações de buckets
 * Permite enviar mensagens via WhatsApp com links únicos por participante e período
 */

export interface WhatsAppLinkConfig {
  baseUrl?: string
  phoneNumber?: string
  useShortUrl?: boolean
}

/**
 * Gera a URL para o WhatsApp Web/App com mensagem pré-preenchida
 */
export function generateWhatsAppLink(
  token: string,
  participanteName: string,
  periodLabel: string,
  config?: WhatsAppLinkConfig
): string {
  const baseUrl = config?.baseUrl || 
    (typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_BASE_URL) || 
    'http://localhost:3000'

  const bucketFormUrl = `${baseUrl}/bucket/${token}`

  // Mensagem para o WhatsApp
  const message = `Olá ${participanteName}!

Esta é uma solicitação para o registro de baldes coletados no período ${periodLabel}.

Clique no link abaixo para registrar a quantidade de baldes:

${bucketFormUrl}

Obrigado por contribuir com o programa AFAPAN de compostagem!`

  // Codificar mensagem
  const encodedMessage = encodeURIComponent(message)

  // Se houver número de telefone, criar link direto
  if (config?.phoneNumber) {
    const phoneNumber = config.phoneNumber.replace(/\D/g, '') // Remover caracteres especiais
    return `https://wa.me/${phoneNumber}?text=${encodedMessage}`
  }

  // Usar wa.me sem número de telefone (funciona melhor em todos os casos)
  // Abre a interface de seleção de contato do WhatsApp
  return `https://wa.me/?text=${encodedMessage}`
}

/**
 * Gera uma mensagem de WhatsApp formatada
 */
export function generateWhatsAppMessage(
  token: string,
  participanteName: string,
  periodLabel: string,
  baseUrl?: string
): string {
  const fullBaseUrl = baseUrl || 
    (typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_BASE_URL) || 
    'http://localhost:3000'

  const bucketFormUrl = `${fullBaseUrl}/bucket/${token}`

  return `Olá ${participanteName}!

Esta é uma solicitação para o registro de baldes coletados no período ${periodLabel}.

Clique no link abaixo para registrar a quantidade de baldes:

${bucketFormUrl}

Obrigado por contribuir com o programa AFAPAN de compostagem!`
}

/**
 * Cria um link para enviar via WhatsApp (copia para clipboard)
 */
export async function copyWhatsAppLinkToClipboard(
  token: string,
  participanteName: string,
  periodLabel: string,
  baseUrl?: string
): Promise<boolean> {
  try {
    const message = generateWhatsAppMessage(token, participanteName, periodLabel, baseUrl)
    
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(message)
      return true
    } else {
      // Fallback para navegadores mais antigos
      const textArea = document.createElement('textarea')
      textArea.value = message
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      return true
    }
  } catch (error) {
    console.error('Erro ao copiar para clipboard:', error)
    return false
  }
}

/**
 * Abre o WhatsApp Web com a mensagem pré-preenchida em uma nova aba
 */
export function openWhatsAppWeb(
  token: string,
  participanteName: string,
  periodLabel: string,
  baseUrl?: string
): void {
  const link = generateWhatsAppLink(token, participanteName, periodLabel, { baseUrl })
  window.open(link, '_blank', 'width=600,height=700')
}

/**
 * Abre o WhatsApp App via protocolo (se instalado no dispositivo)
 */
export function openWhatsAppApp(
  token: string,
  participanteName: string,
  periodLabel: string,
  phoneNumber?: string,
  baseUrl?: string
): void {
  const baseUrlFinal = baseUrl || 
    (typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_BASE_URL) || 
    'http://localhost:3000'
  
  const bucketFormUrl = `${baseUrlFinal}/bucket/${token}`

  // Criar mensagem
  const message = `Olá ${participanteName}!\n\nEsta é uma solicitação para o registro de baldes coletados no período ${periodLabel}.\n\nClique no link abaixo para registrar a quantidade de baldes:\n\n${bucketFormUrl}\n\nObrigado por contribuir com o programa AFAPAN de compostagem!`
  
  const encodedMessage = encodeURIComponent(message)

  // Se tiver número de telefone, abrir conversa específica
  if (phoneNumber) {
    const cleanPhone = phoneNumber.replace(/\D/g, '')
    // Usar protocolo whatsapp:// para abrir no app
    const appLink = `whatsapp://send?phone=${cleanPhone}&text=${encodedMessage}`
    window.location.href = appLink
  } else {
    // Sem número específico, abrir o app para seleção de contato
    const appLink = `whatsapp://send?text=${encodedMessage}`
    window.location.href = appLink
  }
}

/**
 * Formata um número de telefone para o formato do WhatsApp (+55 11 99999-9999)
 */
export function formatPhoneForWhatsApp(phone: string): string {
  // Remove tudo que não é número
  const cleaned = phone.replace(/\D/g, '')
  
  // Se não tem 10 ou 11 dígitos, retornar como está
  if (cleaned.length < 10) return cleaned
  
  // Se tem 10 dígitos, assumir que falta o código do país
  if (cleaned.length === 10) {
    return `55${cleaned}`
  }
  
  // Se tem 11 dígitos, assumir que é Brasil com DDD
  if (cleaned.length === 11) {
    return `55${cleaned}`
  }
  
  // Caso contrário, retornar com formatação padrão
  return cleaned
}

/**
 * Gera um CSV com os links para múltiplos participantes
 * Útil para enviar em lote via ferramentas automáticas
 */
export function generateBucketLinksCSV(
  linksData: Array<{
    participanteNome: string
    telefone?: string
    token: string
    periodLabel: string
    link: string
  }>
): string {
  const headers = ['Nome do Participante', 'Telefone', 'Período', 'Link', 'Mensagem WhatsApp']
  
  const rows = linksData.map(data => {
    const message = generateWhatsAppMessage(
      data.token,
      data.participanteNome,
      data.periodLabel
    ).replace(/\n/g, ' | ') // Substituir quebras de linha por |
    
    return [
      `"${data.participanteNome}"`,
      data.telefone || '',
      data.periodLabel,
      data.link,
      `"${message}"`
    ].join(',')
  })
  
  return [headers.join(','), ...rows].join('\n')
}

/**
 * Download do CSV com links de buckets
 */
export function downloadBucketLinksCSV(
  linksData: Array<{
    participanteNome: string
    telefone?: string
    token: string
    periodLabel: string
    link: string
  }>,
  fileName: string = 'bucket-links.csv'
): void {
  const csv = generateBucketLinksCSV(linksData)
  
  // Criar blob
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  
  // Criar URL
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', fileName)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

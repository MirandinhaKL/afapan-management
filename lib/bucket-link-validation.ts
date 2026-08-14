interface BucketLinkState {
  is_active: boolean
  submitted: boolean
  expires_at?: string | null
}

export interface BucketLinkAccessError {
  message: string
  status: number
}

export function getBucketLinkAccessError(
  link: BucketLinkState,
  now = new Date()
): BucketLinkAccessError | null {
  if (link.submitted) {
    return {
      message: "Este link já foi utilizado. O número de baldes já foi registrado.",
      status: 409,
    }
  }

  if (!link.is_active) {
    return { message: "Este link não está mais ativo.", status: 410 }
  }

  if (link.expires_at && new Date(link.expires_at) < now) {
    return { message: "Link expirado.", status: 410 }
  }

  return null
}

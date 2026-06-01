import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTrimestre(trimestre: string): string {
  // Converte "2026-Q1" para "1º Trimestre 2026"
  // Converte "2026-Q2" para "2º Trimestre 2026", etc.
  const match = trimestre.match(/^(\d{4})-Q(\d)$/)
  if (!match) return trimestre

  const [, year, quarter] = match
  const quarterNames: Record<string, string> = {
    '1': '1º Trimestre',
    '2': '2º Trimestre',
    '3': '3º Trimestre',
    '4': '4º Trimestre',
  }

  return `${quarterNames[quarter]} ${year}`
}

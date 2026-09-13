import type { ClassValue } from "clsx"
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a Stripe amount (in smallest currency unit, e.g. cents) to a
 * human-readable string. Examples: 1099 + "usd" → "$10.99"
 */
export function formatCurrency(amount: number, currency: string): string {
  const code = currency.toUpperCase()
  // Zero-decimal currencies (https://stripe.com/docs/currencies#zero-decimal)
  const zeroDecimal = [
    'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA',
    'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF',
  ]
  const divisor = zeroDecimal.includes(code) ? 1 : 100
  const value = amount / divisor
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: divisor === 1 ? 0 : 2,
      maximumFractionDigits: divisor === 1 ? 0 : 2,
    }).format(value)
  } catch {
    return `${value.toFixed(divisor === 1 ? 0 : 2)} ${code}`
  }
}

/**
 * Format a Unix timestamp (seconds) to a short date string.
 * Example: 1690000000 → "Aug 22, 2023"
 */
export function formatDate(unixSeconds: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(unixSeconds * 1000))
}

/**
 * Format a Unix timestamp (seconds) to a date + time string.
 * Example: 1690000000 → "Aug 22, 2023, 10:46 AM"
 */
export function formatDateTime(unixSeconds: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(unixSeconds * 1000))
}

const numberFmt = new Intl.NumberFormat('es-PE')
const compactFmt = new Intl.NumberFormat('es-PE', { notation: 'compact', maximumFractionDigits: 1 })
const dateFmt = new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' })

export const formatNumber = (n: number): string => numberFmt.format(n)
export const formatBerries = (n: number): string => `฿ ${numberFmt.format(n)}`
export const formatBerriesCompact = (n: number): string => `฿ ${compactFmt.format(n)}`

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '—' : dateFmt.format(date)
}

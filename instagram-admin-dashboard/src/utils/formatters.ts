export const formatCompactNumber = (value: number): string => {
  if (value === undefined || value === null) return '0'
  return new Intl.NumberFormat('en', { notation: 'compact' }).format(value)
}

export const formatPercent = (value: number): string => {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

export const formatDate = (value: string): string => {
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

export const truncateText = (value: string, length = 40): string => {
  if (!value) return ''
  return value.length > length ? `${value.slice(0, length)}…` : value
}


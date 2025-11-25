export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export type SortDirection = 'asc' | 'desc'

export type TimeRange = '7d' | '30d' | '90d'


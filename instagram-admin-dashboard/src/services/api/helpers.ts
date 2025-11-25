import type { PageResponse } from '../../types'

interface RawPage<T> {
  content?: T[]
  page?: number
  size?: number
  pageNumber?: number
  pageSize?: number
  totalElements?: number
  totalPages?: number
}

export const normalizePage = <T,>(raw: RawPage<T>): PageResponse<T> => {
  const content = raw.content ?? []
  const page = typeof raw.page === 'number' ? raw.page : typeof raw.pageNumber === 'number' ? raw.pageNumber + 1 : 1
  const size = typeof raw.size === 'number' ? raw.size : typeof raw.pageSize === 'number' ? raw.pageSize : content.length
  return {
    content,
    page,
    size,
    totalElements: raw.totalElements ?? content.length,
    totalPages: raw.totalPages ?? 1,
  }
}


import type React from 'react'

interface Column<T> {
  key: string
  title: string
  className?: string
  render?: (item: T) => React.ReactNode
}

interface Pagination {
  page: number
  size: number
  totalPages: number
  totalElements: number
  onPageChange: (page: number) => void
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  emptyMessage?: string
  pagination?: Pagination
}

export const DataTable = <T,>({
  data,
  columns,
  loading = false,
  emptyMessage = 'Không có dữ liệu',
  pagination,
}: DataTableProps<T>) => {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-card">
      <table className="min-w-full divide-y divide-slate-100">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-500 ${column.className ?? ''}`}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-10 text-center text-slate-500">
                Đang tải dữ liệu...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-10 text-center text-slate-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                {columns.map((column) => {
                  const rawValue = (item as Record<string, unknown>)[column.key]
                  const fallback =
                    typeof rawValue === 'number' || typeof rawValue === 'string' || rawValue === undefined
                      ? rawValue ?? '-'
                      : '-'
                  return (
                    <td key={column.key} className={`px-6 py-4 text-sm text-slate-700 ${column.className ?? ''}`}>
                      {column.render ? column.render(item) : fallback}
                    </td>
                  )
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {pagination && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-4 text-sm text-slate-500">
          <p>
            Trang {pagination.page} / {pagination.totalPages} ({pagination.totalElements} bản ghi)
          </p>
          <div className="flex items-center gap-2">
            <button
              className="rounded-full border border-slate-200 px-4 py-1.5 text-slate-600 disabled:opacity-40"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              Trước
            </button>
            <button
              className="rounded-full border border-slate-200 px-4 py-1.5 text-slate-600 disabled:opacity-40"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


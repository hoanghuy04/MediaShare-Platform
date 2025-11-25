import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DataTable } from '../../components/tables/DataTable'
import { groupApi } from '../../services/api/groupApi'
import type { GroupConversation, GroupListFilters, GroupPageResponse } from '../../types'
import { formatDate } from '../../utils/formatters'

export const GroupsPage = () => {
  const [filters, setFilters] = useState<GroupListFilters>({ page: 1, size: 10, status: 'ALL', sort: 'createdAt', direction: 'desc' })
  const [pageData, setPageData] = useState<GroupPageResponse | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    groupApi
      .getGroups(filters)
      .then((response) => {
        if (active) setPageData(response)
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [filters])

  const columns = [
    {
      key: 'group',
      title: 'Nhóm',
      render: (group: GroupConversation) => (
        <div className="flex items-center gap-3">
          {group.avatarUrl ? (
            <img src={group.avatarUrl} alt={group.name} className="h-12 w-12 rounded-2xl object-cover" />
          ) : (
            <div className="h-12 w-12 rounded-2xl bg-slate-200" />
          )}
          <div>
            <p className="font-semibold text-slate-900">{group.name}</p>
            <p className="text-xs uppercase text-slate-400">Owner: {group.ownerName}</p>
          </div>
        </div>
      ),
    },
    { key: 'memberCount', title: 'Thành viên' },
    { key: 'messageCount', title: 'Tin nhắn' },
    {
      key: 'createdAt',
      title: 'Ngày tạo',
      render: (group: GroupConversation) => <span>{formatDate(group.createdAt)}</span>,
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (group: GroupConversation) => (
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            group.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200 text-slate-600'
          }`}
        >
          {group.status}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (group: GroupConversation) => (
        <Link to={`/admin/groups/${group.id}`} className="text-sm text-brand-high">
          View
        </Link>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Quản lý group conversation</p>
          <h2 className="text-3xl font-bold text-slate-900">Groups</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            placeholder="Search group"
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-brand-high focus:ring-2 focus:ring-brand-high/30"
            value={filters.search ?? ''}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))}
          />
          <select
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-600 outline-none focus:border-brand-high focus:ring-2 focus:ring-brand-high/30"
            value={filters.status ?? 'ALL'}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value as GroupListFilters['status'], page: 1 }))}
          >
            <option value="ALL">Tất cả</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>
      <DataTable
        data={pageData?.content ?? []}
        columns={columns}
        loading={loading}
        pagination={
          pageData
            ? {
                page: pageData.page,
                size: pageData.size,
                totalPages: pageData.totalPages,
                totalElements: pageData.totalElements,
                onPageChange: (page) => setFilters((prev) => ({ ...prev, page })),
              }
            : undefined
        }
      />
    </div>
  )
}


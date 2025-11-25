import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DataTable } from '../../components/tables/DataTable'
import { userApi } from '../../services/api/userApi'
import type { PageResponse, User, UserListFilters } from '../../types'
import { formatDate, formatCompactNumber } from '../../utils/formatters'

const statusOptions = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Banned', value: 'BANNED' },
]

export const UsersPage = () => {
  const [filters, setFilters] = useState<UserListFilters>({ page: 1, size: 10, status: 'ALL', sort: 'createdAt', direction: 'desc' })
  const [pageData, setPageData] = useState<PageResponse<User> | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    userApi
      .getUsers(filters)
      .then((response) => {
        if (active) setPageData(response)
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [filters])

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, search: event.target.value, page: 1 }))
  }

  const columns = [
    {
      key: 'avatar',
      title: 'User',
      render: (user: User) => (
        <div className="flex items-center gap-3">
          <img src={user.avatarUrl} alt={user.fullName} className="h-12 w-12 rounded-2xl object-cover" />
          <div>
            <p className="font-semibold text-slate-900">{user.fullName}</p>
            <p className="text-sm text-slate-500">@{user.username}</p>
          </div>
        </div>
      ),
    },
    { key: 'email', title: 'Email' },
    {
      key: 'followers',
      title: 'Follower / Following',
      render: (user: User) => (
        <p>
          {formatCompactNumber(user.followerCount)} / {formatCompactNumber(user.followingCount)}
        </p>
      ),
    },
    {
      key: 'posts',
      title: 'Post',
      render: (user: User) => <span>{user.postCount}</span>,
    },
    {
      key: 'createdAt',
      title: 'Ngày tạo',
      render: (user: User) => <span>{formatDate(user.createdAt)}</span>,
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (user: User) => (
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
          }`}
        >
          {user.status}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (user: User) => (
        <div className="flex gap-2">
          <Link to={`/admin/users/${user.id}`} className="text-sm text-brand-high">
            View
          </Link>
          <button className="text-sm text-slate-500" onClick={() => console.log('Delete user', user.id)}>
            Delete
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Quản lý user</p>
          <h2 className="text-3xl font-bold text-slate-900">Users</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            placeholder="Search username hoặc tên"
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-brand-high focus:ring-2 focus:ring-brand-high/30"
            onChange={handleSearch}
            value={filters.search ?? ''}
          />
          <select
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-600 outline-none focus:border-brand-high focus:ring-2 focus:ring-brand-high/30"
            value={filters.status ?? 'ALL'}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value as UserListFilters['status'], page: 1 }))}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-600 outline-none focus:border-brand-high focus:ring-2 focus:ring-brand-high/30"
            value={filters.sort}
            onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value as UserListFilters['sort'] }))}
          >
            <option value="createdAt">Theo ngày tạo</option>
            <option value="followerCount">Theo follower</option>
            <option value="postCount">Theo post</option>
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


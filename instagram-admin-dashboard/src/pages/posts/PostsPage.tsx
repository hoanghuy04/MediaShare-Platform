import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { postApi } from '../../services/api/postApi'
import { DataTable } from '../../components/tables/DataTable'
import type { PageResponse, Post, PostListFilters } from '../../types'
import { formatCompactNumber, formatDate, truncateText } from '../../utils/formatters'

export const PostsPage = () => {
  const [filters, setFilters] = useState<PostListFilters>({
    page: 1,
    size: 10,
    sort: 'createdAt',
    direction: 'desc',
    status: 'ALL',
    type: 'ALL',
  })
  const [pageData, setPageData] = useState<PageResponse<Post> | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    postApi
      .getPosts(filters)
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
      key: 'thumbnail',
      title: 'Nội dung',
      render: (post: Post) => (
        <div className="flex items-center gap-3">
          <img src={post.thumbnailUrl} alt={post.caption} className="h-16 w-16 rounded-2xl object-cover" />
          <div>
            <p className="font-semibold text-slate-900">{truncateText(post.caption, 60)}</p>
            <p className="text-xs uppercase text-slate-400">{post.type}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'owner',
      title: 'Owner',
      render: (post: Post) => (
        <div className="flex items-center gap-2">
          <img src={post.ownerAvatar} alt={post.ownerUsername} className="h-10 w-10 rounded-2xl object-cover" />
          <span>@{post.ownerUsername}</span>
        </div>
      ),
    },
    {
      key: 'metrics',
      title: 'Like / Comment',
      render: (post: Post) => (
        <span>
          {formatCompactNumber(post.likeCount)} / {formatCompactNumber(post.commentCount)}
        </span>
      ),
    },
    {
      key: 'createdAt',
      title: 'Ngày tạo',
      render: (post: Post) => <span>{formatDate(post.createdAt)}</span>,
    },
    {
      key: 'visibility',
      title: 'Trạng thái',
      render: (post: Post) => (
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            post.visibility === 'PUBLIC' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
          }`}
        >
          {post.visibility}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (post: Post) => (
        <div className="flex gap-2 text-sm">
          <Link to={`/admin/posts/${post.id}`} className="text-brand-high">
            View
          </Link>
          <button className="text-slate-500" onClick={() => console.log('Hide post', post.id)}>
            Hide
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Quản lý post & reel</p>
          <h2 className="text-3xl font-bold text-slate-900">Posts & Reels</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            placeholder="Search caption"
            value={filters.search ?? ''}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-brand-high focus:ring-2 focus:ring-brand-high/30"
          />
          <select
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-600 outline-none focus:border-brand-high focus:ring-2 focus:ring-brand-high/30"
            value={filters.type}
            onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value as PostListFilters['type'], page: 1 }))}
          >
            <option value="ALL">Tất cả loại</option>
            <option value="POST">Post</option>
            <option value="REEL">Reel</option>
          </select>
          <select
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-600 outline-none focus:border-brand-high focus:ring-2 focus:ring-brand-high/30"
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value as PostListFilters['status'], page: 1 }))}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PUBLIC">Public</option>
            <option value="HIDDEN">Hidden</option>
          </select>
          <input
            type="date"
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-600 outline-none focus:border-brand-high focus:ring-2 focus:ring-brand-high/30"
            value={filters.from ?? ''}
            onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))}
          />
          <input
            type="date"
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-600 outline-none focus:border-brand-high focus:ring-2 focus:ring-brand-high/30"
            value={filters.to ?? ''}
            onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))}
          />
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


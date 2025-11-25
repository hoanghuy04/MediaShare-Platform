import { useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DashboardStats, TimeRange } from '../../types'
import { statsApi } from '../../services/api/statsApi'
import { StatCard } from '../../components/cards/StatCard'
import { ChartCard } from '../../components/cards/ChartCard'
import { TimeRangeFilter } from '../../components/filters/TimeRangeFilter'
import { formatCompactNumber } from '../../utils/formatters'

export const DashboardPage = () => {
  const [range, setRange] = useState<TimeRange>('7d')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(false)
  const distributionData = stats ? stats.postDistribution.map((slice) => ({ ...slice, name: slice.type })) : []

  useEffect(() => {
    let active = true
    setLoading(true)
    statsApi
      .getDashboardStats(range)
      .then((payload) => {
        if (active) setStats(payload)
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [range])

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Tổng quan hoạt động</p>
          <h2 className="text-3xl font-bold text-slate-900">Dashboard</h2>
        </div>
        <TimeRangeFilter value={range} onChange={setRange} />
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {loading && !stats
          ? Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="h-32 animate-pulse rounded-3xl bg-slate-200/60" />
            ))
          : stats?.metrics.map((metric) => <StatCard key={metric.id} metric={metric} />)}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="User mới" description="Tăng trưởng user trong kỳ">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats?.newUsers ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#ac4abb" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Posts vs Reels" description="So sánh nội dung theo loại">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats?.postsVsReels ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Legend />
              <Bar dataKey="posts" fill="#ac4abb" radius={[12, 12, 0, 0]} />
              <Bar dataKey="reels" fill="#6f1f8f" radius={[12, 12, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Lượng like" description="Số lượng like theo ngày">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats?.likesTrend ?? []}>
              <defs>
                <linearGradient id="likesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ac4abb" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ac4abb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Area type="monotone" dataKey="likes" stroke="#ac4abb" fill="url(#likesGradient)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Lượng comment" description="Tương tác bình luận">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats?.commentsTrend ?? []}>
              <defs>
                <linearGradient id="commentsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6f1f8f" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#6f1f8f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Area type="monotone" dataKey="comments" stroke="#6f1f8f" fill="url(#commentsGradient)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Tỉ lệ loại nội dung" description="Post vs Reel">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip />
              <Pie
                data={distributionData}
                dataKey="value"
                nameKey="type"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={50}
                fill="#ac4abb"
                label
              >
                {(stats?.postDistribution ?? []).map((_entry, index) => (
                  <Cell key={`slice-${index}`} fill={index === 0 ? '#ac4abb' : '#6f1f8f'} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <section className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-slate-900">Top hoạt động</p>
              <p className="text-sm text-slate-500">Top user hoạt động mạnh</p>
            </div>
          </div>
          <div className="space-y-4">
            {stats?.topActiveUsers.map((user) => (
              <div key={user.userId} className="flex items-center gap-4 rounded-2xl border border-slate-100 p-4">
                <img src={user.avatarUrl} alt={user.fullName} className="h-12 w-12 rounded-2xl object-cover" />
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{user.fullName}</p>
                  <p className="text-sm text-slate-500">@{user.username}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Posts</p>
                  <p className="text-lg font-semibold text-slate-900">{user.posts}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Like</p>
                  <p className="text-lg font-semibold text-slate-900">{formatCompactNumber(user.likes)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-slate-900">Top bài viết nổi bật</p>
            <p className="text-sm text-slate-500">Theo lượt like & comment</p>
          </div>
        </div>
        <div className="grid gap-4">
          {stats?.topPosts.map((post) => (
            <div
              key={post.id}
              className="flex items-center gap-4 rounded-2xl border border-slate-100 p-4 transition hover:bg-slate-50"
            >
              <img src={post.thumbnailUrl} alt={post.caption} className="h-16 w-16 rounded-2xl object-cover" />
              <div className="flex-1">
                <p className="font-semibold text-slate-900">{post.caption}</p>
                <p className="text-sm text-slate-500">@{post.ownerUsername}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Likes</p>
                <p className="text-lg font-semibold text-slate-900">{formatCompactNumber(post.likeCount)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Comments</p>
                <p className="text-lg font-semibold text-slate-900">{formatCompactNumber(post.commentCount)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}


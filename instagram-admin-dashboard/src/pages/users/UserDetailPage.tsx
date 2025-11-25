import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Post, User, UserStats } from '../../types'
import { userApi } from '../../services/api/userApi'
import { formatCompactNumber, formatDate, truncateText } from '../../utils/formatters'

type TabKey = 'overview' | 'posts' | 'followers' | 'following'

export const UserDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [followers, setFollowers] = useState<{ id: string; username: string; fullName: string; avatarUrl: string }[]>([])
  const [followings, setFollowings] = useState<typeof followers>([])
  const [tab, setTab] = useState<TabKey>('overview')
  const [loading, setLoading] = useState(true)
  const [isBanned, setIsBanned] = useState(false)

  useEffect(() => {
    if (!id) return
    let active = true
    setLoading(true)
    Promise.all([
      userApi.getUserById(id),
      userApi.getUserStats(id),
      userApi.getUserPosts(id),
      userApi.getFollowers(id),
      userApi.getFollowing(id),
    ])
      .then(([userDetail, userStats, userPosts, followerList, followingList]) => {
        if (!active) return
        setUser(userDetail)
        setStats(userStats)
        setPosts(userPosts)
        setFollowers(followerList)
        setFollowings(followingList)
        setIsBanned(userDetail.status === 'BANNED')
      })
      .catch(() => navigate('/admin/users'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [id, navigate])

  if (loading || !user) {
    return <div className="rounded-3xl bg-white p-8 shadow-card">Đang tải thông tin user...</div>
  }

  const tabItems: { key: TabKey; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'posts', label: 'Posts' },
    { key: 'followers', label: 'Followers' },
    { key: 'following', label: 'Following' },
  ]

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
        <div className="flex flex-wrap items-center gap-6">
          <img src={user.avatarUrl} className="h-28 w-28 rounded-3xl object-cover" alt={user.fullName} />
          <div className="flex-1 min-w-[240px]">
            <p className="text-2xl font-bold text-slate-900">{user.fullName}</p>
            <p className="text-slate-500">@{user.username}</p>
            <p className="mt-2 text-sm text-slate-600">{user.bio ?? 'Chưa có bio'}</p>
            {user.website && (
              <a href={user.website} target="_blank" rel="noreferrer" className="text-sm text-brand-high underline">
                {user.website}
              </a>
            )}
          </div>
          <div className="flex flex-col gap-3">
            <button
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
              onClick={() => window.open(`https://instagram.com/${user.username}`, '_blank')}
            >
              Xem trên app
            </button>
            <button
              className="rounded-2xl border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600"
              onClick={() => console.log('Delete user', user.id)}
            >
              Delete user
            </button>
            <button
              className={`rounded-2xl px-4 py-2 text-sm font-medium ${
                isBanned ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              }`}
              onClick={() => setIsBanned((prev) => !prev)}
            >
              {isBanned ? 'Unban user' : 'Ban user'}
            </button>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-4 text-center">
            <p className="text-sm text-slate-500">Followers</p>
            <p className="text-2xl font-semibold text-slate-900">{formatCompactNumber(user.followerCount)}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 text-center">
            <p className="text-sm text-slate-500">Following</p>
            <p className="text-2xl font-semibold text-slate-900">{formatCompactNumber(user.followingCount)}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 text-center">
            <p className="text-sm text-slate-500">Posts</p>
            <p className="text-2xl font-semibold text-slate-900">{user.postCount}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 text-center">
            <p className="text-sm text-slate-500">Joined</p>
            <p className="text-2xl font-semibold text-slate-900">{formatDate(user.createdAt)}</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
        <div className="flex flex-wrap gap-3">
          {tabItems.map((item) => (
            <button
              key={item.key}
              className={`rounded-2xl px-4 py-2 text-sm font-medium ${
                tab === item.key ? 'bg-brand-gradient text-white shadow-card' : 'bg-slate-100 text-slate-600'
              }`}
              onClick={() => setTab(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === 'overview' && stats && (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 p-4">
                <p className="text-sm text-slate-500">Tổng like</p>
                <p className="text-2xl font-semibold text-slate-900">{formatCompactNumber(stats.likes)}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 p-4">
                <p className="text-sm text-slate-500">Tổng comment</p>
                <p className="text-2xl font-semibold text-slate-900">{formatCompactNumber(stats.comments)}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 p-4">
                <p className="text-sm text-slate-500">Bài viết công khai</p>
                <p className="text-2xl font-semibold text-slate-900">{stats.posts}</p>
              </div>
            </div>
          )}

          {tab === 'posts' && (
            <div className="grid gap-4 md:grid-cols-3">
              {posts.map((post) => (
                <div key={post.id} className="rounded-2xl border border-slate-100 p-3">
                  <img src={post.thumbnailUrl} alt={post.caption} className="h-48 w-full rounded-xl object-cover" />
                  <p className="mt-3 text-sm font-semibold text-slate-900">{truncateText(post.caption, 60)}</p>
                  <div className="mt-2 flex justify-between text-xs text-slate-500">
                    <span>❤️ {formatCompactNumber(post.likeCount)}</span>
                    <span>💬 {formatCompactNumber(post.commentCount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'followers' && (
            <div className="grid gap-3 md:grid-cols-2">
              {followers.map((profile) => (
                <div key={profile.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3">
                  <img src={profile.avatarUrl} alt={profile.fullName} className="h-12 w-12 rounded-2xl object-cover" />
                  <div>
                    <p className="font-semibold text-slate-900">{profile.fullName}</p>
                    <p className="text-sm text-slate-500">@{profile.username}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'following' && (
            <div className="grid gap-3 md:grid-cols-2">
              {followings.map((profile) => (
                <div key={profile.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3">
                  <img src={profile.avatarUrl} alt={profile.fullName} className="h-12 w-12 rounded-2xl object-cover" />
                  <div>
                    <p className="font-semibold text-slate-900">{profile.fullName}</p>
                    <p className="text-sm text-slate-500">@{profile.username}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


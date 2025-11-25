import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { PostDetail } from '../../types'
import { postApi } from '../../services/api/postApi'
import { formatCompactNumber, formatDate } from '../../utils/formatters'

export const PostDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [post, setPost] = useState<PostDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let active = true
    setLoading(true)
    postApi
      .getPostById(id)
      .then((response) => {
        if (active) setPost(response)
      })
      .catch(() => navigate('/admin/posts'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [id, navigate])

  if (loading || !post) {
    return <div className="rounded-3xl bg-white p-8 shadow-card">Đang tải chi tiết post...</div>
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-100 bg-white shadow-card">
        <div className="grid gap-6 p-6 md:grid-cols-2">
          <div>
            {post.type === 'REEL' ? (
              <div className="relative aspect-[9/16] overflow-hidden rounded-3xl bg-slate-900 text-white">
                <video className="h-full w-full object-cover" controls poster={post.thumbnailUrl}>
                  <source src={post.mediaUrl} />
                </video>
                <span className="absolute bottom-3 right-3 rounded-full bg-white/20 px-3 py-1 text-xs backdrop-blur">
                  Reel preview
                </span>
              </div>
            ) : (
              <img src={post.mediaUrl} alt={post.caption} className="w-full rounded-3xl object-cover" />
            )}
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm uppercase text-slate-400">{post.type}</p>
              <h2 className="text-2xl font-bold text-slate-900">{post.caption}</h2>
              <p className="text-sm text-slate-500">{formatDate(post.createdAt)}</p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
              <img src={post.ownerAvatar} alt={post.ownerUsername} className="h-12 w-12 rounded-2xl object-cover" />
              <div className="flex-1">
                <p className="font-semibold text-slate-900">@{post.ownerUsername}</p>
                <span className="text-xs uppercase text-slate-400">Owner</span>
              </div>
              <button className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-600">View profile</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-100 p-4">
                <p className="text-sm text-slate-500">Likes</p>
                <p className="text-2xl font-semibold text-slate-900">{formatCompactNumber(post.likeCount)}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 p-4">
                <p className="text-sm text-slate-500">Comments</p>
                <p className="text-2xl font-semibold text-slate-900">{formatCompactNumber(post.commentCount)}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="flex-1 rounded-2xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600" onClick={() => console.log('Delete post', post.id)}>
                Delete post
              </button>
              <button className="flex-1 rounded-2xl border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-600" onClick={() => console.log('Toggle visibility', post.id)}>
                {post.visibility === 'PUBLIC' ? 'Hide post' : 'Unhide post'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
        <h3 className="text-lg font-semibold text-slate-900">Bình luận mới nhất</h3>
        <div className="mt-4 max-h-80 space-y-3 overflow-y-auto">
          {post.comments.map((comment) => (
            <div key={comment.id} className="rounded-2xl border border-slate-100 p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-900">@{comment.authorUsername}</p>
                <span className="text-xs text-slate-400">{formatDate(comment.createdAt)}</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{comment.content}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}


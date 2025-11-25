import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts'
import type { GroupDetail } from '../../types'
import { groupApi } from '../../services/api/groupApi'
import { formatDate } from '../../utils/formatters'

type GroupTab = 'members' | 'activity'

export const GroupDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [group, setGroup] = useState<GroupDetail | null>(null)
  const [tab, setTab] = useState<GroupTab>('members')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let active = true
    setLoading(true)
    groupApi
      .getGroupById(id)
      .then((response) => {
        if (active) setGroup(response)
      })
      .catch(() => navigate('/admin/groups'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [id, navigate])

  if (loading || !group) {
    return <div className="rounded-3xl bg-white p-8 shadow-card">Đang tải thông tin group...</div>
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
        <div className="flex flex-wrap items-center gap-6">
          {group.avatarUrl ? (
            <img src={group.avatarUrl} alt={group.name} className="h-24 w-24 rounded-3xl object-cover" />
          ) : (
            <div className="h-24 w-24 rounded-3xl bg-slate-200" />
          )}
          <div className="flex-1 min-w-[240px]">
            <p className="text-2xl font-bold text-slate-900">{group.name}</p>
            <p className="text-sm text-slate-500">Owner: {group.ownerName}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
              <span>Thành viên: {group.memberCount}</span>
              <span>Messages: {group.messageCount}</span>
              <span>Tạo ngày: {formatDate(group.createdAt)}</span>
              <span>Cập nhật: {formatDate(group.updatedAt)}</span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <button
              className="rounded-2xl border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-600"
              onClick={async () => {
                const updated = await groupApi.toggleArchive(group.id)
                setGroup((prev) => (prev ? { ...prev, status: updated.status } : prev))
              }}
            >
              {group.status === 'ACTIVE' ? 'Archive group' : 'Unarchive group'}
            </button>
            <button
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
              onClick={() => console.log('Export members', group.id)}
            >
              Export member list
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
        <div className="flex gap-3">
          {(['members', 'activity'] as GroupTab[]).map((item) => (
            <button
              key={item}
              className={`rounded-2xl px-4 py-2 text-sm font-medium ${
                tab === item ? 'bg-brand-gradient text-white shadow-card' : 'bg-slate-100 text-slate-600'
              }`}
              onClick={() => setTab(item)}
            >
              {item === 'members' ? 'Members' : 'Activity'}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === 'members' && (
            <div className="grid gap-3 md:grid-cols-2">
              {group.members.map((member) => (
                <div key={member.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3">
                  <img src={member.avatarUrl} alt={member.fullName} className="h-12 w-12 rounded-2xl object-cover" />
                  <div>
                    <p className="font-semibold text-slate-900">{member.fullName}</p>
                    <p className="text-sm text-slate-500">@{member.username}</p>
                  </div>
                  <span
                    className={`ml-auto rounded-full px-3 py-1 text-xs font-semibold ${
                      member.role === 'admin' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          )}
          {tab === 'activity' && (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={group.activity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="messages" fill="#ac4abb" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


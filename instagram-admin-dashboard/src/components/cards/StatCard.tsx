import {
  ChatBubbleLeftRightIcon,
  HeartIcon,
  PhotoIcon,
  PlayCircleIcon,
  UserCircleIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import { formatCompactNumber, formatPercent } from '../../utils/formatters'
import type { StatCardMetric } from '../../types'

const iconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  users: UsersIcon,
  posts: PhotoIcon,
  reels: PlayCircleIcon,
  groups: UserCircleIcon,
  likes: HeartIcon,
  comments: ChatBubbleLeftRightIcon,
}

interface StatCardProps {
  metric: StatCardMetric
}

export const StatCard = ({ metric }: StatCardProps) => {
  const Icon = iconMap[metric.icon] ?? UsersIcon
  const isPositive = metric.change >= 0
  return (
    <div className="rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-card transition hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <div className="rounded-2xl bg-brand-gradient/80 p-3 text-white">
          <Icon className="h-5 w-5" />
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
          }`}
        >
          {formatPercent(metric.change)}
        </span>
      </div>
      <p className="mt-5 text-sm text-slate-500">{metric.label}</p>
      <p className="text-3xl font-semibold text-slate-900">{formatCompactNumber(metric.value)}</p>
    </div>
  )
}


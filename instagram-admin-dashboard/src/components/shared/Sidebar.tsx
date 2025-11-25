import { NavLink } from 'react-router-dom'
import {
  ChartBarSquareIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  HomeModernIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'

const navItems = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: HomeModernIcon },
  { label: 'Users', to: '/admin/users', icon: UserGroupIcon },
  { label: 'Posts & Reels', to: '/admin/posts', icon: ChartBarSquareIcon },
  { label: 'Groups', to: '/admin/groups', icon: ChatBubbleOvalLeftEllipsisIcon },
]

export const Sidebar = () => {
  return (
    <aside className="flex h-screen w-64 flex-col border-r border-white/10 bg-slate-950/95 px-6 py-8 text-white">
      <div className="mb-8 flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-brand-gradient shadow-card" />
        <div>
          <p className="text-lg font-semibold tracking-wide">Instagram Admin</p>
          <span className="text-xs text-white/60">Control Center</span>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition',
                  isActive
                    ? 'bg-brand-gradient text-white shadow-card'
                    : 'text-white/70 hover:bg-white/5 hover:text-white',
                )
              }
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
      <p className="text-xs text-white/50">© {new Date().getFullYear()} MediaShare</p>
    </aside>
  )
}


import { useState } from 'react'
import { MagnifyingGlassIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../../hooks/useAuth'

interface TopbarProps {
  breadcrumbs: string[]
  title: string
}

export const Topbar = ({ breadcrumbs, title }: TopbarProps) => {
  const { admin, logout } = useAuth()
  const [showMenu, setShowMenu] = useState(false)
  const avatarSrc = admin?.avatarUrl ?? 'https://i.pravatar.cc/150?img=15'

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-8 py-4 backdrop-blur-md">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">{breadcrumbs.join(' / ')}</p>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Global search"
            className="w-64 rounded-full border border-slate-200 px-10 py-2 text-sm text-slate-600 outline-none focus:border-brand-high focus:ring-2 focus:ring-brand-high/40"
          />
        </div>
        <div className="relative">
          <button
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm transition hover:border-brand-high hover:text-brand-high"
            onClick={() => setShowMenu((prev) => !prev)}
          >
            <img src={avatarSrc} alt={admin?.fullName ?? 'Admin'} className="h-8 w-8 rounded-full object-cover" />
            <div className="hidden text-left text-sm leading-tight md:block">
              <p className="font-semibold text-slate-800">{admin?.fullName ?? 'Admin'}</p>
              <span className="text-xs uppercase text-slate-400">Super Admin</span>
            </div>
            <ChevronDownIcon className="h-4 w-4 text-slate-500" />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-slate-100 bg-white p-3 shadow-xl">
              <button
                className="w-full rounded-xl px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
                onClick={logout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}


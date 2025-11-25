import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '../components/shared/Sidebar'
import { Topbar } from '../components/shared/Topbar'

const labelMap: Record<string, string> = {
  dashboard: 'Dashboard',
  users: 'Users',
  posts: 'Posts & Reels',
  groups: 'Groups',
}

const formatSegment = (segment: string) => labelMap[segment] ?? segment.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())

export const AdminLayout = () => {
  const location = useLocation()
  const segments = location.pathname.split('/').filter(Boolean)
  const breadcrumbs = ['Admin']

  if (segments.length > 1) {
    segments.slice(1).forEach((segment) => {
      breadcrumbs.push(formatSegment(segment))
    })
  } else {
    breadcrumbs.push('Dashboard')
  }

  const title = breadcrumbs[breadcrumbs.length - 1]

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar breadcrumbs={breadcrumbs} title={title} />
        <main className="flex-1 overflow-y-auto px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}


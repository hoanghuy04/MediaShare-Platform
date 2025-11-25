import { Navigate, createBrowserRouter } from 'react-router-dom'
import { LoginPage } from '../pages/auth/LoginPage'
import { AdminLayout } from '../layouts/AdminLayout'
import { PrivateRoute } from '../components/shared/PrivateRoute'
import { DashboardPage } from '../pages/dashboard/DashboardPage'
import { UsersPage } from '../pages/users/UsersPage'
import { UserDetailPage } from '../pages/users/UserDetailPage'
import { PostsPage } from '../pages/posts/PostsPage'
import { PostDetailPage } from '../pages/posts/PostDetailPage'
import { GroupsPage } from '../pages/groups/GroupsPage'
import { GroupDetailPage } from '../pages/groups/GroupDetailPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/admin/dashboard" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/admin',
    element: <PrivateRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'users', element: <UsersPage /> },
          { path: 'users/:id', element: <UserDetailPage /> },
          { path: 'posts', element: <PostsPage /> },
          { path: 'posts/:id', element: <PostDetailPage /> },
          { path: 'groups', element: <GroupsPage /> },
          { path: 'groups/:id', element: <GroupDetailPage /> },
          { path: '', element: <Navigate to="dashboard" replace /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/admin/dashboard" replace />,
  },
])


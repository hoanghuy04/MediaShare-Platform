import { useEffect, useState } from 'react'
import { EyeIcon, EyeSlashIcon, LockClosedIcon, UserIcon } from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export const LoginPage = () => {
  const navigate = useNavigate()
  const { login, loading, isAuthenticated } = useAuth()
  const [form, setForm] = useState({ usernameOrEmail: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.usernameOrEmail || !form.password) {
      setError('Vui lòng nhập đầy đủ thông tin')
      return
    }
    try {
      setError(null)
      await login(form)
      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      setError((err as Error).message || 'Đăng nhập thất bại')
    }
  }

  return (
    <div className="min-h-screen bg-brand-gradient p-4">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-lg items-center justify-center">
        <div className="w-full rounded-[32px] bg-white/95 p-10 shadow-2xl backdrop-blur">
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-high">Instagram Admin</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Đăng nhập</h1>
            <p className="text-sm text-slate-500">Chỉ dành cho quản trị viên hệ thống.</p>
          </div>
          {error && (
            <div className="mb-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>
          )}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-medium text-slate-600">Username hoặc email</label>
              <div className="relative mt-1">
                <UserIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-2xl border border-slate-200 px-12 py-3 text-slate-700 outline-none focus:border-brand-high focus:ring-2 focus:ring-brand-high/30"
                  name="usernameOrEmail"
                  value={form.usernameOrEmail}
                  onChange={handleChange}
                  placeholder="admin@example.com"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Mật khẩu</label>
              <div className="relative mt-1">
                <LockClosedIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-2xl border border-slate-200 px-12 py-3 text-slate-700 outline-none focus:border-brand-high focus:ring-2 focus:ring-brand-high/30"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-brand-gradient py-3 text-base font-semibold text-white shadow-card transition hover:opacity-95 disabled:opacity-60"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}


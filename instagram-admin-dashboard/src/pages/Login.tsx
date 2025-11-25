import { useState } from "react";
import { useAuthContext } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

export function LoginPage() {
  const { login, loading } = useAuthContext();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(usernameOrEmail, password);
    } catch (err) {
      setError("Invalid credentials or server error.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5f0f8e] via-[#8f3ab8] to-[#c86ad3] flex items-center justify-center px-4">
      <div className="bg-white/95 backdrop-blur rounded-3xl shadow-2xl w-full max-w-lg p-10 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white text-2xl font-bold">
            IG
          </div>
          <h1 className="text-3xl font-semibold text-gray-900">Admin Console</h1>
          <p className="text-sm text-gray-500">
            Please sign in with your administrator credentials.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-700">Email or Username</label>
            <input
              type="text"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-primary/30 focus:border-primary/40 outline-none"
              placeholder="admin@example.com"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-primary/30 focus:border-primary/40 outline-none"
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="text-sm text-rose-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-2xl py-3 bg-gradient-to-r from-primary to-primary-dark text-white font-semibold shadow-lg shadow-primary/40 hover:translate-y-0.5 transition disabled:opacity-70"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign In
          </button>
        </form>

        <p className="text-xs text-center text-gray-400">
          Registration is disabled. Contact system administrator if you need help accessing the dashboard.
        </p>
      </div>
    </div>
  );
}


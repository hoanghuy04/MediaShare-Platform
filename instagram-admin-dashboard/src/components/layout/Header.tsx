import { Bell, Search, ChevronDown } from "lucide-react";

import { useAuthContext } from "../../context/AuthContext";

type HeaderProps = {
  title: string;
};

export function Header({ title }: HeaderProps) {
  const { user, logout } = useAuthContext();

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-gray-100 px-6 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-500">Monitor and manage community content</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            placeholder="Search users, posts..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-primary/40 focus:border-transparent outline-none text-sm"
          />
        </div>

        <button className="p-2 rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100">
          <Bell className="h-5 w-5" />
        </button>

        <button className="flex items-center gap-2 px-3 py-2 rounded-full border border-gray-200 hover:border-primary/40 transition" onClick={logout}>
          <img
            src={user?.avatar ?? "https://i.pravatar.cc/100?img=52"}
            className="h-8 w-8 rounded-full object-cover"
            alt="Admin avatar"
          />
          <div className="text-left hidden md:block">
            <p className="text-sm font-semibold text-gray-900">{user?.username ?? "Admin"}</p>
            <p className="text-xs text-gray-500">{user?.role ?? "Super Admin"}</p>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>
      </div>
    </header>
  );
}


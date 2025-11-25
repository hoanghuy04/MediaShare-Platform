import { cn } from "../../utils/cn";
import type { PageKey } from "../../types";
import {
  LayoutDashboard,
  Users,
  Images,
  Clapperboard,
  BarChart3,
  Settings,
} from "lucide-react";

const menuItems: { key: PageKey; label: string; icon: React.ElementType }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "users", label: "Users", icon: Users },
  { key: "posts", label: "Posts", icon: Images },
  { key: "reels", label: "Reels", icon: Clapperboard },
];

type SidebarProps = {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
};

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <aside className="hidden lg:flex lg:flex-col w-64 bg-white/90 backdrop-blur border-r border-gray-100 px-6 py-8 gap-8">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-bold">
          IG
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-900">MediaShare</p>
          <p className="text-xs text-gray-500">Admin Suite</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "bg-gradient-to-r from-primary/15 to-primary/5 text-primary-dark"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive && "text-primary-dark")} />
              {item.label}
            </button>
          );
        })}

        <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col gap-1">
          <button className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-all">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </button>
          <button className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-all">
            <Settings className="h-4 w-4" />
            Settings
          </button>
        </div>
      </nav>
    </aside>
  );
}


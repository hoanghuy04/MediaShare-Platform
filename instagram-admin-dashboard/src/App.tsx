import { useMemo, useState } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { DashboardPage } from "./pages/Dashboard";
import { UsersPage } from "./pages/Users";
import { PostsPage } from "./pages/Posts";
import { ReelsPage } from "./pages/Reels";
import { LoginPage } from "./pages/Login";
import { useAuthContext } from "./context/AuthContext";
import type { PageKey } from "./types";

const pageTitleMap: Record<PageKey, string> = {
  dashboard: "Dashboard Overview",
  users: "User Management",
  posts: "Posts Moderation",
  reels: "Reels Oversight",
};

function App() {
  const { isAuthenticated, loading } = useAuthContext();
  const [activePage, setActivePage] = useState<PageKey>("dashboard");

  const pageContent = useMemo(() => {
    switch (activePage) {
      case "users":
        return <UsersPage />;
      case "posts":
        return <PostsPage />;
      case "reels":
        return <ReelsPage />;
      default:
        return <DashboardPage />;
    }
  }, [activePage]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-primary-dark text-white">
        <p className="text-lg font-semibold animate-pulse">Preparing admin console…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-surface text-gray-900 flex">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      <div className="flex-1 flex flex-col">
        <Header title={pageTitleMap[activePage]} />
        <main className="flex-1 px-4 py-6 lg:px-8">
          <div className="max-w-7xl mx-auto">{pageContent}</div>
        </main>
      </div>
    </div>
  );
}

export default App;

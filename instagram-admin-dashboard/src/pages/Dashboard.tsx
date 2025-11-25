import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { statCards, postTrendData, postVsReelData, topUsers } from "../data/mockData";
import { StatCard } from "../components/cards/StatCard";
import { cn } from "../utils/cn";

const timeFilters = ["7d", "30d", "90d"] as const;

export function DashboardPage() {
  const [timeframe, setTimeframe] = useState<(typeof timeFilters)[number]>("30d");

  return (
    <div className="flex flex-col gap-6">
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <StatCard key={card.id} data={card} />
        ))}
      </section>

      <section className="grid xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 xl:col-span-2 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-lg font-semibold text-gray-900">Posts Trend</p>
              <p className="text-sm text-gray-500">Daily posts in the selected window</p>
            </div>
            <div className="flex items-center gap-2 bg-gray-100 rounded-full p-1">
              {timeFilters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTimeframe(filter)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-semibold rounded-full transition",
                    timeframe === filter
                      ? "bg-white shadow text-primary-dark"
                      : "text-gray-500"
                  )}
                >
                  {filter.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={postTrendData}>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="posts"
                  stroke="#ac4abb"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-4">
          <p className="text-lg font-semibold text-gray-900">Posts vs Reels</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={postVsReelData}>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="posts" fill="#ac4abb" radius={[8, 8, 0, 0]} />
                <Bar dataKey="reels" fill="#7c2d8a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-lg font-semibold text-gray-900">Top Active Users</p>
            <p className="text-sm text-gray-500">Most engaged creators this week</p>
          </div>
          <button className="text-sm font-semibold text-primary-dark hover:text-primary">
            View all
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 uppercase text-xs tracking-wide">
                <th className="py-3">User</th>
                <th className="py-3">Email</th>
                <th className="py-3">Posts</th>
                <th className="py-3">Reels</th>
                <th className="py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/60">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {user.username}
                        </p>
                        <p className="text-xs text-gray-500">
                          Joined {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-gray-500">{user.email}</td>
                  <td className="py-3 font-semibold text-gray-900">
                    {user.totalPosts}
                  </td>
                  <td className="py-3 font-semibold text-gray-900">
                    {user.totalReels}
                  </td>
                  <td className="py-3">
                    <span
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-semibold",
                        user.status === "Active"
                          ? "bg-emerald-50 text-emerald-600"
                          : user.status === "Banned"
                          ? "bg-rose-50 text-rose-600"
                          : "bg-amber-50 text-amber-600"
                      )}
                    >
                      {user.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}


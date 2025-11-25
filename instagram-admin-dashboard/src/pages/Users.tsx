import { useMemo, useState } from "react";
import { Search, Filter } from "lucide-react";
import { users as mockUsers } from "../data/mockData";
import type { UserSummary } from "../types";
import { cn } from "../utils/cn";
import { UserDetailModal } from "../components/modals/UserDetailModal";

const statusFilters: ("All" | UserSummary["status"])[] = [
  "All",
  "Active",
  "Banned",
  "Pending",
];

export function UsersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<(typeof statusFilters)[number]>("All");
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);
  const [showModal, setShowModal] = useState(false);

  const filteredUsers = useMemo(() => {
    return mockUsers.filter((user) => {
      const matchesSearch =
        user.username.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === "All" ? true : user.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [search, status]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-gray-100 p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-lg font-semibold text-gray-900">User Management</p>
          <p className="text-sm text-gray-500">
            Search, filter and moderate community profiles
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-3 w-full lg:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search username or email"
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/30 outline-none text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as (typeof statusFilters)[number])
              }
              className="rounded-2xl border-gray-200 text-sm focus:ring-primary/40 focus:border-primary/40"
            >
              {statusFilters.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 uppercase text-xs tracking-wide">
              <th className="py-3">User</th>
              <th className="py-3">Role</th>
              <th className="py-3">Status</th>
              <th className="py-3">Created</th>
              <th className="py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50/70">
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={user.avatar}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">{user.username}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 text-gray-600">{user.role}</td>
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
                <td className="py-3 text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowModal(true);
                      }}
                      className="px-3 py-1.5 rounded-2xl border border-gray-200 text-gray-600 hover:border-primary/30"
                    >
                      View
                    </button>
                    <button className="px-3 py-1.5 rounded-2xl text-primary-dark hover:text-primary">
                      Edit
                    </button>
                    <button className="px-3 py-1.5 rounded-2xl text-rose-500 hover:text-rose-600">
                      {user.status === "Banned" ? "Unban" : "Ban"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <UserDetailModal
        user={selectedUser}
        open={showModal}
        onClose={() => setShowModal(false)}
        onSave={(user, updates) => {
          console.log("Save user", user.id, updates);
        }}
      />
    </div>
  );
}


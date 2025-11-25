import type { UserSummary } from "../../types";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  user: UserSummary | null;
  open: boolean;
  onClose: () => void;
  onSave: (user: UserSummary, updates: Partial<UserSummary>) => void;
};

const roleOptions: UserSummary["role"][] = ["User", "Moderator", "Admin"];
const statusOptions: UserSummary["status"][] = ["Active", "Banned", "Pending"];

export function UserDetailModal({ user, open, onClose, onSave }: Props) {
  const [role, setRole] = useState<UserSummary["role"]>("User");
  const [status, setStatus] = useState<UserSummary["status"]>("Active");

  useEffect(() => {
    if (user) {
      setRole(user.role);
      setStatus(user.status);
    }
  }, [user]);

  if (!open || !user) return null;

  const handleSave = () => {
    onSave(user, { role, status });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-40 p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">User Details</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-50 text-gray-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <img
              src={user.avatar}
              alt={user.username}
              className="h-20 w-20 rounded-2xl object-cover"
            />
            <div>
              <p className="text-xl font-semibold text-gray-900">
                {user.username}
              </p>
              <p className="text-gray-500">{user.email}</p>
              {user.bio && <p className="text-sm text-gray-500 mt-2">{user.bio}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat label="Posts" value={user.totalPosts} />
            <Stat label="Reels" value={user.totalReels} />
            <Stat label="Followers" value={user.followers.toLocaleString()} />
            <Stat label="Following" value={user.following} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserSummary["role"])}
                className="rounded-2xl border-gray-200 focus:ring-primary/40 focus:border-primary/40"
              >
                {roleOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Status</label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as UserSummary["status"])
                }
                className="rounded-2xl border-gray-200 focus:ring-primary/40 focus:border-primary/40"
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/60">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-2xl border border-gray-200 text-gray-600 hover:bg-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-primary to-primary-dark text-white font-semibold shadow shadow-primary/20"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-gray-100 p-3 text-center bg-white">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}


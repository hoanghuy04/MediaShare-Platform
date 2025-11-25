import { useMemo, useState } from "react";
import { reels as mockReels } from "../data/mockData";
import type { ReelSummary } from "../types";
import { Search } from "lucide-react";
import { cn } from "../utils/cn";
import { ReelDetailModal } from "../components/modals/ReelDetailModal";

const statusFilters: ("All" | ReelSummary["status"])[] = [
  "All",
  "Published",
  "Hidden",
  "Reported",
];

export function ReelsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<(typeof statusFilters)[number]>("All");
  const [selectedReel, setSelectedReel] = useState<ReelSummary | null>(null);
  const [open, setOpen] = useState(false);

  const filteredReels = useMemo(() => {
    return mockReels.filter((reel) => {
      const matchesSearch =
        reel.caption.toLowerCase().includes(search.toLowerCase()) ||
        reel.user.username.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === "All" ? true : reel.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [search, status]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-gray-100 p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-lg font-semibold text-gray-900">Reel Moderation</p>
          <p className="text-sm text-gray-500">Video-first insights & actions</p>
        </div>
        <div className="flex flex-col md:flex-row gap-3 w-full lg:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search caption or creator"
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/30 outline-none text-sm"
            />
          </div>
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

      <div className="grid gap-4">
        {filteredReels.map((reel) => (
          <div
            key={reel.id}
            className="bg-white border border-gray-100 rounded-3xl p-4 flex flex-col md:flex-row gap-4"
          >
            <div className="relative h-44 w-full md:w-48 overflow-hidden rounded-2xl">
              <img
                src={reel.thumbnail}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <span className="absolute bottom-2 right-2 text-xs px-2 py-1 rounded-full bg-black/60 text-white">
                {reel.duration}
              </span>
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={reel.user.avatar}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-gray-900">{reel.user.username}</p>
                  <p className="text-xs text-gray-500">{reel.user.email}</p>
                </div>
                <span
                  className={cn(
                    "ml-auto px-3 py-1 rounded-full text-xs font-semibold",
                    reel.status === "Published"
                      ? "bg-emerald-50 text-emerald-600"
                      : reel.status === "Hidden"
                      ? "bg-amber-50 text-amber-600"
                      : "bg-rose-50 text-rose-600"
                  )}
                >
                  {reel.status}
                </span>
              </div>

              <p className="text-sm text-gray-600 overflow-hidden text-ellipsis">
                {reel.caption}
              </p>

              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <p>Views: {reel.views.toLocaleString()}</p>
                <p>Likes: {reel.likes.toLocaleString()}</p>
                <p>Comments: {reel.comments.toLocaleString()}</p>
                <p>{new Date(reel.createdAt).toLocaleString()}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setSelectedReel(reel);
                    setOpen(true);
                  }}
                  className="px-4 py-2 rounded-2xl border border-gray-200 text-gray-600 hover:border-primary/40"
                >
                  View
                </button>
                <button className="px-4 py-2 rounded-2xl text-primary-dark hover:text-primary">
                  {reel.status === "Hidden" ? "Unhide" : "Hide"}
                </button>
                <button className="px-4 py-2 rounded-2xl text-rose-500 hover:text-rose-600">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredReels.length === 0 && (
          <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-10 text-center text-gray-500">
            No reels match the current filters.
          </div>
        )}
      </div>

      <ReelDetailModal
        reel={selectedReel}
        open={open}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}


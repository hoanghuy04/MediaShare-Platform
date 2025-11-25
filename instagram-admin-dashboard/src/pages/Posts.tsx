import { useMemo, useState } from "react";
import { posts as mockPosts } from "../data/mockData";
import type { PostSummary } from "../types";
import { Search, ImagePlus } from "lucide-react";
import { cn } from "../utils/cn";
import { PostDetailModal } from "../components/modals/PostDetailModal";

const typeFilters: ("All" | PostSummary["type"])[] = [
  "All",
  "Image",
  "Carousel",
  "Reel",
];

export function PostsPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<(typeof typeFilters)[number]>("All");
  const [selectedPost, setSelectedPost] = useState<PostSummary | null>(null);
  const [open, setOpen] = useState(false);

  const filteredPosts = useMemo(() => {
    return mockPosts.filter((post) => {
      const matchesSearch =
        post.caption.toLowerCase().includes(search.toLowerCase()) ||
        post.user.username.toLowerCase().includes(search.toLowerCase());
      const matchesType = type === "All" ? true : post.type === type;
      return matchesSearch && matchesType;
    });
  }, [search, type]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-gray-100 p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-lg font-semibold text-gray-900">Post Moderation</p>
          <p className="text-sm text-gray-500">
            Review reports, hide or delete inappropriate content
          </p>
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
            value={type}
            onChange={(e) => setType(e.target.value as (typeof typeFilters)[number])}
            className="rounded-2xl border-gray-200 text-sm focus:ring-primary/40 focus:border-primary/40"
          >
            {typeFilters.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredPosts.map((post) => (
          <div
            key={post.id}
            className="bg-white border border-gray-100 rounded-3xl p-4 flex flex-col md:flex-row gap-4"
          >
            <img
              src={post.thumbnail}
              className="h-44 w-full md:w-48 rounded-2xl object-cover"
            />
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={post.user.avatar}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-gray-900">{post.user.username}</p>
                  <p className="text-xs text-gray-500">{post.user.email}</p>
                </div>
                <span
                  className={cn(
                    "ml-auto px-3 py-1 rounded-full text-xs font-semibold",
                    post.status === "Published"
                      ? "bg-emerald-50 text-emerald-600"
                      : post.status === "Hidden"
                      ? "bg-amber-50 text-amber-600"
                      : "bg-rose-50 text-rose-600"
                  )}
                >
                  {post.status}
                </span>
              </div>

              <p className="text-sm text-gray-600 overflow-hidden text-ellipsis">
                {post.caption}
              </p>

              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <p>Likes: {post.likes.toLocaleString()}</p>
                <p>Comments: {post.comments.toLocaleString()}</p>
                <p>Shares: {post.shares.toLocaleString()}</p>
                <p>{new Date(post.createdAt).toLocaleString()}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setSelectedPost(post);
                    setOpen(true);
                  }}
                  className="px-4 py-2 rounded-2xl border border-gray-200 text-gray-600 hover:border-primary/40"
                >
                  View
                </button>
                <button className="px-4 py-2 rounded-2xl text-primary-dark hover:text-primary">
                  {post.status === "Hidden" ? "Unhide" : "Hide"}
                </button>
                <button className="px-4 py-2 rounded-2xl text-rose-500 hover:text-rose-600">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredPosts.length === 0 && (
          <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-10 text-center text-gray-500 flex flex-col items-center gap-2">
            <ImagePlus className="h-10 w-10 text-gray-300" />
            <p>No posts match your search.</p>
          </div>
        )}
      </div>

      <PostDetailModal
        post={selectedPost}
        open={open}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}


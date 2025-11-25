import type { PostSummary } from "../../types";
import { X, EyeOff, Trash2 } from "lucide-react";

type Props = {
  post: PostSummary | null;
  open: boolean;
  onClose: () => void;
};

export function PostDetailModal({ post, open, onClose }: Props) {
  if (!open || !post) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-40 p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-3xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-lg font-semibold text-gray-900">Post Detail</p>
            <p className="text-sm text-gray-500">#{post.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-50 text-gray-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6 p-6">
          <img
            src={post.mediaUrl}
            alt={post.caption}
            className="w-full h-72 object-cover rounded-2xl"
          />
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={post.user.avatar}
                className="h-12 w-12 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold text-gray-900">{post.user.username}</p>
                <p className="text-sm text-gray-500">{post.user.email}</p>
              </div>
            </div>

            <p className="text-gray-700 text-sm leading-relaxed">{post.caption}</p>

            <div className="grid grid-cols-3 gap-3">
              <Stat label="Likes" value={post.likes} />
              <Stat label="Comments" value={post.comments} />
              <Stat label="Shares" value={post.shares} />
            </div>

            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-2xl border border-gray-200 text-gray-600 hover:bg-gray-50">
                <EyeOff className="h-4 w-4" />
                {post.status === "Hidden" ? "Unhide Post" : "Hide Post"}
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100">
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-gray-100 p-3 text-center bg-white">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-gray-900">{value.toLocaleString()}</p>
    </div>
  );
}


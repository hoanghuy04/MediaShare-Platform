import type { ReelSummary } from "../../types";
import { X, EyeOff, Trash2 } from "lucide-react";

type Props = {
  reel: ReelSummary | null;
  open: boolean;
  onClose: () => void;
};

export function ReelDetailModal({ reel, open, onClose }: Props) {
  if (!open || !reel) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-40 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-lg font-semibold text-gray-900">Reel Detail</p>
            <p className="text-sm text-gray-500">#{reel.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-50 text-gray-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 p-6">
          <div className="rounded-2xl overflow-hidden bg-black">
            <video controls className="w-full h-80 object-cover">
              <source src={reel.videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={reel.user.avatar}
                className="h-12 w-12 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold text-gray-900">{reel.user.username}</p>
                <p className="text-sm text-gray-500">{reel.user.email}</p>
              </div>
            </div>

            <p className="text-gray-700 text-sm leading-relaxed">{reel.caption}</p>

            <div className="grid grid-cols-2 gap-3">
              <Stat label="Views" value={reel.views} />
              <Stat label="Likes" value={reel.likes} />
              <Stat label="Comments" value={reel.comments} />
              <Stat label="Duration" value={reel.duration} />
            </div>

            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-2xl border border-gray-200 text-gray-600 hover:bg-gray-50">
                <EyeOff className="h-4 w-4" />
                {reel.status === "Hidden" ? "Unhide Reel" : "Hide Reel"}
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

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-gray-100 p-3 text-center bg-white">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-gray-900">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  );
}


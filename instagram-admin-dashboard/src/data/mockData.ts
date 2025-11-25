import type { ReelSummary, StatCardData, TrendPoint, UserSummary, PostSummary } from "../types";

export const statCards: StatCardData[] = [
  { id: "users", label: "Total Users", value: "12.4K", change: 8.4, icon: "users" },
  { id: "posts", label: "Total Posts", value: "64.1K", change: 5.2, icon: "image" },
  { id: "reels", label: "Total Reels", value: "21.7K", change: -2.3, icon: "video" },
  { id: "active", label: "Active Today", value: "4.3K", change: 12.1, icon: "activity" },
];

export const postTrendData: TrendPoint[] = Array.from({ length: 12 }).map((_, idx) => {
  const base = 40 + Math.round(Math.random() * 30);
  return {
    date: `2025-11-${(idx + 1).toString().padStart(2, "0")}`,
    posts: base,
  };
});

export const postVsReelData: TrendPoint[] = Array.from({ length: 8 }).map((_, idx) => ({
  date: `W${idx + 1}`,
  posts: 150 + Math.round(Math.random() * 40),
  reels: 110 + Math.round(Math.random() * 50),
}));

export const topUsers: UserSummary[] = [
  {
    id: "u1",
    avatar: "https://i.pravatar.cc/150?img=1",
    username: "aria.mendes",
    email: "aria@example.com",
    role: "User",
    status: "Active",
    totalPosts: 348,
    totalReels: 96,
    followers: 12000,
    following: 820,
    createdAt: "2024-01-12",
  },
  {
    id: "u2",
    avatar: "https://i.pravatar.cc/150?img=5",
    username: "leo.wang",
    email: "leo@example.com",
    role: "Moderator",
    status: "Active",
    totalPosts: 285,
    totalReels: 73,
    followers: 9800,
    following: 640,
    createdAt: "2023-11-02",
  },
  {
    id: "u3",
    avatar: "https://i.pravatar.cc/150?img=12",
    username: "noah_arts",
    email: "noah@example.com",
    role: "User",
    status: "Active",
    totalPosts: 192,
    totalReels: 55,
    followers: 7200,
    following: 510,
    createdAt: "2024-04-20",
  },
  {
    id: "u4",
    avatar: "https://i.pravatar.cc/150?img=15",
    username: "sophia.vibes",
    email: "sophia@example.com",
    role: "User",
    status: "Active",
    totalPosts: 265,
    totalReels: 80,
    followers: 8400,
    following: 430,
    createdAt: "2024-02-05",
  },
  {
    id: "u5",
    avatar: "https://i.pravatar.cc/150?img=30",
    username: "kai.motion",
    email: "kai@example.com",
    role: "User",
    status: "Pending",
    totalPosts: 143,
    totalReels: 41,
    followers: 5600,
    following: 320,
    createdAt: "2024-08-15",
  },
];

export const users: UserSummary[] = [
  ...topUsers,
  {
    id: "u6",
    avatar: "https://i.pravatar.cc/150?img=18",
    username: "mia.codes",
    email: "mia@example.com",
    role: "Admin",
    status: "Active",
    totalPosts: 89,
    totalReels: 12,
    followers: 4200,
    following: 190,
    createdAt: "2022-10-10",
    bio: "Lead content curator",
  },
  {
    id: "u7",
    avatar: "https://i.pravatar.cc/150?img=25",
    username: "ethan.snap",
    email: "ethan@example.com",
    role: "User",
    status: "Banned",
    totalPosts: 320,
    totalReels: 102,
    followers: 15000,
    following: 1020,
    createdAt: "2023-05-08",
    bio: "Travel addict & photographer",
  },
];

export const posts: PostSummary[] = users.slice(0, 6).map((user, idx) => ({
  id: `p${idx + 1}`,
  thumbnail: `https://source.unsplash.com/random/400x40${idx}?sig=${idx}`,
  caption: "Sunset vibes with pastel gradients over the skyline #cityscape #sunsetlover",
  user,
  likes: 2300 + idx * 150,
  comments: 320 + idx * 25,
  shares: 120 + idx * 10,
  createdAt: "2025-11-1" + idx,
  status: idx % 3 === 0 ? "Reported" : idx % 2 === 0 ? "Hidden" : "Published",
  type: idx % 2 === 0 ? "Image" : "Carousel",
  mediaUrl: `https://source.unsplash.com/random/1200x80${idx}?sig=${idx}`,
}));

export const reels: ReelSummary[] = users.slice(1, 7).map((user, idx) => ({
  id: `r${idx + 1}`,
  thumbnail: `https://source.unsplash.com/random/600x80${idx}?video=${idx}`,
  caption: "Behind the scenes from today's creative shoot!",
  user,
  duration: `0${idx + 1}:${15 + idx}`,
  views: 5400 + idx * 800,
  likes: 1200 + idx * 150,
  comments: 180 + idx * 20,
  createdAt: "2025-10-2" + idx,
  status: idx % 3 === 0 ? "Hidden" : "Published",
  videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
}));


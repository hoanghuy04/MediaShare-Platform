export type PageKey = "dashboard" | "users" | "posts" | "reels";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface StatCardData {
  id: string;
  label: string;
  value: string;
  change: number;
  icon: string;
}

export interface TrendPoint {
  date: string;
  posts: number;
  reels?: number;
}

export interface UserSummary {
  id: string;
  avatar: string;
  username: string;
  email: string;
  role: "User" | "Moderator" | "Admin";
  status: "Active" | "Banned" | "Pending";
  totalPosts: number;
  totalReels: number;
  followers: number;
  following: number;
  createdAt: string;
  bio?: string;
}

export interface PostSummary {
  id: string;
  thumbnail: string;
  caption: string;
  user: UserSummary;
  likes: number;
  comments: number;
  shares: number;
  createdAt: string;
  status: "Published" | "Hidden" | "Reported";
  type: "Image" | "Carousel" | "Reel";
  mediaUrl: string;
}

export interface ReelSummary {
  id: string;
  thumbnail: string;
  caption: string;
  user: UserSummary;
  duration: string;
  views: number;
  likes: number;
  comments: number;
  createdAt: string;
  status: "Published" | "Hidden" | "Reported";
  videoUrl: string;
}


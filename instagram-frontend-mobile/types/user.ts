export interface UserProfile {
  id: string;
  username: string;
  email: string;
  fullName: string;
  profileImage?: string;
  coverImage?: string;
  bio?: string;
  website?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowing?: boolean;
  isFollowedBy?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  bio?: string;
  website?: string;
  profileImage?: string;
  coverImage?: string;
}

export interface FollowResponse {
  success: boolean;
  isFollowing: boolean;
  message: string;
}

export interface UserStats {
  followersCount: number;
  followingCount: number;
  postsCount: number;
}


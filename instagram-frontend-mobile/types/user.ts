import { UserRole } from './enum.type';

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatar?: string;
  coverImage?: string;
  website?: string;
  location?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  profile?: UserProfile;
  roles?: UserRole[];
  followersCount: number;
  followingCount: number;
  isPrivate: boolean;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserResponse extends User {
  postsCount?: number;
  isFollowing?: boolean;
  isFollowedBy?: boolean;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  bio?: string;
  website?: string;
  location?: string;
  isPrivate?: boolean;
  avatar?: string;
}

export interface UserStatsResponse {
  userId: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
}

export interface FollowResponse {
  success: boolean;
  isFollowing: boolean;
  message: string;
}

// Legacy types for backward compatibility
export interface ProfileData extends UserProfile {}

export interface UpdateProfileRequest {
  fullName?: string;
  bio?: string;
  website?: string;
  profileImage?: string;
  coverImage?: string;
}

export interface UserStats {
  followersCount: number;
  followingCount: number;
  postsCount: number;
}

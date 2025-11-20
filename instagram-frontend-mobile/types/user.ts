import { UserRole } from './enum.type';

export interface ProfileData {
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatar?: string;
  coverImage?: string;
  website?: string;
  location?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  profile?: ProfileData;
  roles?: string[];
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  isPrivate?: boolean;
  isVerified?: boolean;
  isActive?: boolean;
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

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  profile: UserProfile | null;
  roles: UserRole[];
  followersCount: number;
  followingCount: number;
  isPrivate: boolean;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

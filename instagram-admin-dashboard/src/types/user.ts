import type { PageResponse, SortDirection } from './api'
import type { Post } from './post'

export type UserStatus = 'ACTIVE' | 'BANNED'

export interface UserProfileInfo {
  firstName?: string
  lastName?: string
  bio?: string
  avatar?: string
  coverImage?: string
  website?: string
  location?: string
}

export interface User {
  id: string
  username: string
  fullName: string
  email?: string
  avatarUrl?: string
  followerCount: number
  followingCount: number
  postCount?: number
  bio?: string
  website?: string
  createdAt: string
  status: UserStatus
  profile?: UserProfileInfo
}

export interface UserStats {
  posts: number
  likes: number
  comments: number
  followers: number
  following: number
}

export interface UserActivity extends UserStats {
  userId: string
  username: string
  fullName: string
  avatarUrl: string
}

export interface UserListFilters {
  search?: string
  status?: UserStatus | 'ALL'
  page?: number
  size?: number
  sort?: 'createdAt' | 'followerCount' | 'postCount'
  direction?: SortDirection
}

export interface UserPostsResponse {
  user: User
  posts: Post[]
}

export interface UserFollower {
  id: string
  username: string
  avatarUrl?: string
  followingByCurrentUser?: boolean
}

export type UserPageResponse = PageResponse<User>


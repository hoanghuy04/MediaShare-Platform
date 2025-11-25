import type { PostType } from './post'
import type { TimeRange } from './api'
import type { UserActivity } from './user'

export interface StatCardMetric {
  id: string
  label: string
  value: number
  change: number
  icon: string
}

export interface TrendPoint {
  date: string
  value: number
}

export interface PostsVsReelsPoint {
  date: string
  posts: number
  reels: number
}

export interface LikesPoint {
  date: string
  likes: number
}

export interface CommentsPoint {
  date: string
  comments: number
}

export interface PostDistributionSlice {
  type: PostType
  value: number
}

export interface TopPost {
  id: string
  caption: string
  likeCount: number
  commentCount: number
  ownerUsername: string
  thumbnailUrl: string
}

export interface DashboardStats {
  range: TimeRange
  metrics: StatCardMetric[]
  newUsers: TrendPoint[]
  postsVsReels: PostsVsReelsPoint[]
  likesTrend: LikesPoint[]
  commentsTrend: CommentsPoint[]
  postDistribution: PostDistributionSlice[]
  topActiveUsers: UserActivity[]
  topPosts: TopPost[]
}


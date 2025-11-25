import type { PageResponse, SortDirection } from './api'

export type PostType = 'POST' | 'REEL'
export type PostVisibility = 'PUBLIC' | 'HIDDEN'

export interface Comment {
  id: string
  authorId: string
  authorUsername: string
  content: string
  createdAt: string
}

export interface Post {
  id: string
  caption: string
  thumbnailUrl: string
  mediaUrl: string
  type: PostType
  likeCount: number
  commentCount: number
  createdAt: string
  ownerId: string
  ownerUsername: string
  ownerAvatar: string
  visibility: PostVisibility
}

export interface PostListFilters {
  search?: string
  type?: PostType | 'ALL'
  status?: PostVisibility | 'ALL'
  from?: string
  to?: string
  page?: number
  size?: number
  sort?: 'createdAt' | 'likeCount' | 'commentCount'
  direction?: SortDirection
}

export interface PostDetail extends Post {
  comments: Comment[]
}

export type PostPageResponse = PageResponse<Post>


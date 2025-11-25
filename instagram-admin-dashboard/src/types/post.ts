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

export interface PostOwner {
  id: string
  username: string
  avatarUrl?: string
}

export interface PostMedia {
  id?: string
  url: string
  category?: 'IMAGE' | 'VIDEO' | 'AUDIO'
  contentType?: string
}

export interface Post {
  id: string
  caption: string
  type: PostType
  likeCount: number
  commentCount: number
  createdAt: string
  owner: PostOwner
  media: PostMedia[]
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


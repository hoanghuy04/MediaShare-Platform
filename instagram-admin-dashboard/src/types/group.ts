import type { PageResponse, SortDirection } from './api'

export type GroupStatus = 'ACTIVE' | 'ARCHIVED'

export interface GroupMember {
  id: string
  username: string
  fullName: string
  avatarUrl?: string
  role: 'admin' | 'member'
}

export interface GroupConversation {
  id: string
  name: string
  avatarUrl?: string
  memberCount: number
  messageCount: number
  createdAt: string
  lastActivityAt?: string
  status: GroupStatus
  ownerId?: string
  ownerName?: string
}

export interface GroupListFilters {
  search?: string
  status?: GroupStatus | 'ALL'
  page?: number
  size?: number
  sort?: 'createdAt' | 'memberCount'
  direction?: SortDirection
}

export interface GroupDetail extends GroupConversation {
  members: GroupMember[]
  admins: GroupMember[]
  activity: { date: string; messages: number }[]
}

export type GroupPageResponse = PageResponse<GroupConversation>


import type { PageResponse, User, UserFollower, UserListFilters, UserStats } from '../../types'
import { mockPosts, mockUserStats, mockUsers } from '../../data/mockData'
import apiClient from './apiClient'
import { normalizePage } from './helpers'
import { postApi } from './postApi'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms))

interface BackendUserResponse {
  id: string
  username: string
  email?: string
  profile?: {
    firstName?: string
    lastName?: string
    bio?: string
    avatar?: string
    website?: string
    location?: string
  }
  followersCount?: number
  followingCount?: number
  private?: boolean
  verified?: boolean
  active?: boolean
  isActive?: boolean
  createdAt?: string
}

interface RawPageResponse<T> {
  content?: T[]
  pageNumber?: number
  pageSize?: number
  totalElements?: number
  totalPages?: number
}

const buildFullName = (profile?: BackendUserResponse['profile'], username?: string) => {
  const name = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ').trim()
  return name || username || ''
}

const mapUserResponse = (payload: BackendUserResponse): User => {
  const avatar = payload.profile?.avatar
  return {
    id: payload.id,
    username: payload.username,
    fullName: buildFullName(payload.profile, payload.username),
    email: payload.email,
    avatarUrl: avatar,
    followerCount: payload.followersCount ?? 0,
    followingCount: payload.followingCount ?? 0,
    createdAt: payload.createdAt ?? new Date().toISOString(),
    status: payload.isActive ?? payload.active ? 'ACTIVE' : 'BANNED',
    bio: payload.profile?.bio,
    website: payload.profile?.website,
    postCount: undefined,
    profile: payload.profile,
  }
}

const applyLocalFilters = (users: User[], filters: UserListFilters) => {
  return users.filter((user) => {
    const matchesStatus = !filters.status || filters.status === 'ALL' || user.status === filters.status
    return matchesStatus
  })
}

const fetchPostCount = async (userId: string): Promise<number> => {
  try {
    const { data } = await apiClient.get<RawPageResponse<unknown>>(`/posts/user/${userId}`, {
      params: { page: 0, size: 1 },
    })
    const normalized = normalizePage({ ...data, pageNumber: data?.pageNumber, pageSize: data?.pageSize })
    return normalized.totalElements
  } catch (error) {
    console.warn('Không thể lấy số post cho user', userId, error)
    return 0
  }
}

const mapFollowers = (items: { id: string; username: string; avatarUrl?: string; followingByCurrentUser?: boolean }[]) =>
  items.map((item) => ({
    id: item.id,
    username: item.username,
    avatarUrl: item.avatarUrl,
    followingByCurrentUser: item.followingByCurrentUser,
    fullName: item.username,
  }))

export const userApi = {
  async getUsers(filters: UserListFilters = {}): Promise<PageResponse<User>> {
    if (USE_MOCK) {
      await delay()
      const filtered = applyLocalFilters(
        mockUsers.filter((user) => {
          if (!filters.search) return true
          return (
            user.username.toLowerCase().includes(filters.search.toLowerCase()) ||
            user.fullName.toLowerCase().includes(filters.search.toLowerCase())
          )
        }),
        filters,
      )
      const start = ((filters.page ?? 1) - 1) * (filters.size ?? 10)
      const content = filtered.slice(start, start + (filters.size ?? 10))
      return {
        content,
        page: filters.page ?? 1,
        size: filters.size ?? 10,
        totalElements: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / (filters.size ?? 10))),
      }
    }

    const page = Math.max((filters.page ?? 1) - 1, 0)
    const size = filters.size ?? 10
    const sortField = filters.sort === 'followerCount' ? 'followersCount' : 'createdAt'
    const direction = filters.direction === 'asc' ? 'asc' : 'desc'

    const endpoint = filters.search ? '/users/search' : '/users'
    const params: Record<string, unknown> = {
      page,
      size,
      sort: `${sortField},${direction}`,
    }
    if (filters.search) {
      params.query = filters.search
    }

    const { data } = await apiClient.get<RawPageResponse<BackendUserResponse>>(endpoint, { params })
    const normalized = normalizePage<BackendUserResponse>({
      content: data.content,
      pageNumber: data.pageNumber,
      pageSize: data.pageSize,
      totalElements: data.totalElements,
      totalPages: data.totalPages,
    })

    const mapped = applyLocalFilters(
      normalized.content.map(mapUserResponse),
      filters,
    )

    const enriched = await Promise.all(
      mapped.map(async (user) => ({
        ...user,
        postCount: await fetchPostCount(user.id),
      })),
    )

    return {
      ...normalized,
      content: enriched,
      page: page + 1,
      size,
    }
  },

  async getUserById(id: string): Promise<User> {
    if (USE_MOCK) {
      await delay()
      const user = mockUsers.find((item) => item.id === id)
      if (!user) throw new Error('Không tìm thấy user')
      return user
    }
    const { data } = await apiClient.get<BackendUserResponse>(`/users/${id}`)
    const user = mapUserResponse(data)
    user.postCount = await fetchPostCount(id)
    return user
  },

  async getUserStats(id: string): Promise<UserStats> {
    if (USE_MOCK) {
      await delay(250)
      return mockUserStats[id]
    }
    const [user, posts] = await Promise.all([this.getUserById(id), postApi.getUserPosts(id)])
    const likes = posts.reduce((acc, post) => acc + (post.likeCount ?? 0), 0)
    const comments = posts.reduce((acc, post) => acc + (post.commentCount ?? 0), 0)
    return {
      posts: user.postCount ?? posts.length,
      likes,
      comments,
      followers: user.followerCount,
      following: user.followingCount,
    }
  },

  async getUserPosts(id: string) {
    if (USE_MOCK) {
      await delay(250)
      return mockPosts.filter((post) => post.ownerId === id)
    }
    return postApi.getUserPosts(id)
  },

  async getFollowers(id: string): Promise<UserFollower[]> {
    if (USE_MOCK) {
      await delay(200)
      return mockUsers
        .filter((user) => user.id !== id)
        .slice(0, 6)
        .map((user) => ({
          id: `${id}-${user.id}`,
          username: user.username,
          avatarUrl: user.avatarUrl,
          followingByCurrentUser: false,
          fullName: user.fullName,
        }))
    }
    const { data } = await apiClient.get<RawPageResponse<UserFollower>>(`/users/${id}/followers`, {
      params: { page: 0, size: 20 },
    })
    return mapFollowers(data.content ?? [])
  },

  async getFollowing(id: string): Promise<UserFollower[]> {
    if (USE_MOCK) {
      await delay(200)
      return mockUsers
        .filter((user) => user.id !== id)
        .slice(2, 8)
        .map((user) => ({
          id: `${id}-following-${user.id}`,
          username: user.username,
          avatarUrl: user.avatarUrl,
          followingByCurrentUser: true,
          fullName: user.fullName,
        }))
    }
    const { data } = await apiClient.get<RawPageResponse<UserFollower>>(`/users/${id}/following`, {
      params: { page: 0, size: 20 },
    })
    return mapFollowers(data.content ?? [])
  },
}


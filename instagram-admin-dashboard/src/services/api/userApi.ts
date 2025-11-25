import type { PageResponse, User, UserListFilters, UserStats } from '../../types'
import { mockPosts, mockUserStats, mockUsers } from '../../data/mockData'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms))

const applyFilters = (filters: UserListFilters): User[] => {
  const { search, status } = filters
  return mockUsers
    .filter((user) => {
      const matchesSearch =
        !search ||
        user.username.toLowerCase().includes(search.toLowerCase()) ||
        user.fullName.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = status === 'ALL' || !status || user.status === status
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      const direction = filters.direction === 'asc' ? 1 : -1
      switch (filters.sort) {
        case 'followerCount':
          return (a.followerCount - b.followerCount) * direction
        case 'postCount':
          return (a.postCount - b.postCount) * direction
        case 'createdAt':
        default:
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction
      }
    })
}

const paginate = <T,>(items: T[], page = 1, size = 10): PageResponse<T> => {
  const start = (page - 1) * size
  const pagedItems = items.slice(start, start + size)
  return {
    content: pagedItems,
    page,
    size,
    totalElements: items.length,
    totalPages: Math.ceil(items.length / size) || 1,
  }
}

export const userApi = {
  async getUsers(filters: UserListFilters = {}): Promise<PageResponse<User>> {
    if (!USE_MOCK) {
      throw new Error('User API chưa được kết nối backend')
    }
    await delay()
    const result = applyFilters({
      sort: 'createdAt',
      direction: 'desc',
      page: 1,
      size: 10,
      ...filters,
    })
    return paginate(result, filters.page ?? 1, filters.size ?? 10)
  },
  async getUserById(id: string): Promise<User> {
    if (!USE_MOCK) {
      throw new Error('User detail API chưa sẵn sàng')
    }
    await delay()
    const user = mockUsers.find((item) => item.id === id)
    if (!user) {
      throw new Error('Không tìm thấy user')
    }
    return user
  },
  async getUserStats(id: string): Promise<UserStats> {
    if (!USE_MOCK) {
      throw new Error('User stats API chưa sẵn sàng')
    }
    await delay(250)
    return mockUserStats[id]
  },
  async getUserPosts(id: string) {
    if (!USE_MOCK) {
      throw new Error('User posts API chưa sẵn sàng')
    }
    await delay(250)
    return mockPosts.filter((post) => post.ownerId === id)
  },
  async getFollowers(
    id: string,
  ): Promise<{ id: string; username: string; fullName: string; avatarUrl: string }[]> {
    if (!USE_MOCK) {
      throw new Error('Followers API chưa sẵn sàng')
    }
    await delay(200)
    return mockUsers
      .filter((user) => user.id !== id)
      .slice(0, 6)
      .map((user) => ({
        id: `${id}-${user.id}`,
        username: user.username,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
      }))
  },
  async getFollowing(
    id: string,
  ): Promise<{ id: string; username: string; fullName: string; avatarUrl: string }[]> {
    if (!USE_MOCK) {
      throw new Error('Following API chưa sẵn sàng')
    }
    await delay(200)
    return mockUsers
      .filter((user) => user.id !== id)
      .slice(2, 8)
      .map((user) => ({
        id: `${id}-following-${user.id}`,
        username: user.username,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
      }))
  },
}


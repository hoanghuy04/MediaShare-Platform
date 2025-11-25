import type { GroupDetail, GroupListFilters, GroupPageResponse } from '../../types'
import { mockGroupDetails, mockGroups } from '../../data/mockData'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms))

const filterGroups = (filters: GroupListFilters) => {
  const { search, status } = filters
  return mockGroups
    .filter((group) => {
      const matchesSearch = !search || group.name.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = status === 'ALL' || !status || group.status === status
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      const direction = filters.direction === 'asc' ? 1 : -1
      switch (filters.sort) {
        case 'memberCount':
          return (a.memberCount - b.memberCount) * direction
        case 'createdAt':
        default:
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction
      }
    })
}

const paginate = <T,>(items: T[], page = 1, size = 10) => {
  const start = (page - 1) * size
  return {
    content: items.slice(start, start + size),
    page,
    size,
    totalElements: items.length,
    totalPages: Math.ceil(items.length / size) || 1,
  }
}

export const groupApi = {
  async getGroups(filters: GroupListFilters = {}): Promise<GroupPageResponse> {
    if (!USE_MOCK) {
      throw new Error('Group API chưa sẵn sàng')
    }
    await delay()
    const filtered = filterGroups({
      sort: 'createdAt',
      direction: 'desc',
      page: 1,
      size: 10,
      ...filters,
    })
    return paginate(filtered, filters.page ?? 1, filters.size ?? 10)
  },
  async getGroupById(id: string): Promise<GroupDetail> {
    if (!USE_MOCK) {
      throw new Error('Group detail API chưa sẵn sàng')
    }
    await delay()
    const detail = mockGroupDetails[id]
    if (!detail) {
      throw new Error('Không tìm thấy group')
    }
    return detail
  },
  async toggleArchive(id: string): Promise<GroupDetail> {
    if (!USE_MOCK) {
      throw new Error('Group archive API chưa sẵn sàng')
    }
    await delay(250)
    const detail = mockGroupDetails[id]
    if (!detail) {
      throw new Error('Không tìm thấy group')
    }
    detail.status = detail.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE'
    return detail
  },
}


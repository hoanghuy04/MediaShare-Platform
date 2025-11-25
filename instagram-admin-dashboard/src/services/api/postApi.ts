import type { PageResponse, Post, PostDetail, PostListFilters } from '../../types'
import { mockPostDetails, mockPosts } from '../../data/mockData'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
const delay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms))

const filterPosts = (filters: PostListFilters): Post[] => {
  const { search, type, status, from, to } = filters
  return mockPosts
    .filter((post) => {
      const matchesSearch = !search || post.caption.toLowerCase().includes(search.toLowerCase())
      const matchesType = type === 'ALL' || !type || post.type === type
      const matchesStatus = status === 'ALL' || !status || post.visibility === status
      const createdAt = new Date(post.createdAt).getTime()
      const matchesFrom = from ? createdAt >= new Date(from).getTime() : true
      const matchesTo = to ? createdAt <= new Date(to).getTime() : true
      return matchesSearch && matchesType && matchesStatus && matchesFrom && matchesTo
    })
    .sort((a, b) => {
      const direction = filters.direction === 'asc' ? 1 : -1
      switch (filters.sort) {
        case 'likeCount':
          return (a.likeCount - b.likeCount) * direction
        case 'commentCount':
          return (a.commentCount - b.commentCount) * direction
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

export const postApi = {
  async getPosts(filters: PostListFilters = {}): Promise<PageResponse<Post>> {
    if (!USE_MOCK) {
      throw new Error('Post API chưa được kết nối backend')
    }
    await delay()
    const filtered = filterPosts({
      sort: 'createdAt',
      direction: 'desc',
      page: 1,
      size: 10,
      ...filters,
    })
    return paginate(filtered, filters.page ?? 1, filters.size ?? 10)
  },
  async getPostById(id: string): Promise<PostDetail> {
    if (!USE_MOCK) {
      throw new Error('Post detail API chưa sẵn sàng')
    }
    await delay()
    const post = mockPostDetails[id]
    if (!post) {
      throw new Error('Không tìm thấy post')
    }
    return post
  },
  async toggleVisibility(id: string): Promise<Post> {
    if (!USE_MOCK) {
      throw new Error('Post visibility API chưa được nối backend')
    }
    await delay(200)
    const post = mockPosts.find((item) => item.id === id)
    if (!post) {
      throw new Error('Không tìm thấy post')
    }
    post.visibility = post.visibility === 'PUBLIC' ? 'HIDDEN' : 'PUBLIC'
    return post
  },
}


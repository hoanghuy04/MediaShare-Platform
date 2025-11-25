import type { DashboardStats, TimeRange } from '../../types'
import {
  generateCommentsSeries,
  generateLikesSeries,
  generatePostsVsReels,
  generateTrendSeries,
  mockGroups,
  mockPosts,
  mockTopActiveUsers,
  mockTopPosts,
  mockUsers,
  postDistribution,
} from '../../data/mockData'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
const delay = (ms = 450) => new Promise((resolve) => setTimeout(resolve, ms))

const daysMap: Record<TimeRange, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
}

const mockStats = async (range: TimeRange): Promise<DashboardStats> => {
  const days = daysMap[range]
  await delay()
  return {
    range,
    metrics: [
      { id: 'users', label: 'Tổng User', value: mockUsers.length * 2340, change: 5.2, icon: 'users' },
      { id: 'posts', label: 'Tổng Post', value: mockPosts.length * 320, change: 3.1, icon: 'posts' },
      { id: 'reels', label: 'Tổng Reel', value: mockPosts.filter((p) => p.type === 'REEL').length * 210, change: 6.4, icon: 'reels' },
      { id: 'groups', label: 'Group conversation', value: mockGroups.length * 4, change: -1.4, icon: 'groups' },
      { id: 'likes', label: 'Tổng Like', value: mockPosts.reduce((acc, post) => acc + post.likeCount, 0), change: 2.1, icon: 'likes' },
      { id: 'comments', label: 'Tổng Comment', value: mockPosts.reduce((acc, post) => acc + post.commentCount, 0), change: 0.8, icon: 'comments' },
    ],
    newUsers: generateTrendSeries(days, 250),
    postsVsReels: generatePostsVsReels(days),
    likesTrend: generateLikesSeries(days, 900),
    commentsTrend: generateCommentsSeries(days, 350),
    postDistribution: postDistribution(),
    topActiveUsers: mockTopActiveUsers,
    topPosts: mockTopPosts,
  }
}

export const statsApi = {
  async getDashboardStats(range: TimeRange): Promise<DashboardStats> {
    if (USE_MOCK) {
      return mockStats(range)
    }
    throw new Error('Stats API chưa được triển khai')
  },
}


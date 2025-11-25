import type {
  Comment,
  GroupConversation,
  GroupDetail,
  GroupMember,
  Post,
  PostDetail,
  PostType,
  TopPost,
  User,
  UserActivity,
  UserStats,
} from '../types'

const avatar = (seed: number) => `https://i.pravatar.cc/150?img=${seed}`

export const mockUsers: User[] = [
  {
    id: 'u1',
    username: 'ariana.lo',
    fullName: 'Ariana Lopez',
    email: 'ariana@example.com',
    avatarUrl: avatar(11),
    followerCount: 128000,
    followingCount: 950,
    postCount: 684,
    bio: 'Lifestyle content creator & coffee lover ☕️',
    website: 'https://arianalopez.com',
    createdAt: '2023-04-01T08:00:00.000Z',
    status: 'ACTIVE',
  },
  {
    id: 'u2',
    username: 'ken.tran',
    fullName: 'Ken Tran',
    email: 'ken.tran@example.com',
    avatarUrl: avatar(23),
    followerCount: 96000,
    followingCount: 420,
    postCount: 412,
    bio: 'Product designer at GramHQ',
    website: 'https://ken.design',
    createdAt: '2022-10-12T08:00:00.000Z',
    status: 'ACTIVE',
  },
  {
    id: 'u3',
    username: 'linh.vu',
    fullName: 'Linh Vũ',
    email: 'linh@example.com',
    avatarUrl: avatar(18),
    followerCount: 53600,
    followingCount: 310,
    postCount: 199,
    bio: 'Travel | Food | Cozy vibes',
    createdAt: '2023-11-30T08:00:00.000Z',
    status: 'ACTIVE',
  },
  {
    id: 'u4',
    username: 'marco.silva',
    fullName: 'Marco Silva',
    email: 'marco@example.com',
    avatarUrl: avatar(28),
    followerCount: 88400,
    followingCount: 680,
    postCount: 350,
    createdAt: '2021-07-19T08:00:00.000Z',
    status: 'BANNED',
  },
  {
    id: 'u5',
    username: 'zoe.ng',
    fullName: 'Zoey Nguyen',
    email: 'zoey@example.com',
    avatarUrl: avatar(39),
    followerCount: 49200,
    followingCount: 220,
    postCount: 158,
    createdAt: '2024-02-11T08:00:00.000Z',
    status: 'ACTIVE',
  },
  {
    id: 'u6',
    username: 'daniel.park',
    fullName: 'Daniel Park',
    email: 'daniel@example.com',
    avatarUrl: avatar(3),
    followerCount: 74200,
    followingCount: 410,
    postCount: 276,
    createdAt: '2022-03-05T08:00:00.000Z',
    status: 'ACTIVE',
  },
  {
    id: 'u7',
    username: 'hana.ito',
    fullName: 'Hana Ito',
    email: 'hana@example.com',
    avatarUrl: avatar(44),
    followerCount: 36800,
    followingCount: 180,
    postCount: 124,
    createdAt: '2023-05-21T08:00:00.000Z',
    status: 'ACTIVE',
  },
  {
    id: 'u8',
    username: 'liam.carter',
    fullName: 'Liam Carter',
    email: 'liam@example.com',
    avatarUrl: avatar(14),
    followerCount: 25800,
    followingCount: 135,
    postCount: 96,
    createdAt: '2024-04-14T08:00:00.000Z',
    status: 'ACTIVE',
  },
]

const sampleCaptions = [
  'Golden hour in Lisbon hits different ☀️',
  'UI motion study for Gram Stories',
  'Weekend coffee crawl in Saigon',
  '90s vibes reel edit 🎞️',
  'Sunset rooftop jam session',
  'How I plan content for the week',
  'Reel recap: 3-day Seoul itinerary',
  'Minimal desk setup refresh',
]

const placeholderImage = (idx: number) => `https://picsum.photos/id/${40 + idx}/600/400`

export const mockPosts: Post[] = sampleCaptions.map((caption, idx) => {
  const owner = mockUsers[idx % mockUsers.length]
  const isReel = idx % 3 === 0
  return {
    id: `p${idx + 1}`,
    caption,
    thumbnailUrl: placeholderImage(idx + 12),
    mediaUrl: placeholderImage(idx + 12),
    type: isReel ? 'REEL' : 'POST',
    likeCount: 1200 - idx * 73,
    commentCount: 230 - idx * 17,
    createdAt: `2024-11-${(idx % 9) + 10}T08:00:00.000Z`,
    ownerId: owner.id,
    ownerUsername: owner.username,
    ownerAvatar: owner.avatarUrl,
    visibility: idx % 5 === 0 ? 'HIDDEN' : 'PUBLIC',
  }
})

export const mockComments: Comment[] = Array.from({ length: 20 }, (_val, idx) => {
  const author = mockUsers[(idx + 2) % mockUsers.length]
  return {
    id: `c${idx + 1}`,
    authorId: author.id,
    authorUsername: author.username,
    content: `Bình luận #${idx + 1} bởi ${author.username}`,
    createdAt: `2024-11-${(idx % 7) + 14}T10:0${idx % 5}:00.000Z`,
  }
})

export const mockGroups: GroupConversation[] = [
  {
    id: 'g1',
    name: 'Product Design Squad',
    avatarUrl: placeholderImage(91),
    memberCount: 18,
    messageCount: 1840,
    createdAt: '2022-06-10T08:00:00.000Z',
    updatedAt: '2024-11-20T08:00:00.000Z',
    status: 'ACTIVE',
    ownerId: 'u2',
    ownerName: 'Ken Tran',
  },
  {
    id: 'g2',
    name: 'Travel Creators VN',
    avatarUrl: placeholderImage(96),
    memberCount: 42,
    messageCount: 3240,
    createdAt: '2023-01-04T08:00:00.000Z',
    updatedAt: '2024-11-18T08:00:00.000Z',
    status: 'ACTIVE',
    ownerId: 'u3',
    ownerName: 'Linh Vũ',
  },
  {
    id: 'g3',
    name: 'Gram Admins',
    avatarUrl: placeholderImage(99),
    memberCount: 8,
    messageCount: 840,
    createdAt: '2021-09-14T08:00:00.000Z',
    updatedAt: '2024-11-21T08:00:00.000Z',
    status: 'ACTIVE',
    ownerId: 'u1',
    ownerName: 'Ariana Lopez',
  },
  {
    id: 'g4',
    name: 'Foodies Collective',
    avatarUrl: placeholderImage(93),
    memberCount: 25,
    messageCount: 1260,
    createdAt: '2022-12-01T08:00:00.000Z',
    updatedAt: '2024-10-25T08:00:00.000Z',
    status: 'ARCHIVED',
    ownerId: 'u5',
    ownerName: 'Zoey Nguyen',
  },
]

const roles: GroupMember['role'][] = ['admin', 'member']

const generateMembers = (count: number): GroupMember[] =>
  Array.from({ length: count }).map((_val, idx) => {
    const base = mockUsers[idx % mockUsers.length]
    return {
      id: `${base.id}-${idx}`,
      username: base.username,
      fullName: base.fullName,
      avatarUrl: base.avatarUrl,
      role: roles[idx % roles.length],
    }
  })

export const mockGroupDetails: Record<string, GroupDetail> = mockGroups.reduce(
  (acc, group) => {
    const members = generateMembers(group.memberCount)
    acc[group.id] = {
      ...group,
      members,
      admins: members.filter((member) => member.role === 'admin'),
      activity: Array.from({ length: 12 }).map((_val, idx) => ({
        date: `2024-11-${(idx % 15) + 5}`,
        messages: Math.floor(Math.random() * 120) + 20,
      })),
    }
    return acc
  },
  {} as Record<string, GroupDetail>,
)

export const mockTopActiveUsers: UserActivity[] = mockUsers.slice(0, 6).map((user, idx) => ({
  userId: user.id,
  username: user.username,
  fullName: user.fullName,
  avatarUrl: user.avatarUrl,
  posts: user.postCount,
  likes: 4200 - idx * 230,
  comments: 820 - idx * 64,
  followers: user.followerCount,
  following: user.followingCount,
}))

export const mockTopPosts: TopPost[] = mockPosts.slice(0, 5).map((post) => ({
  id: post.id,
  caption: post.caption,
  likeCount: post.likeCount,
  commentCount: post.commentCount,
  ownerUsername: post.ownerUsername,
  thumbnailUrl: post.thumbnailUrl,
}))

export const mockUserStats: Record<string, UserStats> = mockUsers.reduce(
  (acc, user, idx) => {
    acc[user.id] = {
      posts: user.postCount,
      likes: 4800 - idx * 275,
      comments: 980 - idx * 55,
      followers: user.followerCount,
      following: user.followingCount,
    }
    return acc
  },
  {} as Record<string, UserStats>,
)

export const mockPostDetails: Record<string, PostDetail> = mockPosts.reduce(
  (acc, post, idx) => {
    acc[post.id] = {
      ...post,
      comments: mockComments.slice(idx, idx + 5),
    }
    return acc
  },
  {} as Record<string, PostDetail>,
)

export const generateTrendSeries = (days: number, maxValue: number) =>
  Array.from({ length: days }).map((_val, idx) => {
    const date = new Date()
    date.setDate(date.getDate() - (days - idx))
    return {
      date: date.toISOString().slice(0, 10),
      value: Math.floor(Math.random() * maxValue) + maxValue / 2,
    }
  })

export const generateLikesSeries = (days: number, maxValue: number) =>
  Array.from({ length: days }).map((_val, idx) => {
    const date = new Date()
    date.setDate(date.getDate() - (days - idx))
    return {
      date: date.toISOString().slice(0, 10),
      likes: Math.floor(Math.random() * maxValue) + maxValue / 2,
    }
  })

export const generateCommentsSeries = (days: number, maxValue: number) =>
  Array.from({ length: days }).map((_val, idx) => {
    const date = new Date()
    date.setDate(date.getDate() - (days - idx))
    return {
      date: date.toISOString().slice(0, 10),
      comments: Math.floor(Math.random() * maxValue) + maxValue / 3,
    }
  })

export const generatePostsVsReels = (days: number) =>
  Array.from({ length: days }).map((_val, idx) => {
    const date = new Date()
    date.setDate(date.getDate() - (days - idx))
    return {
      date: date.toISOString().slice(0, 10),
      posts: Math.floor(Math.random() * 180) + 70,
      reels: Math.floor(Math.random() * 160) + 50,
    }
  })

export const postDistribution = (range: PostType[] = ['POST', 'REEL']) =>
  range.map((type, idx) => ({
    type,
    value: idx === 0 ? 65 : 35,
  }))


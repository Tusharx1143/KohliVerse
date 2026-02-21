export interface User {
  uid: string
  username: string
  email: string
  avatarUrl: string
  bio: string
  createdAt: Date
  totalVotesReceived: number
  totalPosts: number
  isSetupComplete: boolean
  socialLinks?: {
    facebook?: string
    instagram?: string
    twitter?: string
  }
  updatedAt?: Date
}

export interface Post {
  id: string
  authorId: string
  authorName: string
  authorAvatar: string
  videoUrl: string
  embedUrl: string
  thumbnailUrl: string
  platform: "youtube" | "instagram"
  title: string
  upvotes: number
  downvotes: number
  commentCount: number
  createdAt: Date
  hotScore: number
  userVote?: "up" | "down" | null
}

export interface Vote {
  id: string
  userId: string
  postId: string
  type: "up" | "down"
  createdAt: Date
}

export interface Comment {
  id: string
  postId: string
  userId: string
  username: string
  avatarUrl: string
  content: string
  createdAt: Date
}

export type SortOption = "hot" | "new" | "top"

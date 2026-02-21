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
  role: "user" | "admin" | "banned"
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
  tags: string[]
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

export interface Follow {
  id: string
  followerId: string
  followingId: string
  createdAt: Date
}

export interface Save {
  id: string
  userId: string
  postId: string
  createdAt: Date
}

export interface Report {
  id: string
  reporterId: string
  postId: string
  reason: "spam" | "nsfw" | "copyright" | "other"
  description?: string
  status: "pending" | "reviewed" | "resolved"
  createdAt: Date
}

export interface Notification {
  id: string
  userId: string
  type: "upvote" | "comment" | "follow" | "reply"
  fromUserId: string
  fromUsername: string
  fromUserAvatar: string
  postId?: string
  read: boolean
  createdAt: Date
}

export interface Tag {
  id: string
  name: string
  isDefault: boolean
  count: number
}

export type SortOption = "hot" | "new" | "top"

export const DEFAULT_TAGS = [
  "Innings",
  "Cover Drive",
  "Chase",
  "Celebration",
  "Training",
  "Interview",
  "Tribute",
  "Six",
  "Four",
  "Century",
  "Half Century",
  "Fielding",
  "Wicket",
  "Captaincy",
  "Passion",
]

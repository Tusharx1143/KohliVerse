"use client"

import { useState, useEffect } from "react"
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Post } from "@/lib/types"
import { COLORS } from "@/lib/constants"
import { formatNumber, timeAgo } from "@/lib/utils"
import Link from "next/link"
import { Loader2, Trophy, Crown, Medal } from "lucide-react"

interface TopCreator {
  authorId: string
  authorName: string
  authorAvatar: string
  totalVotes: number
  totalPosts: number
}

export default function LeaderboardPage() {
  const [topPosts, setTopPosts] = useState<Post[]>([])
  const [topCreators, setTopCreators] = useState<TopCreator[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"edits" | "creators">("edits")

  useEffect(() => {
    loadLeaderboard()
  }, [])

  const loadLeaderboard = async () => {
    setLoading(true)
    try {
      const postsQuery = query(
        collection(db, "posts"),
        orderBy("upvotes", "desc"),
        limit(10)
      )
      const postsSnap = await getDocs(postsQuery)
      const posts = postsSnap.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Post
      })
      setTopPosts(posts)

      const creatorsMap = new Map<string, TopCreator>()
      posts.forEach((post) => {
        if (creatorsMap.has(post.authorId)) {
          const creator = creatorsMap.get(post.authorId)!
          creator.totalVotes += post.upvotes
          creator.totalPosts += 1
        } else {
          creatorsMap.set(post.authorId, {
            authorId: post.authorId,
            authorName: post.authorName,
            authorAvatar: post.authorAvatar,
            totalVotes: post.upvotes,
            totalPosts: 1,
          })
        }
      })

      const creators = Array.from(creatorsMap.values())
        .sort((a, b) => b.totalVotes - a.totalVotes)
        .slice(0, 10)
      setTopCreators(creators)
    } catch (error) {
      console.error("Error loading leaderboard:", error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown size={20} style={{ color: "#FFD200" }} />
    if (rank === 2) return <Medal size={20} style={{ color: "#C0C0C0" }} />
    if (rank === 3) return <Medal size={20} style={{ color: "#CD7F32" }} />
    return <span className="text-lg font-bold w-6 text-center">{rank}</span>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin" size={32} style={{ color: COLORS.primary }} />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Trophy size={32} style={{ color: COLORS.primary }} />
          <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
        </div>
        <p style={{ color: COLORS.textSecondary }}>
          Top performing edits and creators this week
        </p>
      </div>

      <div className="flex justify-center mb-6">
        <div className="flex p-1 rounded-lg" style={{ backgroundColor: COLORS.muted }}>
          <button
            onClick={() => setActiveTab("edits")}
            className="px-6 py-2 rounded-md font-medium transition-all"
            style={{
              backgroundColor: activeTab === "edits" ? COLORS.primary : "transparent",
              color: activeTab === "edits" ? "white" : COLORS.textSecondary,
            }}
          >
            Top Edits
          </button>
          <button
            onClick={() => setActiveTab("creators")}
            className="px-6 py-2 rounded-md font-medium transition-all"
            style={{
              backgroundColor: activeTab === "creators" ? COLORS.primary : "transparent",
              color: activeTab === "creators" ? "white" : COLORS.textSecondary,
            }}
          >
            Top Creators
          </button>
        </div>
      </div>

      {activeTab === "edits" ? (
        <div className="space-y-3">
          {topPosts.map((post, index) => (
            <Link
              key={post.id}
              href={`/post/${post.id}`}
              className="flex items-center gap-4 p-4 rounded-xl border transition-colors hover:bg-opacity-50"
              style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}
            >
              <div className="w-8 flex justify-center">
                {getRankIcon(index + 1)}
              </div>
              <img
                src={post.thumbnailUrl}
                alt={post.title}
                className="w-24 h-16 object-cover rounded-lg"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-white truncate">{post.title}</h3>
                <div className="flex items-center gap-2 mt-1 text-sm" style={{ color: COLORS.textSecondary }}>
                  <img src={post.authorAvatar} alt={post.authorName} className="w-5 h-5 rounded-full" />
                  <span style={{ color: COLORS.primary }}>{post.authorName}</span>
                  <span>•</span>
                  <span>{timeAgo(post.createdAt)}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold" style={{ color: COLORS.primary }}>
                  {formatNumber(post.upvotes)}
                </div>
                <div className="text-xs" style={{ color: COLORS.textSecondary }}>votes</div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {topCreators.map((creator, index) => (
            <Link
              key={creator.authorId}
              href={`/profile/${creator.authorId}`}
              className="flex items-center gap-4 p-4 rounded-xl border transition-colors"
              style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}
            >
              <div className="w-8 flex justify-center">
                {getRankIcon(index + 1)}
              </div>
              <img
                src={creator.authorAvatar}
                alt={creator.authorName}
                className="w-12 h-12 rounded-full"
              />
              <div className="flex-1">
                <h3 className="font-medium text-white">{creator.authorName}</h3>
                <div className="text-sm" style={{ color: COLORS.textSecondary }}>
                  {creator.totalPosts} edit{creator.totalPosts !== 1 ? "s" : ""}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold" style={{ color: COLORS.primary }}>
                  {formatNumber(creator.totalVotes)}
                </div>
                <div className="text-xs" style={{ color: COLORS.textSecondary }}>total votes</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {((activeTab === "edits" && topPosts.length === 0) || (activeTab === "creators" && topCreators.length === 0)) && (
        <div className="text-center py-12">
          <Trophy size={48} className="mx-auto mb-4" style={{ color: COLORS.textSecondary }} />
          <p style={{ color: COLORS.textSecondary }}>No data yet. Be the first to submit!</p>
        </div>
      )}
    </div>
  )
}

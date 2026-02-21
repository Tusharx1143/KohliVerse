"use client"

import { useState, useEffect } from "react"
import { Post } from "@/lib/types"
import { COLORS } from "@/lib/constants"
import { formatNumber, timeAgo } from "@/lib/utils"
import { getPosts, getLeaderboard } from "@/lib/db-utils"
import Link from "next/link"
import { Loader2, Trophy, Crown, Medal } from "lucide-react"

export default function LeaderboardPage() {
  const [topPosts, setTopPosts] = useState<Post[]>([])
  const [topCreators, setTopCreators] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"edits" | "creators">("edits")

  useEffect(() => {
    loadLeaderboard()
  }, [])

  const loadLeaderboard = async () => {
    setLoading(true)
    try {
      const dbPosts = await getPosts({ sort: "top", limit: 10 })
      
      const posts = dbPosts.map((p: any) => ({
        id: p.id.toString(),
        authorId: p.author_id,
        authorName: p.author_name,
        authorAvatar: p.author_avatar,
        videoUrl: p.video_url,
        embedUrl: p.embed_url,
        thumbnailUrl: p.thumbnail_url,
        platform: p.platform as "youtube" | "instagram",
        mediaUrl: p.media_url,
        mediaType: p.media_type as "image" | "video",
        type: p.post_type as "embed" | "upload",
        title: p.title,
        tags: p.tags || [],
        upvotes: p.upvotes,
        downvotes: p.downvotes,
        commentCount: p.comment_count,
        createdAt: new Date(p.created_at),
        hotScore: p.hot_score,
      }))
      setTopPosts(posts)

      const leaders = await getLeaderboard(10)
      setTopCreators(leaders.map((l: any) => ({
        authorId: l.id,
        authorName: l.username,
        authorAvatar: l.avatar_url,
        totalVotes: l.total_votes_received || 0,
        totalPosts: l.total_posts || 0,
      })))
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
                src={post.thumbnailUrl || "/default-avatar.png"}
                alt={post.title}
                className="w-24 h-16 object-cover rounded-lg"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-white truncate">{post.title}</h3>
                <div className="flex items-center gap-2 mt-1 text-sm" style={{ color: COLORS.textSecondary }}>
                  <img src={post.authorAvatar || "/default-avatar.png"} alt={post.authorName} className="w-5 h-5 rounded-full" />
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
                src={creator.authorAvatar || "/default-avatar.png"}
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

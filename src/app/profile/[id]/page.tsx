"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { Post } from "@/lib/types"
import { COLORS } from "@/lib/constants"
import { formatNumber, timeAgo } from "@/lib/utils"
import { getUserById, getPosts } from "@/lib/db-utils"
import VideoCard from "@/components/VideoCard"
import Link from "next/link"
import { Loader2, Trophy, Video, Settings } from "lucide-react"

export default function ProfilePage() {
  const params = useParams()
  const profileUserId = params.id as string
  const { userId } = useAuth()
  
  const [profileUser, setProfileUser] = useState<any>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"posts" | "stats">("posts")

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true)
      try {
        const dbUser = await getUserById(profileUserId)
        const user = dbUser as any
        if (user) {
          setProfileUser(user)
        } else {
          setProfileUser({
            id: profileUserId,
            username: "Unknown User",
            avatar_url: "/default-avatar.png",
            bio: "",
            created_at: new Date(),
            total_votes_received: 0,
            total_posts: 0,
          })
        }

        const dbPosts = await getPosts({
          limit: 20,
          authorId: profileUserId,
        })

        setPosts(dbPosts.map((p: any) => ({
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
        })))
      } catch (error) {
        console.error("Error loading profile:", error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [profileUserId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin" size={32} style={{ color: COLORS.primary }} />
      </div>
    )
  }

  if (!profileUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-white">User not found</h1>
      </div>
    )
  }

  const isOwnProfile = userId === profileUserId

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="rounded-xl border p-6 mb-6" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
        <div className="flex items-start gap-6">
          <img
            src={profileUser.avatar_url || "/default-avatar.png"}
            alt={profileUser.username}
            className="w-24 h-24 rounded-full border-4"
            style={{ borderColor: COLORS.primary }}
          />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{profileUser.username}</h1>
              {isOwnProfile && (
                <Link
                  href="/settings"
                  className="p-2 rounded-lg transition-colors"
                  style={{ color: COLORS.textSecondary }}
                >
                  <Settings size={18} />
                </Link>
              )}
            </div>
            <p className="text-sm mt-1" style={{ color: COLORS.textSecondary }}>
              Member since {new Date(profileUser.created_at).toLocaleDateString()}
            </p>

            <div className="flex items-center gap-6 mt-4">
              <div className="text-center">
                <div className="text-xl font-bold" style={{ color: COLORS.primary }}>
                  {formatNumber(posts.reduce((sum, p) => sum + p.upvotes, 0))}
                </div>
                <div className="text-xs" style={{ color: COLORS.textSecondary }}>Total Votes</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold" style={{ color: COLORS.primary }}>
                  {posts.length}
                </div>
                <div className="text-xs" style={{ color: COLORS.textSecondary }}>Edits</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold" style={{ color: COLORS.primary }}>
                  {profileUser.total_posts || 0}
                </div>
                <div className="text-xs" style={{ color: COLORS.textSecondary }}>Submissions</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("posts")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all"
          style={{
            backgroundColor: activeTab === "posts" ? COLORS.primary : COLORS.muted,
            color: activeTab === "posts" ? "white" : COLORS.textSecondary,
          }}
        >
          <Video size={18} />
          Edits ({posts.length})
        </button>
        <button
          onClick={() => setActiveTab("stats")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all"
          style={{
            backgroundColor: activeTab === "stats" ? COLORS.primary : COLORS.muted,
            color: activeTab === "stats" ? "white" : COLORS.textSecondary,
          }}
        >
          <Trophy size={18} />
          Stats
        </button>
      </div>

      {activeTab === "posts" ? (
        posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => (
              <VideoCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 rounded-xl border" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
            <Video size={48} className="mx-auto mb-4" style={{ color: COLORS.textSecondary }} />
            <p style={{ color: COLORS.textSecondary }}>
              {isOwnProfile ? "You haven't submitted any edits yet." : "No edits yet."}
            </p>
            {isOwnProfile && (
              <Link
                href="/submit"
                className="inline-block mt-4 px-6 py-2 rounded-lg font-medium"
                style={{ backgroundColor: COLORS.primary, color: "white" }}
              >
                Submit Your First Edit
              </Link>
            )}
          </div>
        )
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {posts.slice(0, 6).map((post) => (
            <Link
              key={post.id}
              href={`/post/${post.id}`}
              className="rounded-xl overflow-hidden border"
              style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}
            >
              <img src={post.thumbnailUrl || "/default-avatar.png"} alt={post.title} className="w-full aspect-video object-cover" />
              <div className="p-3">
                <div className="text-sm font-medium text-white truncate">{post.title}</div>
                <div className="flex items-center justify-between mt-2 text-xs" style={{ color: COLORS.textSecondary }}>
                  <span>{formatNumber(post.upvotes)} votes</span>
                  <span>{timeAgo(post.createdAt)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

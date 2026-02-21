"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { db, auth } from "@/lib/firebase"
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { Post, User } from "@/lib/types"
import { COLORS } from "@/lib/constants"
import { formatNumber, timeAgo } from "@/lib/utils"
import VideoCard from "@/components/VideoCard"
import Link from "next/link"
import { Loader2, Trophy, Video, Settings } from "lucide-react"

export default function ProfilePage() {
  const params = useParams()
  const userId = params.id as string
  
  const [user, setUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(auth.currentUser)
  const [activeTab, setActiveTab] = useState<"posts" | "stats">("posts")

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
    })
    return () => unsubscribeAuth()
  }, [])

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true)
      try {
        const userSnap = await getDoc(doc(db, "users", userId))
        if (userSnap.exists()) {
          const data = userSnap.data()
          setUser({
            uid: userSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
          } as User)
        } else {
          setUser({
            uid: userId,
            username: "Unknown User",
            email: "",
            avatarUrl: "/default-avatar.png",
            bio: "",
            createdAt: new Date(),
            totalVotesReceived: 0,
            totalPosts: 0,
            isSetupComplete: false,
            role: "user",
          })
        }

        const postsQuery = query(
          collection(db, "posts"),
          where("authorId", "==", userId),
          orderBy("createdAt", "desc"),
          limit(20)
        )
        const postsSnap = await getDocs(postsQuery)
        const userPosts = postsSnap.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
          } as Post
        })
        setPosts(userPosts)
      } catch (error) {
        console.error("Error loading profile:", error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [userId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin" size={32} style={{ color: COLORS.primary }} />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-white">User not found</h1>
      </div>
    )
  }

  const isOwnProfile = currentUser?.uid === userId

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="rounded-xl border p-6 mb-6" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
        <div className="flex items-start gap-6">
          <img
            src={user.avatarUrl}
            alt={user.username}
            className="w-24 h-24 rounded-full border-4"
            style={{ borderColor: COLORS.primary }}
          />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{user.username}</h1>
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
              Member since {user.createdAt.toLocaleDateString()}
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
                  {user.totalPosts || 0}
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
              <img src={post.thumbnailUrl} alt={post.title} className="w-full aspect-video object-cover" />
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

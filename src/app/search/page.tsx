"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Post } from "@/lib/types"
import { DEFAULT_TAGS } from "@/lib/types"
import { COLORS } from "@/lib/constants"
import { searchPosts, getUserById } from "@/lib/db-utils"
import VideoCard from "@/components/VideoCard"
import { Search, Loader2, User as UserIcon } from "lucide-react"
import Link from "next/link"

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQuery = searchParams.get("q") || ""
  
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [results, setResults] = useState<Post[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"posts" | "users">("posts")

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery)
    }
  }, [initialQuery])

  const performSearch = async (q: string) => {
    if (!q.trim()) return
    
    setLoading(true)

    try {
      const dbPosts = await searchPosts(q.trim())
      setResults(dbPosts.map((p: any) => ({
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

      // For users, we'll skip for now as we don't have a search users function
      setUsers([])

    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      performSearch(searchQuery.trim())
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0A0A0]" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search posts, creators, or tags..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] text-white placeholder-neutral-500 focus:outline-none focus:border-[#E0301E] text-lg"
          />
        </div>
      </form>

      <div className="flex flex-wrap gap-2 mb-6">
        {DEFAULT_TAGS.slice(0, 8).map(tag => (
          <button
            key={tag}
            onClick={() => {
              setSearchQuery(tag)
              router.push(`/search?q=${encodeURIComponent(tag)}`)
              performSearch(tag)
            }}
            className="px-3 py-1 rounded-full text-sm border border-[#2A2A2A] text-[#A0A0A0] hover:border-[#E0301E] hover:text-[#E0301E] transition-colors"
          >
            {tag}
          </button>
        ))}
      </div>

      {initialQuery && (
        <>
          <div className="flex gap-4 mb-6 border-b border-[#2A2A2A]">
            <button
              onClick={() => setActiveTab("posts")}
              className={`pb-2 px-1 text-sm font-medium transition-colors ${
                activeTab === "posts" 
                  ? "text-[#E0301E] border-b-2 border-[#E0301E]" 
                  : "text-[#A0A0A0]"
              }`}
            >
              Posts ({results.length})
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`pb-2 px-1 text-sm font-medium transition-colors ${
                activeTab === "users" 
                  ? "text-[#E0301E] border-b-2 border-[#E0301E]" 
                  : "text-[#A0A0A0]"
              }`}
            >
              Users ({users.length})
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin" size={32} style={{ color: COLORS.primary }} />
            </div>
          ) : activeTab === "posts" ? (
            results.length > 0 ? (
              <div className="space-y-4">
                {results.map(post => (
                  <VideoCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search size={48} className="mx-auto mb-4 text-[#A0A0A0]" />
                <p className="text-[#A0A0A0]">No posts found for "{initialQuery}"</p>
              </div>
            )
          ) : (
            users.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {users.map(user => (
                  <Link
                    key={user.id}
                    href={`/profile/${user.id}`}
                    className="flex flex-col items-center p-4 rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] hover:border-[#E0301E] transition-colors"
                  >
                    <img
                      src={user.avatar_url || "/default-avatar.png"}
                      alt={user.username}
                      className="w-16 h-16 rounded-full mb-2"
                    />
                    <span className="font-medium text-white text-sm">@{user.username}</span>
                    <span className="text-xs text-[#A0A0A0]">{user.total_posts} posts</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <UserIcon size={48} className="mx-auto mb-4 text-[#A0A0A0]" />
                <p className="text-[#A0A0A0]">No users found for "{initialQuery}"</p>
              </div>
            )
          )}
        </>
      )}

      {!initialQuery && (
        <div className="text-center py-12">
          <Search size={64} className="mx-auto mb-4 text-[#A0A0A0]" />
          <h2 className="text-xl font-bold text-white mb-2">Search KohliVerse</h2>
          <p className="text-[#A0A0A0]">Find posts by title, tags, or discover creators</p>
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin" size={32} style={{ color: COLORS.primary }} />
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}

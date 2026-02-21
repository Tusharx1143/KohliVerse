"use client"

import { useState, useEffect } from "react"
import { Post, SortOption } from "@/lib/types"
import { COLORS } from "@/lib/constants"
import { getPosts } from "@/lib/db-utils"
import VideoCard from "@/components/VideoCard"
import SortFilter from "@/components/SortFilter"
import { Loader2 } from "lucide-react"

const POSTS_PER_PAGE = 10

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<SortOption>("hot")
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    loadPosts(true)
  }, [sort])

  const loadPosts = async (reset = false) => {
    setLoading(true)
    
    const newOffset = reset ? 0 : offset
    
    try {
      const dbPosts = await getPosts({
        sort,
        limit: POSTS_PER_PAGE,
        offset: newOffset,
      })

      const mappedPosts: Post[] = dbPosts.map((p: any) => ({
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

      if (reset) {
        setPosts(mappedPosts)
        setOffset(POSTS_PER_PAGE)
      } else {
        setPosts((prev) => [...prev, ...mappedPosts])
        setOffset(prev => prev + POSTS_PER_PAGE)
      }

      setHasMore(mappedPosts.length === POSTS_PER_PAGE)
    } catch (error) {
      console.error("Error loading posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      loadPosts(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Kohli Edits</h1>
          <p className="text-xs sm:text-sm mt-1" style={{ color: COLORS.textSecondary }}>
            The best Virat Kohli edits, ranked by you
          </p>
        </div>
        <SortFilter currentSort={sort} onSortChange={setSort} />
      </div>

      {posts.length === 0 && !loading ? (
        <div
          className="text-center py-16 rounded-xl border"
          style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}
        >
          <div className="text-6xl mb-4">🎬</div>
          <h3 className="text-xl font-semibold text-white mb-2">No edits yet</h3>
          <p className="mb-4" style={{ color: COLORS.textSecondary }}>
            Be the first to submit a Virat Kohli edit!
          </p>
          <a
            href="/submit"
            className="inline-flex px-6 py-2 rounded-lg font-medium"
            style={{ backgroundColor: COLORS.primary, color: "white" }}
          >
            Submit Edit
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <VideoCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin" size={32} style={{ color: COLORS.primary }} />
        </div>
      )}

      {hasMore && !loading && posts.length > 0 && (
        <div className="flex justify-center mt-6">
          <button
            onClick={loadMore}
            className="px-6 py-2 rounded-lg font-medium transition-colors"
            style={{ backgroundColor: COLORS.muted, color: COLORS.textSecondary }}
          >
            Load More
          </button>
        </div>
      )}
    </div>
  )
}

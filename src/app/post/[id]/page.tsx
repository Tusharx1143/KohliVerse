"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { useUser } from "@clerk/nextjs"
import { Post, Comment } from "@/lib/types"
import { COLORS } from "@/lib/constants"
import { formatNumber, timeAgo } from "@/lib/utils"
import { getPostById, getComments as getDbComments, createComment, votePost, unvotePost, getUserById } from "@/lib/db-utils"
import { ArrowBigUp, ArrowBigDown, MessageCircle, Share2, Send } from "lucide-react"
import Link from "next/link"
import { Loader2 } from "lucide-react"

export default function PostPage() {
  const params = useParams()
  const postId = parseInt(params.id as string)
  const { userId } = useAuth()
  const { user: clerkUser } = useUser()
  
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [votes, setVotes] = useState({ upvotes: 0, downvotes: 0 })
  const [userVote, setUserVote] = useState<"up" | "down" | null>(null)

  useEffect(() => {
    const loadPost = async () => {
      if (isNaN(postId)) {
        setLoading(false)
        return
      }
      
      const dbPost = await getPostById(postId)
      if (dbPost) {
        const p = dbPost as any
        setPost({
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
        })
        setVotes({ upvotes: p.upvotes, downvotes: p.downvotes })
      }
      setLoading(false)
    }
    loadPost()
  }, [postId])

  useEffect(() => {
    if (isNaN(postId)) return
    
    const loadComments = async () => {
      const dbComments = await getDbComments(postId)
      setComments(dbComments.map((c: any) => ({
        id: c.id.toString(),
        postId: c.post_id,
        userId: c.user_id,
        username: c.username,
        avatarUrl: c.avatar_url,
        content: c.content,
        createdAt: new Date(c.created_at),
      })))
    }
    loadComments()
  }, [postId])

  const handleVote = async (type: "up" | "down") => {
    if (!userId || !post) return

    try {
      if (userVote === type) {
        await unvotePost(postId, type)
        await votePost(postId, type === "up" ? "down" : "up")
        setVotes(prev => ({
          ...prev,
          [type === "up" ? "upvotes" : "downvotes"]: prev[type === "up" ? "upvotes" : "downvotes"] - 1
        }))
        setUserVote(null)
      } else {
        if (userVote) {
          await unvotePost(postId, userVote)
          setVotes(prev => ({
            ...prev,
            [userVote === "up" ? "upvotes" : "downvotes"]: prev[userVote === "up" ? "upvotes" : "downvotes"] - 1
          }))
        }
        await votePost(postId, type)
        setVotes(prev => ({
          ...prev,
          [type === "up" ? "upvotes" : "downvotes"]: prev[type === "up" ? "upvotes" : "downvotes"] + 1
        }))
        setUserVote(type)
      }
    } catch (error) {
      console.error("Vote error:", error)
    }
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !newComment.trim()) return

    setSubmitting(true)
    try {
      const dbUser = await getUserById(userId)
      const user = dbUser as any
      const username = user?.username || clerkUser?.username || "Anonymous"
      const avatarUrl = user?.avatar_url || clerkUser?.imageUrl || "/default-avatar.png"

      await createComment({
        post_id: postId,
        user_id: userId,
        username,
        avatar_url: avatarUrl,
        content: newComment.trim(),
      })

      setNewComment("")
      
      // Reload comments
      const dbComments = await getDbComments(postId)
      setComments(dbComments.map((c: any) => ({
        id: c.id.toString(),
        postId: c.post_id,
        userId: c.user_id,
        username: c.username,
        avatarUrl: c.avatar_url,
        content: c.content,
        createdAt: new Date(c.created_at),
      })))
    } catch (error) {
      console.error("Comment error:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: post?.title, url })
    } else {
      await navigator.clipboard.writeText(url)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin" size={32} style={{ color: COLORS.primary }} />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-white">Post not found</h1>
      </div>
    )
  }

  const score = votes.upvotes - votes.downvotes
  const isUpload = post.type === "upload"
  const isVideo = isUpload && post.mediaType === "video"
  const isImage = isUpload && post.mediaType === "image"

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
        <div className="flex">
          <div className="w-16 flex flex-col items-center py-4 gap-2" style={{ backgroundColor: COLORS.muted }}>
            <button
              onClick={() => handleVote("up")}
              disabled={!userId}
              className="p-1 rounded transition-colors disabled:opacity-50"
              style={{ color: userVote === "up" ? COLORS.primary : COLORS.textSecondary }}
            >
              <ArrowBigUp size={28} fill={userVote === "up" ? COLORS.primary : "none"} />
            </button>
            <span className="font-bold" style={{ color: score > 0 ? COLORS.primary : score < 0 ? COLORS.primaryGold : COLORS.textSecondary }}>
              {formatNumber(score)}
            </span>
            <button
              onClick={() => handleVote("down")}
              disabled={!userId}
              className="p-1 rounded transition-colors disabled:opacity-50"
              style={{ color: userVote === "down" ? COLORS.primaryGold : COLORS.textSecondary }}
            >
              <ArrowBigDown size={28} fill={userVote === "down" ? COLORS.primaryGold : "none"} />
            </button>
          </div>

          <div className="flex-1">
            <div className="aspect-video bg-black">
              {isImage ? (
                <img
                  src={post.mediaUrl || ""}
                  alt={post.title}
                  className="w-full h-full object-contain"
                />
              ) : isVideo ? (
                <video
                  src={post.mediaUrl}
                  className="w-full h-full object-contain"
                  controls
                  poster={post.thumbnailUrl}
                />
              ) : post.platform === "youtube" ? (
                <iframe
                  src={post.embedUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <iframe
                  src={`https://www.instagram.com/p/${post.videoUrl?.split('/p/')[1]?.split('/')[0]}/embed`}
                  className="w-full h-full"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              )}
            </div>

            <div className="p-4">
              <h1 className="text-xl font-bold text-white">{post.title}</h1>
              
              <div className="flex items-center gap-3 mt-3 text-sm" style={{ color: COLORS.textSecondary }}>
                <Link href={`/profile/${post.authorId}`} className="flex items-center gap-2 hover:underline">
                  <img 
                    src={post.authorAvatar || "/default-avatar.png"} 
                    alt={post.authorName} 
                    className="w-6 h-6 rounded-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/default-avatar.png"
                    }}
                  />
                  <span style={{ color: COLORS.primary }}>{post.authorName}</span>
                </Link>
                <span>•</span>
                <span>{timeAgo(post.createdAt)}</span>
              </div>

              <div className="flex items-center gap-4 mt-4">
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 text-sm transition-colors"
                  style={{ color: COLORS.textSecondary }}
                >
                  <Share2 size={18} />
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="comments" className="mt-8">
        <h2 className="text-lg font-bold text-white mb-4">
          Comments ({comments.length})
        </h2>

        {userId ? (
          <form onSubmit={handleComment} className="flex gap-3 mb-6">
            <img
              src={clerkUser?.imageUrl || "/default-avatar.png"}
              alt="You"
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: COLORS.card,
                  borderColor: COLORS.border,
                  color: "white",
                }}
              />
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                style={{ backgroundColor: COLORS.primary, color: "white" }}
              >
                <Send size={18} />
              </button>
            </div>
          </form>
        ) : (
          <p className="mb-6" style={{ color: COLORS.textSecondary }}>
            Login to comment
          </p>
        )}

        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="flex gap-3 p-4 rounded-xl border"
              style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}
            >
              <Link href={`/profile/${comment.userId}`}>
                <img
                  src={comment.avatarUrl}
                  alt={comment.username}
                  className="w-10 h-10 rounded-full"
                />
              </Link>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Link href={`/profile/${comment.userId}`} className="font-medium" style={{ color: COLORS.primary }}>
                    {comment.username}
                  </Link>
                  <span className="text-sm" style={{ color: COLORS.textSecondary }}>
                    {timeAgo(comment.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-white">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

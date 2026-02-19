"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { db, auth } from "@/lib/firebase"
import { doc, getDoc, collection, addDoc, query, orderBy, onSnapshot, increment, updateDoc, setDoc, deleteDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { Post, Comment } from "@/lib/types"
import { COLORS } from "@/lib/constants"
import { formatNumber, timeAgo } from "@/lib/utils"
import { ArrowBigUp, ArrowBigDown, MessageCircle, Share2, Send } from "lucide-react"
import Link from "next/link"
import { Loader2 } from "lucide-react"

export default function PostPage() {
  const params = useParams()
  const postId = params.id as string
  
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [user, setUser] = useState(auth.currentUser)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [votes, setVotes] = useState({ upvotes: 0, downvotes: 0 })
  const [userVote, setUserVote] = useState<"up" | "down" | null>(null)

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user)
    })
    return () => unsubscribeAuth()
  }, [])

  useEffect(() => {
    const loadPost = async () => {
      const postSnap = await getDoc(doc(db, "posts", postId))
      if (postSnap.exists()) {
        const data = postSnap.data()
        setPost({
          id: postSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Post)
        setVotes({ upvotes: data.upvotes, downvotes: data.downvotes })
      }
      setLoading(false)
    }
    loadPost()
  }, [postId])

  useEffect(() => {
    const q = query(
      collection(db, "comments", postId, "comments"),
      orderBy("createdAt", "desc")
    )
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Comment
      }))
    })
    
    return () => unsubscribe()
  }, [postId])

  const handleVote = async (type: "up" | "down") => {
    if (!user || !post) return

    const voteId = `${user.uid}_${post.id}`
    
    try {
      const voteRef = doc(db, "votes", voteId)
      const voteSnap = await getDoc(voteRef)
      
      if (voteSnap.exists()) {
        const existingVote = voteSnap.data().type
        if (existingVote === type) {
          await deleteDoc(voteRef)
          await updateDoc(doc(db, "posts", post.id), {
            [type === "up" ? "upvotes" : "downvotes"]: increment(-1)
          })
          setVotes(prev => ({
            ...prev,
            [type === "up" ? "upvotes" : "downvotes"]: prev[type === "up" ? "upvotes" : "downvotes"] - 1
          }))
          setUserVote(null)
        } else {
          await deleteDoc(voteRef)
          await updateDoc(doc(db, "posts", post.id), {
            [existingVote === "up" ? "upvotes" : "downvotes"]: increment(-1),
            [type === "up" ? "upvotes" : "downvotes"]: increment(1)
          })
          setVotes(prev => ({
            upvotes: prev.upvotes + (type === "up" ? 1 : -1) - (existingVote === "up" ? 1 : -1),
            downvotes: prev.downvotes + (type === "down" ? 1 : -1) - (existingVote === "down" ? 1 : -1)
          }))
          setUserVote(type)
        }
      } else {
        await setDoc(voteRef, {
          userId: user.uid,
          postId: post.id,
          type,
          createdAt: new Date()
        })
        await updateDoc(doc(db, "posts", post.id), {
          [type === "up" ? "upvotes" : "downvotes"]: increment(1)
        })
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
    if (!user || !newComment.trim()) return

    setSubmitting(true)
    try {
      await addDoc(collection(db, "comments", postId, "comments"), {
        userId: user.uid,
        username: user.displayName || "Anonymous",
        avatarUrl: user.photoURL || "/default-avatar.png",
        content: newComment.trim(),
        createdAt: new Date()
      })

      await updateDoc(doc(db, "posts", postId), {
        commentCount: increment(1)
      })

      setNewComment("")
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
        <div className="flex">
          <div className="w-16 flex flex-col items-center py-4 gap-2" style={{ backgroundColor: COLORS.muted }}>
            <button
              onClick={() => handleVote("up")}
              disabled={!user}
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
              disabled={!user}
              className="p-1 rounded transition-colors disabled:opacity-50"
              style={{ color: userVote === "down" ? COLORS.primaryGold : COLORS.textSecondary }}
            >
              <ArrowBigDown size={28} fill={userVote === "down" ? COLORS.primaryGold : "none"} />
            </button>
          </div>

          <div className="flex-1">
            <div className="aspect-video bg-black">
              {post.platform === "youtube" ? (
                <iframe
                  src={post.embedUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <iframe
                  src={post.embedUrl}
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
                  <img src={post.authorAvatar} alt={post.authorName} className="w-6 h-6 rounded-full" />
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

        {user ? (
          <form onSubmit={handleComment} className="flex gap-3 mb-6">
            <img
              src={user.photoURL || "/default-avatar.png"}
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

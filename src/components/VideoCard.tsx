"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowBigUp, ArrowBigDown, MessageCircle, Share2 } from "lucide-react"
import { Post } from "@/lib/types"
import { COLORS } from "@/lib/constants"
import { formatNumber, timeAgo } from "@/lib/utils"
import { auth, db } from "@/lib/firebase"
import { doc, updateDoc, increment, setDoc, deleteDoc, getDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"

interface VideoCardProps {
  post: Post
}

export default function VideoCard({ post }: VideoCardProps) {
  const [votes, setVotes] = useState({ upvotes: post.upvotes, downvotes: post.downvotes })
  const [userVote, setUserVote] = useState<"up" | "down" | null>(post.userVote || null)
  const [isVoting, setIsVoting] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const voteDoc = await getDoc(doc(db, "votes", `${user.uid}_${post.id}`))
        if (voteDoc.exists()) {
          setUserVote(voteDoc.data().type as "up" | "down")
        }
      }
    })
    return () => unsubscribe()
  }, [post.id])

  const handleVote = async (type: "up" | "down") => {
    if (!auth.currentUser || isVoting) return
    setIsVoting(true)

    const userId = auth.currentUser.uid
    const voteId = `${userId}_${post.id}`
    const voteRef = doc(db, "votes", voteId)
    const postRef = doc(db, "posts", post.id)

    try {
      if (userVote === type) {
        await deleteDoc(voteRef)
        await updateDoc(postRef, {
          [type === "up" ? "upvotes" : "downvotes"]: increment(-1),
        })
        setVotes(prev => ({
          ...prev,
          [type === "up" ? "upvotes" : "downvotes"]: prev[type === "up" ? "upvotes" : "downvotes"] - 1
        }))
        setUserVote(null)
      } else {
        if (userVote) {
          await deleteDoc(voteRef)
          await updateDoc(postRef, {
            [userVote === "up" ? "upvotes" : "downvotes"]: increment(-1),
          })
          setVotes(prev => ({
            ...prev,
            [userVote === "up" ? "upvotes" : "downvotes"]: prev[userVote === "up" ? "upvotes" : "downvotes"] - 1
          }))
        }

        await setDoc(voteRef, {
          userId,
          postId: post.id,
          type,
          createdAt: new Date()
        })

        await updateDoc(postRef, {
          [type === "up" ? "upvotes" : "downvotes"]: increment(1),
        })

        setVotes(prev => ({
          ...prev,
          [type === "up" ? "upvotes" : "downvotes"]: prev[type === "up" ? "upvotes" : "downvotes"] + 1
        }))
        setUserVote(type)
      }
    } catch (error) {
      console.error("Vote error:", error)
    } finally {
      setIsVoting(false)
    }
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${post.id}`
    if (navigator.share) {
      await navigator.share({ title: post.title, url })
    } else {
      await navigator.clipboard.writeText(url)
    }
  }

  const score = votes.upvotes - votes.downvotes
  const isYoutube = post.platform === "youtube"

  return (
    <div
      className="rounded-xl overflow-hidden border"
      style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Vote buttons - horizontal on mobile, vertical on desktop */}
        <div
          className="flex sm:flex-col items-center justify-center gap-2 sm:gap-1 p-2 sm:p-3 sm:w-12"
          style={{ backgroundColor: COLORS.muted }}
        >
          <button
            onClick={() => handleVote("up")}
            disabled={!auth.currentUser || isVoting}
            className="p-1 rounded transition-colors disabled:opacity-50"
            style={{ color: userVote === "up" ? COLORS.primary : COLORS.textSecondary }}
          >
            <ArrowBigUp size={24} fill={userVote === "up" ? COLORS.primary : "none"} />
          </button>
          <span
            className="text-sm font-bold"
            style={{ color: score > 0 ? COLORS.primary : score < 0 ? COLORS.primaryGold : COLORS.textSecondary }}
          >
            {formatNumber(score)}
          </span>
          <button
            onClick={() => handleVote("down")}
            disabled={!auth.currentUser || isVoting}
            className="p-1 rounded transition-colors disabled:opacity-50"
            style={{ color: userVote === "down" ? COLORS.primaryGold : COLORS.textSecondary }}
          >
            <ArrowBigDown size={24} fill={userVote === "down" ? COLORS.primaryGold : "none"} />
          </button>
        </div>

        <div className="flex-1">
          <Link href={`/post/${post.id}`}>
            <div className="relative aspect-video bg-black">
              <img
                src={post.thumbnailUrl}
                alt={post.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: COLORS.primary + "CC" }}
                >
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
              {isYoutube && (
                <div
                  className="absolute bottom-2 right-2 px-2 py-1 rounded text-xs font-medium text-white"
                  style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
                >
                  YouTube
                </div>
              )}
            </div>
          </Link>

          <div className="p-3">
            <Link href={`/post/${post.id}`}>
              <h3 className="font-semibold text-white line-clamp-2 hover:underline text-sm sm:text-base">
                {post.title}
              </h3>
            </Link>

            <div className="flex items-center gap-2 mt-2 text-xs sm:text-sm" style={{ color: COLORS.textSecondary }}>
              <Link
                href={`/profile/${post.authorId}`}
                className="flex items-center gap-2 hover:underline"
              >
                <img
                  src={post.authorAvatar}
                  alt={post.authorName}
                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-full"
                />
                <span style={{ color: COLORS.primary }}>{post.authorName}</span>
              </Link>
              <span>•</span>
              <span>{timeAgo(post.createdAt)}</span>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 mt-3">
              <Link
                href={`/post/${post.id}#comments`}
                className="flex items-center gap-1 text-xs sm:text-sm transition-colors"
                style={{ color: COLORS.textSecondary }}
              >
                <MessageCircle size={16} />
                <span>{post.commentCount}</span>
              </Link>
              <button
                onClick={handleShare}
                className="flex items-center gap-1 text-xs sm:text-sm transition-colors"
                style={{ color: COLORS.textSecondary }}
              >
                <Share2 size={16} />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

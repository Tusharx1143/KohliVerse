"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowBigUp, ArrowBigDown, MessageCircle, Share2, Bookmark, Flag, UserPlus, UserCheck } from "lucide-react"
import { Post } from "@/lib/types"
import { formatNumber, timeAgo } from "@/lib/utils"
import { auth, db } from "@/lib/firebase"
import { doc, updateDoc, increment, setDoc, deleteDoc, getDoc, collection, addDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"

interface VideoCardProps {
  post: Post
  showAuthorFollow?: boolean
}

export default function VideoCard({ post, showAuthorFollow = true }: VideoCardProps) {
  const [votes, setVotes] = useState({ upvotes: post.upvotes, downvotes: post.downvotes })
  const [userVote, setUserVote] = useState<"up" | "down" | null>(post.userVote || null)
  const [isVoting, setIsVoting] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState("")
  const [reportDescription, setReportDescription] = useState("")
  const [reportSubmitting, setReportSubmitting] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check vote
        const voteDoc = await getDoc(doc(db, "votes", `${user.uid}_${post.id}`))
        if (voteDoc.exists()) {
          setUserVote(voteDoc.data().type as "up" | "down")
        }
        
        // Check if saved
        const saveDoc = await getDoc(doc(db, "saves", `${user.uid}_${post.id}`))
        setIsSaved(saveDoc.exists())

        // Check if following
        const followDoc = await getDoc(doc(db, "follows", `${user.uid}_${post.authorId}`))
        setIsFollowing(followDoc.exists())
      }
    })
    return () => unsubscribe()
  }, [post.id, post.authorId])

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

        // Create notification
        if (type === "up" && post.authorId !== userId) {
          await addDoc(collection(db, "notifications", post.authorId, "userNotifications"), {
            userId: post.authorId,
            type: "upvote",
            fromUserId: userId,
            fromUsername: auth.currentUser.displayName || "User",
            fromUserAvatar: auth.currentUser.photoURL || "",
            postId: post.id,
            read: false,
            createdAt: new Date()
          })
        }
      }
    } catch (error) {
      console.error("Vote error:", error)
    } finally {
      setIsVoting(false)
    }
  }

  const handleSave = async () => {
    if (!auth.currentUser) return
    
    const userId = auth.currentUser.uid
    const saveId = `${userId}_${post.id}`
    const saveRef = doc(db, "saves", saveId)

    try {
      if (isSaved) {
        await deleteDoc(saveRef)
        setIsSaved(false)
      } else {
        await setDoc(saveRef, {
          userId,
          postId: post.id,
          createdAt: new Date()
        })
        setIsSaved(true)
      }
    } catch (error) {
      console.error("Save error:", error)
    }
  }

  const handleFollow = async () => {
    if (!auth.currentUser || post.authorId === auth.currentUser.uid) return
    
    const userId = auth.currentUser.uid
    const followId = `${userId}_${post.authorId}`
    const followRef = doc(db, "follows", followId)

    try {
      if (isFollowing) {
        await deleteDoc(followRef)
        setIsFollowing(false)
      } else {
        await setDoc(followRef, {
          followerId: userId,
          followingId: post.authorId,
          createdAt: new Date()
        })
        setIsFollowing(true)

        // Create notification
        await addDoc(collection(db, "notifications", post.authorId, "userNotifications"), {
          userId: post.authorId,
          type: "follow",
          fromUserId: userId,
          fromUsername: auth.currentUser.displayName || "User",
          fromUserAvatar: auth.currentUser.photoURL || "",
          read: false,
          createdAt: new Date()
        })
      }
    } catch (error) {
      console.error("Follow error:", error)
    }
  }

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!auth.currentUser || !reportReason) return
    
    setReportSubmitting(true)
    try {
      await addDoc(collection(db, "reports"), {
        reporterId: auth.currentUser.uid,
        postId: post.id,
        reason: reportReason,
        description: reportDescription.trim() || null,
        status: "pending",
        createdAt: new Date()
      })
      setShowReportModal(false)
      setReportReason("")
      setReportDescription("")
      alert("Report submitted. We'll review it soon.")
    } catch (error) {
      console.error("Report error:", error)
    } finally {
      setReportSubmitting(false)
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
  const isOwnPost = auth.currentUser?.uid === post.authorId

  return (
    <>
      <div className="rounded-xl overflow-hidden border border-[#2A2A2A] bg-[#1A1A1A]">
        <div className="flex flex-col sm:flex-row">
          <div className="flex sm:flex-col items-center justify-center gap-2 sm:gap-1 p-2 sm:p-3 sm:w-12 bg-[#2A2A2A]">
            <button
              onClick={() => handleVote("up")}
              disabled={!auth.currentUser || isVoting}
              className="p-1 rounded transition-colors disabled:opacity-50"
              style={{ color: userVote === "up" ? "#E0301E" : "#A0A0A0" }}
            >
              <ArrowBigUp size={24} fill={userVote === "up" ? "#E0301E" : "none"} />
            </button>
            <span
              className="text-sm font-bold"
              style={{ color: score > 0 ? "#E0301E" : score < 0 ? "#FFD200" : "#A0A0A0" }}
            >
              {formatNumber(score)}
            </span>
            <button
              onClick={() => handleVote("down")}
              disabled={!auth.currentUser || isVoting}
              className="p-1 rounded transition-colors disabled:opacity-50"
              style={{ color: userVote === "down" ? "#FFD200" : "#A0A0A0" }}
            >
              <ArrowBigDown size={24} fill={userVote === "down" ? "#FFD200" : "none"} />
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
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center bg-[#E0301E]/80">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                {isYoutube && (
                  <div className="absolute bottom-2 right-2 px-2 py-1 rounded text-xs font-medium text-white bg-black/80">
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

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {post.tags.slice(0, 4).map(tag => (
                    <Link
                      key={tag}
                      href={`/search?q=${tag}`}
                      className="px-2 py-0.5 rounded text-xs bg-[#2A2A2A] text-[#A0A0A0] hover:text-[#E0301E]"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-[#A0A0A0]">
                  <Link href={`/profile/${post.authorId}`} className="flex items-center gap-2 hover:underline">
                    <img src={post.authorAvatar} alt={post.authorName} className="w-5 h-5 sm:w-6 sm:h-6 rounded-full" />
                    <span className="text-[#E0301E]">{post.authorName}</span>
                  </Link>
                  <span>•</span>
                  <span>{timeAgo(post.createdAt)}</span>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSave}
                    disabled={!auth.currentUser}
                    className="p-1.5 rounded hover:bg-[#2A2A2A] disabled:opacity-50"
                    style={{ color: isSaved ? "#E0301E" : "#A0A0A0" }}
                    title="Save"
                  >
                    <Bookmark size={16} fill={isSaved ? "#E0301E" : "none"} />
                  </button>
                  
                  {showAuthorFollow && !isOwnPost && auth.currentUser && (
                    <button
                      onClick={handleFollow}
                      className="p-1.5 rounded hover:bg-[#2A2A2A]"
                      style={{ color: isFollowing ? "#E0301E" : "#A0A0A0" }}
                      title={isFollowing ? "Unfollow" : "Follow"}
                    >
                      {isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
                    </button>
                  )}
                  
                  <Link
                    href={`/post/${post.id}#comments`}
                    className="p-1.5 rounded hover:bg-[#2A2A2A] text-[#A0A0A0]"
                  >
                    <MessageCircle size={16} />
                  </Link>
                  
                  <button
                    onClick={handleShare}
                    className="p-1.5 rounded hover:bg-[#2A2A2A] text-[#A0A0A0]"
                  >
                    <Share2 size={16} />
                  </button>
                  
                  {!isOwnPost && (
                    <button
                      onClick={() => setShowReportModal(true)}
                      className="p-1.5 rounded hover:bg-[#2A2A2A] text-[#A0A0A0]"
                      title="Report"
                    >
                      <Flag size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-md rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-6">
            <h3 className="text-lg font-bold text-white mb-4">Report Post</h3>
            <form onSubmit={handleReport} className="space-y-4">
              <div>
                <label className="block text-sm text-white mb-2">Reason</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-[#2A2A2A] bg-transparent text-white"
                  required
                >
                  <option value="">Select a reason</option>
                  <option value="spam">Spam</option>
                  <option value="nsfw">NSFW / Inappropriate</option>
                  <option value="copyright">Copyright</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-white mb-2">Description (optional)</label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-[#2A2A2A] bg-transparent text-white placeholder-neutral-500"
                  placeholder="Tell us more..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={reportSubmitting || !reportReason}
                  className="flex-1 py-2 rounded-lg font-medium bg-[#E0301E] text-white disabled:opacity-50"
                >
                  {reportSubmitting ? "Submitting..." : "Submit Report"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 rounded-lg border border-[#2A2A2A] text-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { auth, db } from "@/lib/firebase"
import { collection, addDoc, updateDoc, doc, increment, getDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { COLORS, APP_NAME } from "@/lib/constants"
import { extractVideoId, getThumbnailUrl } from "@/lib/utils"
import { Loader2, Link2, AlertCircle } from "lucide-react"

export default function SubmitPage() {
  const router = useRouter()
  const [user, setUser] = useState(auth.currentUser)
  const [url, setUrl] = useState("")
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<{ thumbnail: string; platform: string } | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/")
      }
      setUser(user)
    })
    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    if (url) {
      const { platform, id } = extractVideoId(url)
      if (platform && id) {
        setPreview({
          thumbnail: getThumbnailUrl(url),
          platform,
        })
        setError("")
      } else {
        setPreview(null)
        setError("Please enter a valid YouTube or Instagram URL")
      }
    } else {
      setPreview(null)
      setError("")
    }
  }, [url])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !url || !title) return

    setLoading(true)
    setError("")

    try {
      const { platform, id } = extractVideoId(url)
      if (!platform || !id) {
        throw new Error("Invalid URL")
      }

      const postRef = await addDoc(collection(db, "posts"), {
        authorId: user.uid,
        authorName: user.displayName || "Anonymous",
        authorAvatar: user.photoURL || "/default-avatar.png",
        videoUrl: url,
        embedUrl: `https://www.youtube.com/embed/${id}`,
        thumbnailUrl: getThumbnailUrl(url),
        platform,
        title,
        upvotes: 0,
        downvotes: 0,
        commentCount: 0,
        createdAt: new Date(),
        hotScore: 0,
      })

      await updateDoc(doc(db, "posts", postRef.id), {
        hotScore: 0,
      })

      const userRef = doc(db, "users", user.uid)
      const userSnap = await getDoc(userRef)
      if (userSnap.exists()) {
        await updateDoc(userRef, {
          totalPosts: increment(1),
        })
      }

      router.push("/")
    } catch (err) {
      setError("Failed to submit. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin" size={32} style={{ color: COLORS.primary }} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-2">Submit an Edit</h1>
      <p className="text-sm mb-6" style={{ color: COLORS.textSecondary }}>
        Share the best Virat Kohli edits with the community
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Video URL
          </label>
          <div className="relative">
            <Link2
              className="absolute left-3 top-1/2 -translate-y-1/2"
              size={20}
              style={{ color: COLORS.textSecondary }}
            />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste YouTube or Instagram link..."
              className="w-full pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
              style={{
                backgroundColor: COLORS.card,
                borderColor: COLORS.border,
                color: "white",
              }}
              required
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 mt-2 text-sm" style={{ color: COLORS.primary }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {preview && (
          <div className="rounded-xl overflow-hidden border" style={{ borderColor: COLORS.border }}>
            <div className="aspect-video bg-black">
              <img
                src={preview.thumbnail}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-3" style={{ backgroundColor: COLORS.card }}>
              <span
                className="text-xs px-2 py-1 rounded"
                style={{ backgroundColor: COLORS.muted, color: COLORS.textSecondary }}
              >
                {preview.platform === "youtube" ? "YouTube" : "Instagram"}
              </span>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your edit a title..."
            className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
            style={{
              backgroundColor: COLORS.card,
              borderColor: COLORS.border,
              color: "white",
            }}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || !url || !title || !!error}
          className="w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          style={{ backgroundColor: COLORS.primary, color: "white" }}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Submitting...
            </>
          ) : (
            "Submit Edit"
          )}
        </button>
      </form>
    </div>
  )
}

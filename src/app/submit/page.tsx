"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { auth, db } from "@/lib/firebase"
import { collection, addDoc, updateDoc, doc, increment, getDoc, getDocs, query, where } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { COLORS, APP_NAME } from "@/lib/constants"
import { extractVideoId, getThumbnailUrl } from "@/lib/utils"
import { DEFAULT_TAGS } from "@/lib/types"
import { Loader2, Link2, AlertCircle, X } from "lucide-react"

export default function SubmitPage() {
  const router = useRouter()
  const [user, setUser] = useState(auth.currentUser)
  const [url, setUrl] = useState("")
  const [title, setTitle] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [customTag, setCustomTag] = useState("")
  const [loading, setLoading] = useState(false)
  const [checkingDuplicate, setCheckingDuplicate] = useState(false)
  const [preview, setPreview] = useState<{ thumbnail: string; platform: string } | null>(null)
  const [error, setError] = useState("")
  const [duplicatePost, setDuplicatePost] = useState<{ id: string; title: string } | null>(null)

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
    const checkUrl = async () => {
      if (url) {
        const { platform, id } = extractVideoId(url)
        if (platform && id) {
          setPreview({
            thumbnail: getThumbnailUrl(url),
            platform,
          })
          setError("")
          
          // Check for duplicates
          setCheckingDuplicate(true)
          try {
            const urlHash = btoa(url).slice(0, 50) // Simple hash
            const dupQuery = query(
              collection(db, "posts"),
              where("videoUrlHash", "==", urlHash)
            )
            const dupSnap = await getDocs(dupQuery)
            if (!dupSnap.empty) {
              const dupPost = dupSnap.docs[0].data()
              setDuplicatePost({ id: dupSnap.docs[0].id, title: dupPost.title })
            } else {
              setDuplicatePost(null)
            }
          } catch (err) {
            console.error("Duplicate check error:", err)
          } finally {
            setCheckingDuplicate(false)
          }
        } else {
          setPreview(null)
          setError("Please enter a valid YouTube or Instagram URL")
          setDuplicatePost(null)
        }
      } else {
        setPreview(null)
        setError("")
        setDuplicatePost(null)
      }
    }
    
    const timeoutId = setTimeout(checkUrl, 500)
    return () => clearTimeout(timeoutId)
  }, [url])

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag))
    } else if (selectedTags.length < 5) {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const addCustomTag = () => {
    const tag = customTag.trim()
    if (tag && !selectedTags.includes(tag) && selectedTags.length < 5) {
      setSelectedTags([...selectedTags, tag])
      setCustomTag("")
    }
  }

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !url || !title || duplicatePost) return

    setLoading(true)
    setError("")

    try {
      const { platform, id } = extractVideoId(url)
      if (!platform || !id) {
        throw new Error("Invalid URL")
      }

      const urlHash = btoa(url).slice(0, 50)

      const postRef = await addDoc(collection(db, "posts"), {
        authorId: user.uid,
        authorName: user.displayName || "Anonymous",
        authorAvatar: user.photoURL || "/default-avatar.png",
        videoUrl: url,
        videoUrlHash: urlHash,
        embedUrl: `https://www.youtube.com/embed/${id}`,
        thumbnailUrl: getThumbnailUrl(url),
        platform,
        title,
        tags: selectedTags,
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
          
          {/* Duplicate warning */}
          {checkingDuplicate && (
            <p className="text-xs mt-2" style={{ color: COLORS.textSecondary }}>
              Checking for duplicates...
            </p>
          )}
          
          {duplicatePost && (
            <div className="mt-2 p-3 rounded-lg border border-yellow-500/50 bg-yellow-500/10">
              <p className="text-sm text-yellow-500">
                This video has already been submitted!
              </p>
              <a
                href={`/post/${duplicatePost.id}`}
                className="text-sm text-[#E0301E] hover:underline"
              >
                View existing post: {duplicatePost.title}
              </a>
            </div>
          )}
          
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

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Tags (optional, max 5)
          </label>
          
          {/* Selected tags */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedTags.map(tag => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#E0301E] text-white text-sm"
                >
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)}>
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
          
          {/* Default tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            {DEFAULT_TAGS.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                disabled={selectedTags.length >= 5 && !selectedTags.includes(tag)}
                className={`px-3 py-1 rounded-full text-sm border transition-colors disabled:opacity-50 ${
                  selectedTags.includes(tag)
                    ? "bg-[#E0301E] border-[#E0301E] text-white"
                    : "border-[#2A2A2A] text-[#A0A0A0] hover:border-[#E0301E] hover:text-[#E0301E]"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
          
          {/* Custom tag input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCustomTag())}
              placeholder="Add custom tag..."
              className="flex-1 px-4 py-2 rounded-lg border bg-transparent text-white placeholder-neutral-500 text-sm"
              style={{ borderColor: COLORS.border }}
              disabled={selectedTags.length >= 5}
            />
            <button
              type="button"
              onClick={addCustomTag}
              disabled={!customTag.trim() || selectedTags.length >= 5}
              className="px-4 py-2 rounded-lg border border-[#2A2A2A] text-white text-sm disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !url || !title || !!error || !!duplicatePost}
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

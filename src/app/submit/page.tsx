"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { useUser } from "@clerk/nextjs"
import { put } from "@vercel/blob"
import { COLORS, APP_NAME } from "@/lib/constants"
import { extractVideoId, getThumbnailUrl } from "@/lib/utils"
import { DEFAULT_TAGS } from "@/lib/types"
import { getUserById, createUser, createPost, updateUser, checkDuplicateUrl } from "@/lib/db-utils"
import { Loader2, Link2, AlertCircle, X, Upload, CloudUpload } from "lucide-react"

type SubmitMode = "url" | "upload"

export default function SubmitPage() {
  const router = useRouter()
  const { userId } = useAuth()
  const { user: clerkUser } = useUser()
  const [mode, setMode] = useState<SubmitMode>("url")
  
  // URL mode
  const [url, setUrl] = useState("")
  const [preview, setPreview] = useState<{ thumbnail: string; platform: string } | null>(null)
  const [error, setError] = useState("")
  const [duplicatePost, setDuplicatePost] = useState<{ id: string; title: string } | null>(null)
  const [checkingDuplicate, setCheckingDuplicate] = useState(false)
  
  // Upload mode
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Common
  const [title, setTitle] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [customTag, setCustomTag] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState("")

  useEffect(() => {
    if (!userId) {
      router.push("/")
    }
  }, [userId, router])

  // Check URL for embeds
  useEffect(() => {
    const checkUrl = async () => {
      if (url && mode === "url") {
        const { platform, id } = extractVideoId(url)
        if (platform && id) {
          setPreview({
            thumbnail: getThumbnailUrl(url),
            platform,
          })
          setError("")
          
          setCheckingDuplicate(true)
          try {
            const urlHash = btoa(url).slice(0, 50)
            const dup = await checkDuplicateUrl(urlHash)
            if (dup) {
              const d = dup as any
              setDuplicatePost({ id: d.id.toString(), title: d.title })
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
  }, [url, mode])

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/webm"]
      if (!validTypes.includes(file.type)) {
        setError("Please select an image (JPEG, PNG, GIF, WebP) or video (MP4, WebM)")
        return
      }
      
      if (file.size > 50 * 1024 * 1024) {
        setError("File size must be less than 50MB")
        return
      }
      
      setSelectedFile(file)
      setError("")
      
      const reader = new FileReader()
      reader.onload = (event) => {
        setUploadPreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

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
    if (!userId) return

    setLoading(true)
    setSubmitError("")

    try {
      // Get user data from database
      let dbUser = await getUserById(userId)
      
      if (!dbUser) {
        // Create user if doesn't exist
        const username = clerkUser?.username || clerkUser?.firstName || `user_${userId.slice(0, 8)}`
        dbUser = await createUser({
          id: userId,
          username,
          email: clerkUser?.emailAddresses[0]?.emailAddress || "",
          avatar_url: clerkUser?.imageUrl || ""
        })
      }

      const user = dbUser as any
      const username = user.username
      const avatarUrl = user.avatar_url || clerkUser?.imageUrl || "/default-avatar.png"

      if (mode === "url") {
        if (!url || !title || duplicatePost) {
          setSubmitError("Please enter a valid URL")
          setLoading(false)
          return
        }

        const { platform, id } = extractVideoId(url)
        if (!platform || !id) {
          setSubmitError("Invalid URL")
          setLoading(false)
          return
        }

        const urlHash = btoa(url).slice(0, 50)
        const embedUrl = platform === "youtube" 
          ? `https://www.youtube.com/embed/${id}`
          : `https://www.instagram.com/p/${id}/embed/`

        await createPost({
          author_id: userId,
          author_name: username,
          author_avatar: avatarUrl,
          title,
          tags: selectedTags,
          video_url: url,
          video_url_hash: urlHash,
          embed_url: embedUrl,
          thumbnail_url: getThumbnailUrl(url),
          platform,
          post_type: "embed",
        })
      } else {
        if (!selectedFile || !title) {
          setSubmitError("Please select a file and enter a title")
          setLoading(false)
          return
        }

        setUploading(true)
        
        const fileExt = selectedFile.name.split(".").pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
        
        const blob = await put(`posts/${userId}/${fileName}`, selectedFile, {
          access: "public",
        })
        
        const isVideo = selectedFile.type.startsWith("video/")
        
        await createPost({
          author_id: userId,
          author_name: username,
          author_avatar: avatarUrl,
          title,
          tags: selectedTags,
          media_url: blob.url,
          media_type: isVideo ? "video" : "image",
          thumbnail_url: isVideo ? "/video-placeholder.svg" : blob.url,
          post_type: "upload",
        })
        
        setUploading(false)
      }

      // Update user post count
      await updateUser(userId, { total_posts: (dbUser as any).total_posts + 1 })

      router.push("/")
    } catch (err: any) {
      console.error("Submit error:", err)
      setSubmitError(err.message || "Failed to submit. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin" size={32} style={{ color: COLORS.primary }} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-2">Create Post</h1>
      <p className="text-sm mb-6" style={{ color: COLORS.textSecondary }}>
        Share your Kohli edits with the community
      </p>

      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => { setMode("url"); setSelectedFile(null); setUploadPreview(null); setError("") }}
          className={`flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
            mode === "url" ? "bg-[#E0301E] text-white" : "bg-[#2A2A2A] text-[#A0A0A0]"
          }`}
        >
          <Link2 size={18} />
          Add Link
        </button>
        <button
          type="button"
          onClick={() => { setMode("upload"); setUrl(""); setPreview(null); setError("") }}
          className={`flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
            mode === "upload" ? "bg-[#E0301E] text-white" : "bg-[#2A2A2A] text-[#A0A0A0]"
          }`}
        >
          <CloudUpload size={18} />
          Upload
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {mode === "url" && (
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Video Link (YouTube/Instagram)
            </label>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2" size={20} style={{ color: COLORS.textSecondary }} />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste YouTube or Instagram URL..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border bg-[#1A1A1A] text-white placeholder-neutral-500 focus:outline-none focus:border-[#E0301E]"
                style={{ borderColor: COLORS.border }}
              />
            </div>
            
            {checkingDuplicate && <p className="text-xs mt-2" style={{ color: COLORS.textSecondary }}>Checking...</p>}
            
            {duplicatePost && (
              <div className="mt-2 p-3 rounded-lg border border-yellow-500/50 bg-yellow-500/10">
                <p className="text-sm text-yellow-500">Already submitted!</p>
                <a href={`/post/${duplicatePost.id}`} className="text-sm text-[#E0301E] hover:underline">
                  View: {duplicatePost.title}
                </a>
              </div>
            )}
            
            {error && (
              <div className="flex items-center gap-2 mt-2 text-sm" style={{ color: COLORS.primary }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {preview && (
              <div className="mt-4 rounded-xl overflow-hidden border" style={{ borderColor: COLORS.border }}>
                <div className="aspect-video bg-black">
                  <img src={preview.thumbnail} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div className="p-3" style={{ backgroundColor: COLORS.card }}>
                  <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: COLORS.muted, color: COLORS.textSecondary }}>
                    {preview.platform === "youtube" ? "YouTube" : "Instagram"}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {mode === "upload" && (
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Upload Image or Video
            </label>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm"
              className="hidden"
            />
            
            {!selectedFile ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors hover:border-[#E0301E]"
                style={{ borderColor: COLORS.border }}
              >
                <CloudUpload size={48} className="mx-auto mb-4" style={{ color: COLORS.textSecondary }} />
                <p className="text-white mb-2">Click to upload image or video</p>
                <p className="text-sm" style={{ color: COLORS.textSecondary }}>JPEG, PNG, GIF, WebP, MP4, WebM (max 50MB)</p>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden border" style={{ borderColor: COLORS.border }}>
                {selectedFile.type.startsWith("video") ? (
                  <video src={uploadPreview || ""} className="w-full aspect-video object-contain bg-black" controls />
                ) : (
                  <img src={uploadPreview || ""} alt="Preview" className="w-full aspect-square object-contain bg-black" />
                )}
                <button
                  type="button"
                  onClick={() => { setSelectedFile(null); setUploadPreview(null) }}
                  className="absolute top-2 right-2 p-2 rounded-full bg-black/70 text-white"
                >
                  <X size={20} />
                </button>
              </div>
            )}
            
            {error && (
              <div className="flex items-center gap-2 mt-2 text-sm" style={{ color: COLORS.primary }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-white mb-2">Caption</label>
          <textarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Write a caption..."
            rows={3}
            className="w-full px-4 py-3 rounded-lg border bg-[#1A1A1A] text-white placeholder-neutral-500 resize-none focus:outline-none focus:border-[#E0301E]"
            style={{ borderColor: COLORS.border }}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">Tags (max 5)</label>
          
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedTags.map(tag => (
                <span key={tag} className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#E0301E] text-white text-sm">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)}><X size={14} /></button>
                </span>
              ))}
            </div>
          )}
          
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
          
          <div className="flex gap-2">
            <input
              type="text"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomTag())}
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

        {submitError && (
          <div className="p-3 rounded-lg" style={{ backgroundColor: COLORS.primary + "20", color: COLORS.primary }}>
            {submitError}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || (mode === "url" ? !url || !!duplicatePost : !selectedFile) || !title}
          className="w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 bg-[#E0301E] text-white"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              {uploading ? "Uploading..." : "Posting..."}
            </>
          ) : (
            <>
              {mode === "upload" ? <Upload size={20} /> : <Link2 size={20} />}
              Post
            </>
          )}
        </button>
      </form>
    </div>
  )
}

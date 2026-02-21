"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { db, auth } from "@/lib/firebase"
import { collection, query, where, getDocs, orderBy, doc, getDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { Post } from "@/lib/types"
import { COLORS } from "@/lib/constants"
import VideoCard from "@/components/VideoCard"
import { Bookmark, Loader2 } from "lucide-react"

export default function SavedPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(auth.currentUser)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/")
        return
      }
      setUser(user)
      await loadSavedPosts(user.uid)
    })
    return () => unsubscribe()
  }, [router])

  const loadSavedPosts = async (userId: string) => {
    setLoading(true)
    try {
      const savedQuery = query(
        collection(db, "saves"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      )
      const savedSnap = await getDocs(savedQuery)
      
      const postsPromises = savedSnap.docs.map(async (saveDoc) => {
        const postId = saveDoc.data().postId
        const postDoc = await getDoc(doc(db, "posts", postId))
        if (postDoc.exists()) {
          const data = postDoc.data()
          return {
            id: postDoc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
          } as Post
        }
        return null
      })

      const posts = (await Promise.all(postsPromises)).filter(Boolean) as Post[]
      setPosts(posts)
    } catch (error) {
      console.error("Error loading saved posts:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin" size={32} style={{ color: COLORS.primary }} />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Bookmark size={28} style={{ color: COLORS.primary }} />
        <h1 className="text-2xl font-bold text-white">Saved Edits</h1>
      </div>

      {posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post) => (
            <VideoCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 rounded-xl border border-[#2A2A2A] bg-[#1A1A1A]">
          <Bookmark size={64} className="mx-auto mb-4 text-[#A0A0A0]" />
          <h3 className="text-xl font-semibold text-white mb-2">No saved edits yet</h3>
          <p className="text-[#A0A0A0] mb-4">
            Save edits to watch them later
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 rounded-lg font-medium bg-[#E0301E] text-white"
          >
            Discover Edits
          </button>
        </div>
      )}
    </div>
  )
}

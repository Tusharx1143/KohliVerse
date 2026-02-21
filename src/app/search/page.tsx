"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { db, auth } from "@/lib/firebase"
import { collection, query, where, or, orderBy, limit, getDocs } from "firebase/firestore"
import { Post, User } from "@/lib/types"
import { DEFAULT_TAGS } from "@/lib/types"
import { COLORS } from "@/lib/constants"
import VideoCard from "@/components/VideoCard"
import { Search, Loader2, User as UserIcon } from "lucide-react"
import Link from "next/link"

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQuery = searchParams.get("q") || ""
  
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [results, setResults] = useState<Post[]>([])
  const [users, setUsers] = useState<User[]>([])
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
    const searchTerm = q.toLowerCase().trim()

    try {
      // Search posts by title or tags
      const postsQuery = query(
        collection(db, "posts"),
        or(
          where("title", ">=", searchTerm),
          where("title", "<=", searchTerm + "\uf8ff"),
          where("tags", "array-contains", searchTerm)
        ),
        orderBy("createdAt", "desc"),
        limit(50)
      )
      const postsSnap = await getDocs(postsQuery)
      const posts = postsSnap.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Post
      })
      setResults(posts)

      // Search users by username
      const usersQuery = query(
        collection(db, "users"),
        where("username", ">=", searchTerm),
        where("username", "<=", searchTerm + "\uf8ff"),
        limit(20)
      )
      const usersSnap = await getDocs(usersQuery)
      const foundUsers = usersSnap.docs.map(doc => {
        const data = doc.data()
        return {
          uid: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as User
      })
      setUsers(foundUsers)

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
      {/* Search Input */}
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

      {/* Quick Tags */}
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
          {/* Results Tabs */}
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

          {/* Results */}
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
                    key={user.uid}
                    href={`/profile/${user.uid}`}
                    className="flex flex-col items-center p-4 rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] hover:border-[#E0301E] transition-colors"
                  >
                    <img
                      src={user.avatarUrl || "/default-avatar.png"}
                      alt={user.username}
                      className="w-16 h-16 rounded-full mb-2"
                    />
                    <span className="font-medium text-white text-sm">@{user.username}</span>
                    <span className="text-xs text-[#A0A0A0]">{user.totalPosts} posts</span>
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

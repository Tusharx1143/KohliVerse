"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { useUser } from "@clerk/nextjs"
import { COLORS } from "@/lib/constants"
import { getUserById, createUser } from "@/lib/db-utils"
import { Loader2, User, Mail } from "lucide-react"

export default function SetupPage() {
  const router = useRouter()
  const { userId } = useAuth()
  const { user: clerkUser } = useUser()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!userId) {
      router.push("/")
      return
    }

    const checkUser = async () => {
      const dbUser = await getUserById(userId)
      if (dbUser) {
        router.push("/")
        return
      }
      setLoading(false)
    }
    checkUser()
  }, [userId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !clerkUser) return

    setError("")
    setSaving(true)

    try {
      const username = clerkUser.username || clerkUser.firstName || `user_${userId.slice(0, 8)}`
      const email = clerkUser.emailAddresses[0]?.emailAddress || ""
      const avatarUrl = clerkUser.imageUrl || ""

      await createUser({
        id: userId,
        username,
        email,
        avatar_url: avatarUrl,
      })

      router.push("/")
    } catch (err) {
      console.error("Setup error:", err)
      setError("Something went wrong. Please try again.")
    } finally {
      setSaving(false)
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
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div
          className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: COLORS.muted }}
        >
          {clerkUser?.imageUrl ? (
            <img src={clerkUser.imageUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User size={40} style={{ color: COLORS.textSecondary }} />
          )}
        </div>
        <h1 className="text-2xl font-bold text-white">Welcome to KohliVerse!</h1>
        <p className="mt-2" style={{ color: COLORS.textSecondary }}>
          Your account is ready. Click below to continue!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-white mb-2">Username</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2" size={18} style={{ color: COLORS.textSecondary }} />
            <input
              type="text"
              value={clerkUser?.username || clerkUser?.firstName || ""}
              disabled
              className="w-full pl-10 pr-4 py-3 rounded-lg border bg-neutral-900 text-neutral-400"
              style={{ borderColor: COLORS.border }}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2" size={18} style={{ color: COLORS.textSecondary }} />
            <input
              type="email"
              value={clerkUser?.emailAddresses[0]?.emailAddress || ""}
              disabled
              className="w-full pl-10 pr-4 py-3 rounded-lg border bg-neutral-900 text-neutral-400"
              style={{ borderColor: COLORS.border }}
            />
          </div>
        </div>

        {error && (
          <p className="text-sm p-3 rounded-lg" style={{ backgroundColor: COLORS.primary + "20", color: COLORS.primary }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          style={{ backgroundColor: COLORS.primary, color: "white" }}
        >
          {saving ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Setting up...
            </>
          ) : (
            "Continue to KohliVerse"
          )}
        </button>
      </form>
    </div>
  )
}

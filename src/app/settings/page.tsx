"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { useUser } from "@clerk/nextjs"
import { COLORS } from "@/lib/constants"
import { getUserById, updateUser } from "@/lib/db-utils"
import { Loader2, User, Mail, Camera, Save, ArrowLeft, Link2 } from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
  const router = useRouter()
  const { userId } = useAuth()
  const { user: clerkUser } = useUser()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profileUser, setProfileUser] = useState<any>(null)
  
  const [bio, setBio] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!userId) {
      router.push("/")
      return
    }

    const loadUser = async () => {
      const dbUser = await getUserById(userId)
      const user = dbUser as any
      if (user) {
        setProfileUser(user)
        setBio(user.bio || "")
        setAvatarUrl(user.avatar_url || "")
      } else {
        setProfileUser({
          username: clerkUser?.username || "User",
          email: clerkUser?.emailAddresses[0]?.emailAddress || "",
        })
      }
      setLoading(false)
    }
    loadUser()
  }, [userId, router, clerkUser])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return

    setSaving(true)
    setError("")
    setSuccess("")

    try {
      if (bio !== (profileUser as any)?.bio) {
        await updateUser(userId, { bio: bio.trim() })
      }
      if (avatarUrl !== (profileUser as any)?.avatar_url) {
        await updateUser(userId, { avatar_url: avatarUrl.trim() })
      }
      setSuccess("Profile updated successfully!")
    } catch (err) {
      console.error("Save error:", err)
      setError("Failed to save. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setAvatarUrl(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin" size={32} style={{ color: COLORS.primary }} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href={`/profile/${userId}`}
          className="p-2 rounded-lg hover:bg-neutral-800 transition-colors"
        >
          <ArrowLeft size={20} style={{ color: COLORS.textSecondary }} />
        </Link>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div
              className="w-24 h-24 rounded-full overflow-hidden"
              style={{ backgroundColor: COLORS.muted }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User size={40} style={{ color: COLORS.textSecondary }} />
                </div>
              )}
            </div>
            <label
              htmlFor="avatar-upload"
              className="absolute bottom-0 right-0 p-2 rounded-full cursor-pointer"
              style={{ backgroundColor: COLORS.primary, color: "white" }}
            >
              <Camera size={16} />
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          </div>
          <div>
            <h3 className="font-semibold text-white">Profile Picture</h3>
            <p className="text-sm" style={{ color: COLORS.textSecondary }}>
              Upload a new profile picture
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">Username</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2" size={18} style={{ color: COLORS.textSecondary }} />
            <input
              type="text"
              value={profileUser?.username || ""}
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

        <div>
          <label className="block text-sm font-medium text-white mb-2">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself..."
            rows={3}
            maxLength={150}
            className="w-full px-4 py-3 rounded-lg border bg-transparent text-white placeholder-neutral-500 resize-none"
            style={{ borderColor: COLORS.border }}
          />
          <p className="text-xs mt-1 text-right" style={{ color: COLORS.textSecondary }}>
            {bio.length}/150
          </p>
        </div>

        {success && (
          <p className="text-sm p-3 rounded-lg" style={{ backgroundColor: "#22c55e20", color: "#22c55e" }}>
            {success}
          </p>
        )}
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
              Saving...
            </>
          ) : (
            <>
              <Save size={20} />
              Save Changes
            </>
          )}
        </button>
      </form>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { auth, db } from "@/lib/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { COLORS } from "@/lib/constants"
import { Loader2, User, Mail, Camera, Save, ArrowLeft, Link2 } from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [authUser, setAuthUser] = useState<any>(null)
  
  // Form fields
  const [bio, setBio] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [facebook, setFacebook] = useState("")
  const [instagram, setInstagram] = useState("")
  const [twitter, setTwitter] = useState("")
  
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (!authUser) {
        router.push("/")
        return
      }
      setAuthUser(authUser)

      // Get user data
      const userDoc = await getDoc(doc(db, "users", authUser.uid))
      if (userDoc.exists()) {
        const data = userDoc.data()
        setUser(data)
        setBio(data.bio || "")
        setAvatarUrl(data.avatarUrl || "")
        setFacebook(data.socialLinks?.facebook || "")
        setInstagram(data.socialLinks?.instagram || "")
        setTwitter(data.socialLinks?.twitter || "")
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!authUser) return

    setSaving(true)
    setError("")
    setSuccess("")

    try {
      await updateDoc(doc(db, "users", authUser.uid), {
        bio: bio.trim(),
        avatarUrl: avatarUrl.trim(),
        socialLinks: {
          facebook: facebook.trim(),
          instagram: instagram.trim(),
          twitter: twitter.trim()
        },
        updatedAt: new Date()
      })

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

    // For now, just use the file URL directly (in production, you'd upload to Firebase Storage)
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

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin" size={32} style={{ color: COLORS.primary }} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href={`/profile/${authUser?.uid}`}
          className="p-2 rounded-lg hover:bg-neutral-800 transition-colors"
        >
          <ArrowLeft size={20} style={{ color: COLORS.textSecondary }} />
        </Link>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Profile Picture */}
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

        {/* Username (read-only) */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">Username</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2" size={18} style={{ color: COLORS.textSecondary }} />
            <input
              type="text"
              value={user.username || ""}
              disabled
              className="w-full pl-10 pr-4 py-3 rounded-lg border bg-neutral-900 text-neutral-400"
              style={{ borderColor: COLORS.border }}
            />
          </div>
          <p className="text-xs mt-1" style={{ color: COLORS.textSecondary }}>
            Username cannot be changed
          </p>
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2" size={18} style={{ color: COLORS.textSecondary }} />
            <input
              type="email"
              value={user.email || ""}
              disabled
              className="w-full pl-10 pr-4 py-3 rounded-lg border bg-neutral-900 text-neutral-400"
              style={{ borderColor: COLORS.border }}
            />
          </div>
        </div>

        {/* Bio */}
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

        {/* Social Links */}
        <div>
          <h3 className="font-semibold text-white mb-4">Social Links</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-white mb-1">Facebook</label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2" size={18} style={{ color: COLORS.textSecondary }} />
                <input
                  type="url"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  placeholder="https://facebook.com/yourname"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border bg-transparent text-white placeholder-neutral-500"
                  style={{ borderColor: COLORS.border }}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-white mb-1">Instagram</label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2" size={18} style={{ color: COLORS.textSecondary }} />
                <input
                  type="url"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="https://instagram.com/yourname"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border bg-transparent text-white placeholder-neutral-500"
                  style={{ borderColor: COLORS.border }}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-white mb-1">Twitter/X</label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2" size={18} style={{ color: COLORS.textSecondary }} />
                <input
                  type="url"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="https://x.com/yourname"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border bg-transparent text-white placeholder-neutral-500"
                  style={{ borderColor: COLORS.border }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
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

        {/* Save Button */}
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

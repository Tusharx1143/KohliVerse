"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { auth, db } from "@/lib/firebase"
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { COLORS } from "@/lib/constants"
import { Loader2, Camera, User, Mail } from "lucide-react"

export default function SetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState(auth.currentUser)
  const [username, setUsername] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [error, setError] = useState("")
  const [checkingUsername, setCheckingUsername] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/")
        return
      }
      setUser(user)
      setAvatarUrl(user.photoURL || "")

      // Check if user already has username
      const userDoc = await getDoc(doc(db, "users", user.uid))
      if (userDoc.exists() && userDoc.data().username) {
        router.push("/")
        return
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [router])

  const checkUsernameAvailability = async (username: string) => {
    if (username.length < 3) return false
    const usersRef = doc(db, "usernames", username.toLowerCase())
    const snap = await getDoc(usersRef)
    return !snap.exists()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setError("")
    setSaving(true)

    try {
      // Validate username
      const trimmedUsername = username.trim()
      if (trimmedUsername.length < 3) {
        setError("Username must be at least 3 characters")
        setSaving(false)
        return
      }

      if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
        setError("Username can only contain letters, numbers, and underscores")
        setSaving(false)
        return
      }

      // Check availability
      const available = await checkUsernameAvailability(trimmedUsername)
      if (!available) {
        setError("Username is already taken")
        setSaving(false)
        return
      }

      // Reserve username
      await setDoc(doc(db, "usernames", trimmedUsername.toLowerCase()), {
        uid: user.uid,
        createdAt: new Date()
      })

      // Store username-email mapping for login
      await setDoc(doc(db, "usernameEmails", trimmedUsername.toLowerCase()), {
        email: user.email || "",
        uid: user.uid,
        createdAt: new Date()
      })

      // Create/update user document
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        username: trimmedUsername,
        email: user.email || "",
        avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${trimmedUsername}`,
        bio: "",
        createdAt: new Date(),
        totalVotesReceived: 0,
        totalPosts: 0,
        isSetupComplete: true,
        role: "user"
      }, { merge: true })

      router.push("/")
    } catch (err) {
      console.error("Setup error:", err)
      setError("Something went wrong. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleUsernameChange = async (value: string) => {
    setUsername(value)
    if (value.length >= 3) {
      setCheckingUsername(true)
      const available = await checkUsernameAvailability(value)
      setCheckingUsername(false)
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
          className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
          style={{ backgroundColor: COLORS.muted }}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="Profile" className="w-full h-full rounded-full object-cover" />
          ) : (
            <User size={40} style={{ color: COLORS.textSecondary }} />
          )}
        </div>
        <h1 className="text-2xl font-bold text-white">Welcome! Let's set up your profile</h1>
        <p className="mt-2" style={{ color: COLORS.textSecondary }}>
          Choose a unique username - you can only do this once!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-white mb-2">Username</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2" size={18} style={{ color: COLORS.textSecondary }} />
            <input
              type="text"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value.replace(/\s/g, "_"))}
              placeholder="cool_kohli_fan"
              className="w-full pl-10 pr-4 py-3 rounded-lg border bg-transparent text-white placeholder-neutral-500"
              style={{ borderColor: COLORS.border }}
              required
              minLength={3}
            />
          </div>
          {checkingUsername && (
            <p className="text-xs mt-1" style={{ color: COLORS.textSecondary }}>Checking availability...</p>
          )}
          {!checkingUsername && username.length >= 3 && (
            <p className="text-xs mt-1" style={{ color: COLORS.primary }}>Username available!</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">Email (verified)</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2" size={18} style={{ color: COLORS.textSecondary }} />
            <input
              type="email"
              value={user?.email || ""}
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
          disabled={saving || username.length < 3}
          className="w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          style={{ backgroundColor: COLORS.primary, color: "white" }}
        >
          {saving ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Setting up...
            </>
          ) : (
            "Complete Setup"
          )}
        </button>

        <p className="text-xs text-center" style={{ color: COLORS.textSecondary }}>
          Your username cannot be changed later. Choose wisely!
        </p>
      </form>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { User, LogOut, Plus, Trophy, Home, X, Mail, Lock } from "lucide-react"
import { auth, googleProvider } from "@/lib/firebase"
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth"
import { COLORS, APP_NAME } from "@/lib/constants"
import { cn } from "@/lib/utils"

export default function Navbar() {
  const pathname = usePathname()
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [showLogin, setShowLogin] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider)
      setShowLogin(false)
    } catch (error: unknown) {
      console.error("Google login error:", error)
      const err = error as { code?: string; message?: string }
      setError(err.message || "Google login failed")
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address")
      setSubmitting(false)
      return
    }

    // Validate password
    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setSubmitting(false)
      return
    }

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password)
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
      setShowLogin(false)
      setEmail("")
      setPassword("")
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string }
      setError(err.message || "Authentication failed")
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const navLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  ]

  return (
    <>
      <nav className="sticky top-0 z-50 border-b" style={{ borderColor: COLORS.border, backgroundColor: COLORS.dark }}>
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white"
              style={{ backgroundColor: COLORS.primary }}
            >
              KV
            </div>
            <span className="font-bold text-xl" style={{ color: COLORS.primary }}>
              {APP_NAME}
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg transition-colors",
                    isActive ? "bg-opacity-20" : "hover:bg-opacity-10"
                  )}
                  style={{
                    backgroundColor: isActive ? COLORS.primary + "20" : "transparent",
                    color: isActive ? COLORS.primary : COLORS.textSecondary
                  }}
                >
                  <Icon size={18} />
                  <span className="hidden sm:inline">{link.label}</span>
                </Link>
              )
            })}

            {user && (
              <Link
                href="/submit"
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors"
                style={{ backgroundColor: COLORS.primary, color: "white" }}
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Submit</span>
              </Link>
            )}

            {loading ? (
              <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-neutral-800 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  href={`/profile/${user.uid}`}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 transition-colors"
                  style={{ borderColor: COLORS.primary }}
                >
                  <img
                    src={user.photoURL || "/default-avatar.png"}
                    alt={user.displayName || "User"}
                    className="w-full h-full object-cover"
                  />
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg hover:bg-neutral-800 transition-colors"
                  style={{ color: COLORS.textSecondary }}
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors"
                style={{ backgroundColor: COLORS.primary, color: "white" }}
              >
                <User size={18} />
                <span className="hidden sm:inline">Login</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div
            className="w-full max-w-md rounded-xl border p-6"
            style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {isSignUp ? "Create Account" : "Welcome Back"}
              </h2>
              <button
                onClick={() => setShowLogin(false)}
                className="p-1 rounded-lg hover:bg-neutral-800"
                style={{ color: COLORS.textSecondary }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4 mb-4">
              <div>
                <label className="block text-sm text-white mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2" size={18} style={{ color: COLORS.textSecondary }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border bg-transparent text-white"
                    style={{ borderColor: COLORS.border }}
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-white mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2" size={18} style={{ color: COLORS.textSecondary }} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border bg-transparent text-white"
                    style={{ borderColor: COLORS.border }}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm" style={{ color: COLORS.primary }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                style={{ backgroundColor: COLORS.primary, color: "white" }}
              >
                {submitting ? "Please wait..." : isSignUp ? "Sign Up" : "Login"}
              </button>
            </form>

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: COLORS.border }}></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2" style={{ backgroundColor: COLORS.card, color: COLORS.textSecondary }}>or</span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="w-full py-2 rounded-lg font-medium border transition-colors flex items-center justify-center gap-2"
              style={{ borderColor: COLORS.border, color: "white" }}
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
              Continue with Google
            </button>

            <p className="text-center mt-4 text-sm" style={{ color: COLORS.textSecondary }}>
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                onClick={() => { setIsSignUp(!isSignUp); setError("") }}
                className="font-medium"
                style={{ color: COLORS.primary }}
              >
                {isSignUp ? "Login" : "Sign Up"}
              </button>
            </p>
          </div>
        </div>
      )}
    </>
  )
}

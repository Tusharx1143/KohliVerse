"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { User, LogOut, Plus, Trophy, Home, X, Mail, Lock, Search, Bell, Bookmark, Settings, Shield } from "lucide-react"
import { auth, googleProvider, db } from "@/lib/firebase"
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { collection, query, where, getCountFromServer } from "firebase/firestore"

const APP_NAME = "KohliVerse"

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [userRole, setUserRole] = useState<string>("user")
  const [loading, setLoading] = useState(true)
  const [showLogin, setShowLogin] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  
  // Search
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const searchRef = useRef<HTMLDivElement>(null)
  
  // Notifications
  const [notificationCount, setNotificationCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid))
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role || "user")
        }
        
        // Get unread notifications count
        const notifQuery = query(
          collection(db, "notifications", user.uid, "userNotifications"),
          where("read", "==", false)
        )
        const notifSnap = await getCountFromServer(notifQuery)
        setNotificationCount(notifSnap.data().count)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearch(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/

    // Determine if input is email or username
    const isEmail = emailRegex.test(email)
    const isUsername = usernameRegex.test(email)
    
    if (!isEmail && !isUsername) {
      setError("Please enter a valid email or username")
      setSubmitting(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setSubmitting(false)
      return
    }

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password)
      } else {
        // For login, we need to use Firebase Auth with email
        // If user entered username, we need to look up their email first
        if (isUsername && !email.includes("@")) {
          const usernameDoc = await getDoc(doc(db, "usernameEmails", email.toLowerCase()))
          if (usernameDoc.exists()) {
            await signInWithEmailAndPassword(auth, usernameDoc.data().email, password)
          } else {
            setError("Username not found")
            setSubmitting(false)
            return
          }
        } else {
          await signInWithEmailAndPassword(auth, email, password)
        }
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
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setShowSearch(false)
      setSearchQuery("")
    }
  }

  const navLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  ]

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-[#2A2A2A] bg-[#0D0D0D]">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white bg-[#E0301E]">
              KV
            </div>
            <span className="font-bold text-xl text-[#E0301E] hidden sm:block">
              {APP_NAME}
            </span>
          </Link>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-xs mx-4" ref={searchRef}>
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0A0]" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSearch(true)}
                  placeholder="Search..."
                  className="w-full pl-9 pr-4 py-1.5 text-sm rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] text-white placeholder-neutral-500 focus:outline-none focus:border-[#E0301E]"
                />
              </div>
            </form>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-1 px-2 py-2 rounded-lg transition-colors",
                    isActive ? "bg-[#E0301E]/20" : "hover:bg-[#E0301E]/10"
                  )}
                  style={{ color: isActive ? "#E0301E" : "#A0A0A0" }}
                >
                  <Icon size={18} />
                  <span className="hidden sm:inline text-sm">{link.label}</span>
                </Link>
              )
            })}

            {user && (
              <Link
                href="/submit"
                className="flex items-center gap-1 px-2 sm:px-3 py-2 rounded-lg font-medium transition-colors bg-[#E0301E] text-white"
              >
                <Plus size={18} />
                <span className="hidden sm:inline text-sm">Submit</span>
              </Link>
            )}

            {loading ? (
              <div className="w-8 h-8 rounded-full bg-neutral-800 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-1">
                {/* Saved */}
                <Link
                  href="/saved"
                  className="p-2 rounded-lg hover:bg-[#E0301E]/10 text-[#A0A0A0]"
                  title="Saved"
                >
                  <Bookmark size={18} />
                </Link>
                
                {/* Notifications */}
                <Link
                  href="/notifications"
                  className="p-2 rounded-lg hover:bg-[#E0301E]/10 text-[#A0A0A0] relative"
                  title="Notifications"
                >
                  <Bell size={18} />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#E0301E] text-white text-xs rounded-full flex items-center justify-center">
                      {notificationCount > 9 ? "9+" : notificationCount}
                    </span>
                  )}
                </Link>

                {/* Profile dropdown */}
                <div className="relative group">
                  <Link
                    href={`/profile/${user.uid}`}
                    className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#E0301E]"
                  >
                    <img
                      src={user.photoURL || "/default-avatar.png"}
                      alt={user.displayName || "User"}
                      className="w-full h-full object-cover"
                    />
                  </Link>
                  
                  {/* Dropdown menu */}
                  <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <div className="p-2">
                      <Link
                        href={`/profile/${user.uid}`}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#2A2A2A] text-white text-sm"
                      >
                        <User size={16} />
                        Profile
                      </Link>
                      <Link
                        href="/saved"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#2A2A2A] text-white text-sm"
                      >
                        <Bookmark size={16} />
                        Saved
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#2A2A2A] text-white text-sm"
                      >
                        <Settings size={16} />
                        Settings
                      </Link>
                      {userRole === "admin" && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#2A2A2A] text-[#E0301E] text-sm"
                        >
                          <Shield size={16} />
                          Admin
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#2A2A2A] text-[#E0301E] text-sm"
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors bg-[#E0301E] text-white"
              >
                <User size={18} />
                <span className="hidden sm:inline text-sm">Login</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-md rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {isSignUp ? "Create Account" : "Welcome Back"}
              </h2>
              <button
                onClick={() => setShowLogin(false)}
                className="p-1 rounded-lg hover:bg-neutral-800 text-[#A0A0A0]"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4 mb-4">
              <div>
                <label className="block text-sm text-white mb-1">
                  {isSignUp ? "Email" : "Email or Username"}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0A0]" size={18} />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#2A2A2A] bg-transparent text-white placeholder-neutral-500"
                    placeholder={isSignUp ? "your@email.com" : "email or username"}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-white mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0A0]" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#2A2A2A] bg-transparent text-white placeholder-neutral-500"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-[#E0301E]">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2 rounded-lg font-medium transition-colors disabled:opacity-50 bg-[#E0301E] text-white"
              >
                {submitting ? "Please wait..." : isSignUp ? "Sign Up" : "Login"}
              </button>
            </form>

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#2A2A2A]"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-[#1A1A1A] text-[#A0A0A0]">or</span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="w-full py-2 rounded-lg font-medium border border-[#2A2A2A] transition-colors flex items-center justify-center gap-2 text-white"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
              Continue with Google
            </button>

            <p className="text-center mt-4 text-sm text-[#A0A0A0]">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                onClick={() => { setIsSignUp(!isSignUp); setError("") }}
                className="font-medium text-[#E0301E]"
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

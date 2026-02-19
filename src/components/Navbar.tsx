"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { User, LogOut, Plus, Trophy, Home } from "lucide-react"
import { auth, googleProvider } from "@/lib/firebase"
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth"
import { COLORS, APP_NAME } from "@/lib/constants"
import { cn } from "@/lib/utils"

export default function Navbar() {
  const pathname = usePathname()
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (error) {
      console.error("Login error:", error)
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
                  isActive
                    ? "bg-opacity-20"
                    : "hover:bg-opacity-10"
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
              onClick={handleLogin}
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
  )
}

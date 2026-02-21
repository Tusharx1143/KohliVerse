"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { User, LogOut, Plus, Trophy, Home, Search, Bell, Bookmark, Settings, Shield } from "lucide-react"
import { SignInButton, SignUpButton, UserButton, useUser, useAuth } from "@clerk/nextjs"
import { cn } from "@/lib/utils"

const APP_NAME = "KohliVerse"

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { userId } = useAuth()
  const { user } = useUser()
  const [notificationCount, setNotificationCount] = useState(0)
  
  // Search
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const searchRef = useRef<HTMLDivElement>(null)

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

            {userId && (
              <Link
                href="/submit"
                className="flex items-center gap-1 px-2 sm:px-3 py-2 rounded-lg font-medium transition-colors bg-[#E0301E] text-white"
              >
                <Plus size={18} />
                <span className="hidden sm:inline text-sm">Submit</span>
              </Link>
            )}

            {userId ? (
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

                {/* Profile */}
                <Link
                  href={`/profile/${userId}`}
                  className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#E0301E]"
                >
                  <img
                    src={user?.imageUrl || "/default-avatar.png"}
                    alt={user?.username || "User"}
                    className="w-full h-full object-cover"
                  />
                </Link>

                <UserButton afterSignOutUrl="/" />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <SignInButton mode="modal">
                  <button className="px-3 py-2 rounded-lg text-sm text-[#A0A0A0] hover:text-white transition-colors">
                    Login
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors bg-[#E0301E] text-white">
                    Sign Up
                  </button>
                </SignUpButton>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  )
}

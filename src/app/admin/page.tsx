"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { COLORS } from "@/lib/constants"
import { getUserById, deletePost as dbDeletePost, getPostById } from "@/lib/db-utils"
import { Shield, Loader2, AlertTriangle, Trash2, Ban, X } from "lucide-react"

export default function AdminPage() {
  const router = useRouter()
  const { userId } = useAuth()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!userId) {
      router.push("/")
      return
    }

    const checkAdmin = async () => {
      try {
        const dbUser = await getUserById(userId)
        const user = dbUser as any
        if (user?.role === "admin") {
          setIsAdmin(true)
        } else {
          router.push("/")
        }
      } catch (error) {
        console.error("Error checking admin:", error)
        router.push("/")
      } finally {
        setLoading(false)
      }
    }
    checkAdmin()
  }, [userId, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin" size={32} style={{ color: COLORS.primary }} />
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield size={32} style={{ color: COLORS.primary }} />
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
      </div>

      <div className="text-center py-12">
        <Shield size={64} className="mx-auto mb-4 text-[#A0A0A0]" />
        <h2 className="text-xl font-bold text-white mb-2">Admin Panel</h2>
        <p className="text-[#A0A0A0]">
          Admin features coming soon. Reports and user management will be available here.
        </p>
      </div>
    </div>
  )
}

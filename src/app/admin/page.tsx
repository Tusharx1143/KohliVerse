"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { db, auth } from "@/lib/firebase"
import { collection, query, orderBy, limit, getDocs, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { Report, Post, User } from "@/lib/types"
import { COLORS } from "@/lib/constants"
import { timeAgo } from "@/lib/utils"
import { Shield, Loader2, AlertTriangle, Trash2, Ban, Check, X, Eye } from "lucide-react"
import Link from "next/link"

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(auth.currentUser)
  const [isAdmin, setIsAdmin] = useState(false)
  const [reports, setReports] = useState<Report[]>([])
  const [activeTab, setActiveTab] = useState<"reports" | "users">("reports")
  const [users, setUsers] = useState<User[]>([])
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/")
        return
      }
      setUser(user)
      
      const userDoc = await getDoc(doc(db, "users", user.uid))
      if (userDoc.exists() && userDoc.data().role === "admin") {
        setIsAdmin(true)
        loadReports()
        loadUsers()
      } else {
        router.push("/")
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [router])

  const loadReports = async () => {
    try {
      const reportsQuery = query(
        collection(db, "reports"),
        orderBy("createdAt", "desc"),
        limit(50)
      )
      const snapshot = await getDocs(reportsQuery)
      const reportsData = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Report
      })
      setReports(reportsData)
    } catch (error) {
      console.error("Error loading reports:", error)
    }
  }

  const loadUsers = async () => {
    try {
      const usersQuery = query(
        collection(db, "users"),
        orderBy("createdAt", "desc"),
        limit(50)
      )
      const snapshot = await getDocs(usersQuery)
      const usersData = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          uid: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as User
      })
      setUsers(usersData)
    } catch (error) {
      console.error("Error loading users:", error)
    }
  }

  const viewReport = async (report: Report) => {
    setSelectedReport(report)
    const postDoc = await getDoc(doc(db, "posts", report.postId))
    if (postDoc.exists()) {
      const data = postDoc.data()
      setSelectedPost({
        id: postDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Post)
    }
  }

  const deletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return
    try {
      await deleteDoc(doc(db, "posts", postId))
      await updateDoc(doc(db, "reports", selectedReport!.id), {
        status: "resolved"
      })
      setSelectedReport(null)
      setSelectedPost(null)
      loadReports()
      alert("Post deleted successfully")
    } catch (error) {
      console.error("Error deleting post:", error)
      alert("Failed to delete post")
    }
  }

  const dismissReport = async (reportId: string) => {
    try {
      await updateDoc(doc(db, "reports", reportId), {
        status: "reviewed"
      })
      loadReports()
    } catch (error) {
      console.error("Error dismissing report:", error)
    }
  }

  const banUser = async (userId: string) => {
    if (!confirm("Are you sure you want to ban this user?")) return
    try {
      await updateDoc(doc(db, "users", userId), {
        role: "banned"
      })
      loadUsers()
      alert("User banned successfully")
    } catch (error) {
      console.error("Error banning user:", error)
      alert("Failed to ban user")
    }
  }

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

  const pendingReports = reports.filter(r => r.status === "pending")

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield size={32} style={{ color: COLORS.primary }} />
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-[#2A2A2A]">
        <button
          onClick={() => setActiveTab("reports")}
          className={`pb-2 px-1 text-sm font-medium transition-colors ${
            activeTab === "reports" 
              ? "text-[#E0301E] border-b-2 border-[#E0301E]" 
              : "text-[#A0A0A0]"
          }`}
        >
          Reports ({pendingReports.length})
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

      {activeTab === "reports" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reports List */}
          <div className="space-y-3">
            {reports.length > 0 ? (
              reports.map(report => (
                <div
                  key={report.id}
                  onClick={() => viewReport(report)}
                  className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                    selectedReport?.id === report.id
                      ? "border-[#E0301E] bg-[#E0301E]/10"
                      : "border-[#2A2A2A] bg-[#1A1A1A] hover:border-[#E0301E]/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={20} style={{ color: COLORS.primary }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium capitalize">{report.reason}</p>
                      <p className="text-xs text-[#A0A0A0] mt-1">
                        {timeAgo(report.createdAt)} • {report.status}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      report.status === "pending" 
                        ? "bg-yellow-500/20 text-yellow-500"
                        : report.status === "reviewed"
                        ? "bg-blue-500/20 text-blue-500"
                        : "bg-green-500/20 text-green-500"
                    }`}>
                      {report.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-[#A0A0A0]">
                No reports yet
              </div>
            )}
          </div>

          {/* Report Details */}
          <div className="border border-[#2A2A2A] rounded-xl bg-[#1A1A1A] p-4">
            {selectedReport && selectedPost ? (
              <>
                <h3 className="font-bold text-white mb-4">Reported Post</h3>
                <div className="mb-4">
                  <img
                    src={selectedPost.thumbnailUrl}
                    alt={selectedPost.title}
                    className="w-full aspect-video object-cover rounded-lg"
                  />
                </div>
                <h4 className="font-medium text-white mb-2">{selectedPost.title}</h4>
                <p className="text-sm text-[#A0A0A0] mb-4">
                  Reported for: <span className="capitalize text-[#E0301E]">{selectedReport.reason}</span>
                </p>
                {selectedReport.description && (
                  <p className="text-sm text-[#A0A0A0] mb-4 p-3 rounded bg-[#2A2A2A]">
                    "{selectedReport.description}"
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => deletePost(selectedPost.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm"
                  >
                    <Trash2 size={16} />
                    Delete Post
                  </button>
                  <button
                    onClick={() => dismissReport(selectedReport.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2A2A2A] text-white text-sm"
                  >
                    <X size={16} />
                    Dismiss
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-[#A0A0A0]">
                Select a report to view details
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map(user => (
            <div
              key={user.uid}
              className="flex items-center gap-4 p-4 rounded-xl border border-[#2A2A2A] bg-[#1A1A1A]"
            >
              <img
                src={user.avatarUrl || "/default-avatar.png"}
                alt={user.username}
                className="w-12 h-12 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white">@{user.username}</p>
                <p className="text-sm text-[#A0A0A0]">{user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs ${
                  (user.role || "user") === "admin" 
                    ? "bg-[#E0301E]/20 text-[#E0301E]"
                    : (user.role || "user") === "banned"
                    ? "bg-red-500/20 text-red-500"
                    : "bg-[#2A2A2A] text-[#A0A0A0]"
                }`}>
                  {user.role || "user"}
                </span>
                {(user.role || "user") !== "admin" && (user.role || "user") !== "banned" && (
                  <button
                    onClick={() => banUser(user.uid)}
                    className="p-2 rounded-lg hover:bg-red-600/20 text-red-500"
                  >
                    <Ban size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

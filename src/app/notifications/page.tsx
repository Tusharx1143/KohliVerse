"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { COLORS } from "@/lib/constants"
import { getNotifications, markNotificationRead } from "@/lib/db-utils"
import { timeAgo } from "@/lib/utils"
import { Bell, Loader2, Heart, MessageCircle, UserPlus, Check } from "lucide-react"
import Link from "next/link"

export default function NotificationsPage() {
  const router = useRouter()
  const { userId } = useAuth()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      router.push("/")
      return
    }
    loadNotifications()
  }, [userId, router])

  const loadNotifications = async () => {
    try {
      const notifs = await getNotifications(userId!)
      setNotifications(notifs.map((n: any) => ({
        id: n.id,
        type: n.type,
        fromUserId: n.from_user_id,
        fromUsername: n.from_username,
        fromUserAvatar: n.from_user_avatar,
        postId: n.post_id,
        read: n.read,
        createdAt: new Date(n.created_at),
      })))
    } catch (error) {
      console.error("Error loading notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notifId: number) => {
    try {
      await markNotificationRead(notifId)
      setNotifications(prev => 
        prev.map(n => n.id === notifId ? { ...n, read: true } : n)
      )
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read)
      await Promise.all(unread.map(n => markNotificationRead(n.id)))
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (error) {
      console.error("Error marking all as read:", error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "upvote":
        return <Heart size={16} className="text-[#E0301E]" />
      case "comment":
      case "reply":
        return <MessageCircle size={16} className="text-blue-500" />
      case "follow":
        return <UserPlus size={16} className="text-green-500" />
      default:
        return <Bell size={16} className="text-[#A0A0A0]" />
    }
  }

  const getNotificationText = (type: string) => {
    switch (type) {
      case "upvote":
        return "upvoted your post"
      case "comment":
        return "commented on your post"
      case "reply":
        return "replied to your comment"
      case "follow":
        return "started following you"
      default:
        return "interacted with you"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin" size={32} style={{ color: COLORS.primary }} />
      </div>
    )
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell size={28} style={{ color: COLORS.primary }} />
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-[#E0301E] text-white">
              {unreadCount} new
            </span>
          )}
        </div>
        
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1 text-sm text-[#A0A0A0] hover:text-white"
          >
            <Check size={16} />
            Mark all read
          </button>
        )}
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => markAsRead(notif.id)}
              className={`flex items-start gap-3 p-4 rounded-xl border transition-colors cursor-pointer ${
                notif.read 
                  ? "border-[#2A2A2A] bg-[#1A1A1A]" 
                  : "border-[#E0301E]/30 bg-[#E0301E]/5"
              }`}
            >
              <Link
                href={`/profile/${notif.fromUserId}`}
                onClick={(e) => e.stopPropagation()}
                className="flex-shrink-0"
              >
                <img
                  src={notif.fromUserAvatar || "/default-avatar.png"}
                  alt={notif.fromUsername}
                  className="w-10 h-10 rounded-full"
                />
              </Link>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white">
                  <Link
                    href={`/profile/${notif.fromUserId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-medium text-[#E0301E] hover:underline"
                  >
                    @{notif.fromUsername}
                  </Link>{" "}
                  {getNotificationText(notif.type)}
                </p>
                <p className="text-xs text-[#A0A0A0] mt-1">
                  {timeAgo(notif.createdAt)}
                </p>
              </div>

              <div className="flex-shrink-0">
                {getNotificationIcon(notif.type)}
              </div>

              {notif.postId && (
                <Link
                  href={`/post/${notif.postId}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-shrink-0"
                >
                  <img
                    src={`https://img.youtube.com/vi/${notif.postId}/default.jpg`}
                    alt="Post"
                    className="w-10 h-10 rounded object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </Link>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 rounded-xl border border-[#2A2A2A] bg-[#1A1A1A]">
          <Bell size={64} className="mx-auto mb-4 text-[#A0A0A0]" />
          <h3 className="text-xl font-semibold text-white mb-2">No notifications yet</h3>
          <p className="text-[#A0A0A0]">
            When someone interacts with you, you'll see it here
          </p>
        </div>
      )}
    </div>
  )
}

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M"
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K"
  }
  return num.toString()
}

export function timeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  
  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "week", seconds: 604800 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
  ]
  
  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds)
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`
    }
  }
  
  return "just now"
}

export function calculateHotScore(upvotes: number, downvotes: number, createdAt: Date): number {
  const score = upvotes - downvotes
  const hoursSincePost = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60)
  const gravity = 1.5
  
  return score / Math.pow(hoursSincePost + 2, gravity)
}

export function extractVideoId(url: string): { platform: "youtube" | "instagram" | null; id: string | null } {
  const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  const instagramRegex = /(?:instagram\.com\/(?:p|reel|tv)\/)([a-zA-Z0-9_-]+)/
  
  const youtubeMatch = url.match(youtubeRegex)
  if (youtubeMatch) {
    return { platform: "youtube", id: youtubeMatch[1] }
  }
  
  const instagramMatch = url.match(instagramRegex)
  if (instagramMatch) {
    return { platform: "instagram", id: instagramMatch[1] }
  }
  
  return { platform: null, id: null }
}

export function getEmbedUrl(url: string): string {
  const { platform, id } = extractVideoId(url)
  
  if (platform === "youtube" && id) {
    return `https://www.youtube.com/embed/${id}`
  }
  
  if (platform === "instagram" && id) {
    return `https://www.instagram.com/p/${id}/embed`
  }
  
  return ""
}

export function getThumbnailUrl(url: string): string {
  const { platform, id } = extractVideoId(url)
  
  if (platform === "youtube" && id) {
    return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`
  }
  
  if (platform === "instagram" && id) {
    return `https://www.instagram.com/p/${id}/media/?size=l`
  }
  
  return "/placeholder.jpg"
}

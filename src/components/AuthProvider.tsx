"use client"

import { useAuthSync } from "@/hooks/useAuthSync"

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  useAuthSync()
  return <>{children}</>
}

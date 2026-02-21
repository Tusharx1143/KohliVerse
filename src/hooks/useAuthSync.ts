"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { auth, db } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"

export function useAuthSync() {
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid)
          const userSnap = await getDoc(userRef)
          
          if (!userSnap.exists()) {
            // New user - create basic doc, they'll need to complete setup
            await setDoc(userRef, {
              uid: user.uid,
              username: "",
              email: user.email || "",
              avatarUrl: user.photoURL || "",
              bio: "",
              createdAt: new Date(),
              totalVotesReceived: 0,
              totalPosts: 0,
              isSetupComplete: false,
            })
            
            // Redirect to setup if not already there
            if (pathname !== "/setup") {
              router.push("/setup")
            }
          } else {
            const userData = userSnap.data()
            // If setup not complete and not on setup page, redirect
            if (!userData.isSetupComplete && pathname !== "/setup") {
              router.push("/setup")
            }
          }
        } catch (error) {
          console.error("Error syncing user:", error)
        }
      }
      setChecking(false)
    })

    return () => unsubscribe()
  }, [router, pathname])
}

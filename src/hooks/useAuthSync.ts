"use client"

import { useEffect } from "react"
import { auth, db } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { doc, setDoc, getDoc, updateDoc, increment } from "firebase/firestore"

export function useAuthSync() {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid)
          const userSnap = await getDoc(userRef)
          
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid: user.uid,
              username: user.displayName || "User" + user.uid.slice(0, 6),
              email: user.email || "",
              avatarUrl: user.photoURL || "/default-avatar.png",
              createdAt: new Date(),
              totalVotesReceived: 0,
              totalPosts: 0,
            })
          }
        } catch (error) {
          console.error("Error syncing user:", error)
        }
      }
    })

    return () => unsubscribe()
  }, [])
}

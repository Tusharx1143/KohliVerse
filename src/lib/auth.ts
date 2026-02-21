import { auth, currentUser } from "@clerk/nextjs/server"
import { getUserById, createUser } from "./db-utils"

export async function getAuthUser() {
  const { userId } = await auth()
  if (!userId) return null

  let user = await getUserById(userId)
  
  if (!user) {
    const clerkUser = await currentUser()
    if (clerkUser) {
      user = await createUser({
        id: userId,
        username: clerkUser.username || clerkUser.firstName || `user_${userId.slice(0, 8)}`,
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        avatar_url: clerkUser.imageUrl || ""
      })
    }
  }
  
  return user
}

export async function requireAuth() {
  const { userId } = await auth()
  if (!userId) {
    throw new Error("Unauthorized")
  }
  return userId
}

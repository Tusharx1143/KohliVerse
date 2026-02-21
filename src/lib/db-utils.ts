import { sql } from "./db"

export interface DbUser {
  id: string
  username: string
  email: string
  avatar_url: string
  bio: string
  created_at: Date
  total_votes_received: number
  total_posts: number
  is_setup_complete: boolean
  role: string
  updated_at: Date
}

export interface DbPost {
  id: number
  author_id: string
  author_name: string
  author_avatar: string
  title: string
  tags: string[]
  upvotes: number
  downvotes: number
  comment_count: number
  created_at: Date
  hot_score: number
  video_url?: string
  video_url_hash?: string
  embed_url?: string
  thumbnail_url?: string
  platform?: string
  media_url?: string
  media_type?: string
  post_type?: string
}

export interface DbComment {
  id: number
  post_id: number
  user_id: string
  username: string
  avatar_url: string
  content: string
  created_at: Date
}

export async function getUserById(id: string) {
  const { rows } = await sql<DbUser[]>`SELECT * FROM users WHERE id = ${id}`
  return rows[0] || null
}

export async function getUserByUsername(username: string) {
  const { rows } = await sql<DbUser[]>`SELECT * FROM users WHERE username = ${username}`
  return rows[0] || null
}

export async function createUser(user: { id: string; username: string; email: string; avatar_url?: string }) {
  const { rows } = await sql<DbUser[]>`
    INSERT INTO users (id, username, email, avatar_url)
    VALUES (${user.id}, ${user.username}, ${user.email}, ${user.avatar_url || ''})
    ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username
    RETURNING *
  `
  return rows[0]
}

export async function updateUser(id: string, data: { total_posts?: number; avatar_url?: string; bio?: string; username?: string }) {
  if (data.total_posts !== undefined) {
    const { rows } = await sql<DbUser[]>`UPDATE users SET total_posts = ${data.total_posts} WHERE id = ${id} RETURNING *`
    return rows[0]
  }
  if (data.avatar_url !== undefined) {
    const { rows } = await sql<DbUser[]>`UPDATE users SET avatar_url = ${data.avatar_url} WHERE id = ${id} RETURNING *`
    return rows[0]
  }
  if (data.bio !== undefined) {
    const { rows } = await sql<DbUser[]>`UPDATE users SET bio = ${data.bio} WHERE id = ${id} RETURNING *`
    return rows[0]
  }
  if (data.username !== undefined) {
    const { rows } = await sql<DbUser[]>`UPDATE users SET username = ${data.username} WHERE id = ${id} RETURNING *`
    return rows[0]
  }
  return null
}

export async function createPost(post: {
  author_id: string
  author_name: string
  author_avatar: string
  title: string
  tags?: string[]
  video_url?: string
  video_url_hash?: string
  embed_url?: string
  thumbnail_url?: string
  platform?: string
  media_url?: string
  media_type?: string
  post_type?: string
}) {
  const tagsArray = post.tags ? `'{${post.tags.map(t => `"${t}"`).join(",")}}'` : "'{}'"
  const { rows } = await sql<DbPost[]>`
    INSERT INTO posts (author_id, author_name, author_avatar, title, tags, video_url, video_url_hash, embed_url, thumbnail_url, platform, media_url, media_type, post_type)
    VALUES (
      ${post.author_id},
      ${post.author_name},
      ${post.author_avatar},
      ${post.title},
      ${tagsArray}::jsonb,
      ${post.video_url || null},
      ${post.video_url_hash || null},
      ${post.embed_url || null},
      ${post.thumbnail_url || null},
      ${post.platform || null},
      ${post.media_url || null},
      ${post.media_type || null},
      ${post.post_type || 'embed'}
    )
    RETURNING *
  `
  return rows[0]
}

export async function getPostById(id: number) {
  const { rows } = await sql<DbPost[]>`SELECT * FROM posts WHERE id = ${id}`
  return rows[0] || null
}

export async function getPosts(options?: {
  sort?: "hot" | "new" | "top"
  limit?: number
  offset?: number
  authorId?: string
}) {
  const sort = options?.sort || "hot"
  const limit = options?.limit || 20
  const offset = options?.offset || 0

  if (options?.authorId) {
    const { rows } = await sql<DbPost[]>`
      SELECT * FROM posts 
      WHERE author_id = ${options.authorId}
      ORDER BY ${sort === "new" ? "created_at" : sort === "top" ? "(upvotes - downvotes)" : "hot_score"} DESC
      LIMIT ${limit} OFFSET ${offset}
    `
    return rows
  }

  const { rows } = await sql<DbPost[]>`
    SELECT * FROM posts 
    ORDER BY ${sort === "new" ? "created_at" : sort === "top" ? "(upvotes - downvotes)" : "hot_score"} DESC
    LIMIT ${limit} OFFSET ${offset}
  `
  return rows
}

export async function searchPosts(query: string, limit = 20) {
  const { rows } = await sql<DbPost[]>`
    SELECT * FROM posts 
    WHERE title ILIKE ${'%' + query + '%'}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `
  return rows
}

export async function deletePost(id: number) {
  await sql`DELETE FROM posts WHERE id = ${id}`
}

export async function votePost(postId: number, voteType: "up" | "down") {
  if (voteType === "up") {
    await sql`UPDATE posts SET upvotes = upvotes + 1 WHERE id = ${postId}`
  } else {
    await sql`UPDATE posts SET downvotes = downvotes + 1 WHERE id = ${postId}`
  }
}

export async function unvotePost(postId: number, voteType: "up" | "down") {
  if (voteType === "up") {
    await sql`UPDATE posts SET upvotes = upvotes - 1 WHERE id = ${postId} AND upvotes > 0`
  } else {
    await sql`UPDATE posts SET downvotes = downvotes - 1 WHERE id = ${postId} AND downvotes > 0`
  }
}

export async function createComment(comment: {
  post_id: number
  user_id: string
  username: string
  avatar_url: string
  content: string
}) {
  const { rows } = await sql<DbComment[]>`
    INSERT INTO comments (post_id, user_id, username, avatar_url, content)
    VALUES (${comment.post_id}, ${comment.user_id}, ${comment.username}, ${comment.avatar_url}, ${comment.content})
    RETURNING *
  `
  
  await sql`UPDATE posts SET comment_count = comment_count + 1 WHERE id = ${comment.post_id}`
  
  return rows[0]
}

export async function getComments(postId: number) {
  const { rows } = await sql<DbComment[]>`
    SELECT * FROM comments WHERE post_id = ${postId} ORDER BY created_at DESC
  `
  return rows
}

export async function createSave(userId: string, postId: number) {
  const id = `${userId}_${postId}`
  await sql`
    INSERT INTO saves (id, user_id, post_id) VALUES (${id}, ${userId}, ${postId})
    ON CONFLICT (id) DO NOTHING
  `
}

export async function deleteSave(userId: string, postId: number) {
  const id = `${userId}_${postId}`
  await sql`DELETE FROM saves WHERE id = ${id}`
}

export async function getSavedPosts(userId: string) {
  const { rows } = await sql<{ post_id: number }[]>`
    SELECT post_id FROM saves WHERE user_id = ${userId}
  `
  return rows.map((r: any) => r.post_id)
}

export async function createFollow(followerId: string, followingId: string) {
  const id = `${followerId}_${followingId}`
  await sql`
    INSERT INTO follows (id, follower_id, following_id) VALUES (${id}, ${followerId}, ${followingId})
    ON CONFLICT (id) DO NOTHING
  `
}

export async function deleteFollow(followerId: string, followingId: string) {
  const id = `${followerId}_${followingId}`
  await sql`DELETE FROM follows WHERE id = ${id}`
}

export async function isFollowing(followerId: string, followingId: string) {
  const id = `${followerId}_${followingId}`
  const { rows } = await sql`SELECT id FROM follows WHERE id = ${id}`
  return rows.length > 0
}

export async function createNotification(notification: {
  user_id: string
  type: string
  from_user_id: string
  from_username: string
  from_user_avatar?: string
  post_id?: number
}) {
  await sql`
    INSERT INTO notifications (user_id, type, from_user_id, from_username, from_user_avatar, post_id)
    VALUES (${notification.user_id}, ${notification.type}, ${notification.from_user_id}, ${notification.from_username}, ${notification.from_user_avatar || ''}, ${notification.post_id || null})
  `
}

export async function getNotifications(userId: string) {
  const { rows } = await sql`
    SELECT * FROM notifications WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 50
  `
  return rows
}

export async function markNotificationRead(id: number) {
  await sql`UPDATE notifications SET read = TRUE WHERE id = ${id}`
}

export async function createReport(report: {
  reporter_id: string
  post_id: number
  reason: string
  description?: string
}) {
  await sql`
    INSERT INTO reports (reporter_id, post_id, reason, description)
    VALUES (${report.reporter_id}, ${report.post_id}, ${report.reason}, ${report.description || null})
  `
}

export async function getLeaderboard(limit = 10) {
  const { rows } = await sql<DbUser[]>`
    SELECT * FROM users ORDER BY total_posts DESC LIMIT ${limit}
  `
  return rows
}

export async function checkDuplicateUrl(urlHash: string) {
  const { rows } = await sql<DbPost[]>`
    SELECT id, title FROM posts WHERE video_url_hash = ${urlHash}
  `
  return rows[0] || null
}

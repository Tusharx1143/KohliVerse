import { sql } from "@vercel/postgres"

export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(255) NOT NULL,
      avatar_url TEXT,
      bio TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW(),
      total_votes_received INTEGER DEFAULT 0,
      total_posts INTEGER DEFAULT 0,
      is_setup_complete BOOLEAN DEFAULT FALSE,
      role VARCHAR(20) DEFAULT 'user',
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      author_id VARCHAR(255) NOT NULL,
      author_name VARCHAR(100) NOT NULL,
      author_avatar TEXT,
      title VARCHAR(255) NOT NULL,
      tags TEXT[] DEFAULT '{}',
      upvotes INTEGER DEFAULT 0,
      downvotes INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      hot_score INTEGER DEFAULT 0,
      video_url TEXT,
      video_url_hash VARCHAR(100),
      embed_url TEXT,
      thumbnail_url TEXT,
      platform VARCHAR(20),
      media_url TEXT,
      media_type VARCHAR(20),
      post_type VARCHAR(20) DEFAULT 'embed',
      FOREIGN KEY (author_id) REFERENCES users(id)
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS votes (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      post_id INTEGER NOT NULL,
      vote_type VARCHAR(10) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      post_id INTEGER NOT NULL,
      user_id VARCHAR(255) NOT NULL,
      username VARCHAR(100) NOT NULL,
      avatar_url TEXT,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS follows (
      id VARCHAR(255) PRIMARY KEY,
      follower_id VARCHAR(255) NOT NULL,
      following_id VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(follower_id, following_id)
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS saves (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      post_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, post_id),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS reports (
      id SERIAL PRIMARY KEY,
      reporter_id VARCHAR(255) NOT NULL,
      post_id INTEGER NOT NULL,
      reason VARCHAR(50) NOT NULL,
      description TEXT,
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW(),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      type VARCHAR(20) NOT NULL,
      from_user_id VARCHAR(255) NOT NULL,
      from_username VARCHAR(100) NOT NULL,
      from_user_avatar TEXT,
      post_id INTEGER,
      read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `

  await sql`
    CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC)
  `

  await sql`
    CREATE INDEX IF NOT EXISTS idx_posts_hot_score ON posts(hot_score DESC)
  `

  await sql`
    CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id)
  `

  await sql`
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)
  `

  console.log("Database initialized!")
}

export { sql }

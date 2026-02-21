import { initDb } from "@/lib/db"

export async function GET() {
  try {
    await initDb()
    return Response.json({ success: true, message: "Database initialized!" })
  } catch (error) {
    console.error("Database init error:", error)
    return Response.json({ success: false, error: String(error) }, { status: 500 })
  }
}

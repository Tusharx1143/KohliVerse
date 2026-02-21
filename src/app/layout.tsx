import type { Metadata } from "next"
import "./globals.css"
import Navbar from "@/components/Navbar"
import AuthProvider from "@/components/AuthProvider"

export const metadata: Metadata = {
  title: "KohliVerse - Ranked Community for Virat Kohli Edits",
  description: "Discover, rank, and share the best Virat Kohli edit videos from YouTube and Instagram",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-dark">
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  )
}

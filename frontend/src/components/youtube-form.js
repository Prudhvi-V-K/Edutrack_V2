"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AlertCircle, Youtube } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function YoutubeForm() {
  const [url, setUrl] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = (e) => {
    e.preventDefault()

    // Basic validation for YouTube URL
    if (!url.includes("youtube.com/playlist") && !url.includes("youtube.com/watch")) {
      setError("Please enter a valid YouTube playlist or video URL")
      return
    }

    setError("")
    // Encode the URL and redirect to tutorial page
    const encodedUrl = encodeURIComponent(url)
    router.push(`/tutorial?youtube=${encodedUrl}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-grow">
          <Youtube className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <Input
            type="url"
            placeholder="Paste YouTube playlist URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90">
          Import Course
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Import any YouTube playlist to create your own course with automatic quiz generation
      </p>
    </form>
  )
}


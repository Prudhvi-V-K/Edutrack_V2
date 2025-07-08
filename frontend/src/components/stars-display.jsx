"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { Star } from "lucide-react"

export function StarsDisplay() {
  const { user } = useUser()
  const [stars, setStars] = useState(0)

  useEffect(() => {
    if (user) {
      // Get stars from user metadata
      const userStars = user.unsafeMetadata?.stars || 0
      setStars(userStars)
    }
  }, [user])

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-lg">
      <div className="flex items-center gap-2">
        <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
        <span className="text-xl font-bold">{stars}</span>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
        Total Stars Earned
      </p>
    </div>
  )
} 
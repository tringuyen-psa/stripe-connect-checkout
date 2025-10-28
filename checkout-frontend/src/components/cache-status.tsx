"use client"

import { useState, useEffect } from "react"
import { StripeCache } from "@/lib/stripe-cache"
import { Button } from "@/components/ui/button"

export function CacheStatus() {
  const [stats, setStats] = useState({ total: 0, expired: 0, valid: 0 })
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const updateStats = () => {
      setStats(StripeCache.getCacheStats())
    }

    updateStats()
    const interval = setInterval(updateStats, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  const handleClearCache = () => {
    StripeCache.clearAllCache()
    setStats({ total: 0, expired: 0, valid: 0 })
  }

  const handleClearExpired = () => {
    StripeCache.clearExpiredCache()
    setStats(StripeCache.getCacheStats())
  }

  if (stats.total === 0 && !showDetails) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border rounded-lg shadow-lg p-3 z-50 max-w-xs">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${stats.valid > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span className="text-xs font-medium">Stripe Cache</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="h-6 w-6 p-0"
        >
          <span className="text-xs">{showDetails ? '−' : '+'}</span>
        </Button>
      </div>

      <div className="text-xs text-gray-600">
        <div>Valid: {stats.valid}</div>
        {showDetails && (
          <>
            <div>Expired: {stats.expired}</div>
            <div>Total: {stats.total}</div>
          </>
        )}
      </div>

      {showDetails && (
        <div className="mt-2 pt-2 border-t space-y-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearExpired}
            className="w-full h-7 text-xs"
            disabled={stats.expired === 0}
          >
            Clear Expired ({stats.expired})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearCache}
            className="w-full h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
          >
            Clear All Cache
          </Button>
        </div>
      )}
    </div>
  )
}
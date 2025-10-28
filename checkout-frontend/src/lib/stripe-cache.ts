/**
 * Stripe payment intent caching utilities
 * Prevents automatic Stripe API calls on page refresh
 */

interface CacheEntry {
  clientSecret: string
  timestamp: number
  amount: number
  currency: string
}

export class StripeCache {
  private static readonly CACHE_PREFIX = 'stripe_client_secret_'
  private static readonly CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

  /**
   * Generate a unique cache key based on cart contents
   */
  static generateCacheKey(products: any[], total: number, currency: string = 'usd'): string {
    const cartHash = btoa(JSON.stringify({
      products: products.map(p => ({
        id: p.id,
        price: p.price,
        quantity: p.quantity
      })),
      total,
      currency
    }))

    return `${this.CACHE_PREFIX}${cartHash}`
  }

  /**
   * Get cached clientSecret if valid
   */
  static getCachedClientSecret(cacheKey: string): string | null {
    try {
      const cached = sessionStorage.getItem(cacheKey)
      const timestamp = sessionStorage.getItem(`${cacheKey}_timestamp`)

      if (!cached || !timestamp) {
        return null
      }

      const cacheAge = Date.now() - parseInt(timestamp)

      if (cacheAge > this.CACHE_DURATION) {
        this.removeCacheEntry(cacheKey)
        return null
      }

      console.log('📋 Using cached clientSecret (age:', Math.round(cacheAge / 1000), 'seconds)')
      return cached
    } catch (error) {
      console.error('Error reading from cache:', error)
      return null
    }
  }

  /**
   * Cache a new clientSecret
   */
  static setCachedClientSecret(
    cacheKey: string,
    clientSecret: string,
    amount: number,
    currency: string = 'usd'
  ): void {
    try {
      sessionStorage.setItem(cacheKey, clientSecret)
      sessionStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString())
      sessionStorage.setItem(`${cacheKey}_amount`, amount.toString())
      sessionStorage.setItem(`${cacheKey}_currency`, currency)

      console.log('💾 ClientSecret cached successfully')
    } catch (error) {
      console.error('Error writing to cache:', error)
    }
  }

  /**
   * Remove a specific cache entry
   */
  static removeCacheEntry(cacheKey: string): void {
    try {
      sessionStorage.removeItem(cacheKey)
      sessionStorage.removeItem(`${cacheKey}_timestamp`)
      sessionStorage.removeItem(`${cacheKey}_amount`)
      sessionStorage.removeItem(`${cacheKey}_currency`)
    } catch (error) {
      console.error('Error removing cache entry:', error)
    }
  }

  /**
   * Clear all expired cache entries
   */
  static clearExpiredCache(): void {
    try {
      const keys = Object.keys(sessionStorage)
      let clearedCount = 0

      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX) && !key.includes('_timestamp')) {
          const timestamp = sessionStorage.getItem(`${key}_timestamp`)

          if (timestamp) {
            const cacheAge = Date.now() - parseInt(timestamp)
            if (cacheAge > this.CACHE_DURATION) {
              this.removeCacheEntry(key)
              clearedCount++
            }
          }
        }
      })

      if (clearedCount > 0) {
        console.log(`🧹 Cleared ${clearedCount} expired cache entries`)
      }
    } catch (error) {
      console.error('Error clearing expired cache:', error)
    }
  }

  /**
   * Clear all Stripe cache entries
   */
  static clearAllCache(): void {
    try {
      const keys = Object.keys(sessionStorage)
      let clearedCount = 0

      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          sessionStorage.removeItem(key)
          clearedCount++
        }
      })

      console.log(`🧹 Cleared all Stripe cache entries (${clearedCount} items)`)
    } catch (error) {
      console.error('Error clearing all cache:', error)
    }
  }

  /**
   * Get cache statistics for debugging
   */
  static getCacheStats(): { total: number; expired: number; valid: number } {
    try {
      const keys = Object.keys(sessionStorage)
      let total = 0
      let expired = 0
      let valid = 0

      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX) && !key.includes('_timestamp') && !key.includes('_amount') && !key.includes('_currency')) {
          total++
          const timestamp = sessionStorage.getItem(`${key}_timestamp`)

          if (timestamp) {
            const cacheAge = Date.now() - parseInt(timestamp)
            if (cacheAge > this.CACHE_DURATION) {
              expired++
            } else {
              valid++
            }
          }
        }
      })

      return { total, expired, valid }
    } catch (error) {
      console.error('Error getting cache stats:', error)
      return { total: 0, expired: 0, valid: 0 }
    }
  }
}
import { NextRequest, NextResponse } from 'next/server'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetAt: number
  }
}

const store: RateLimitStore = {}

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach(key => {
    if (store[key].resetAt < now) {
      delete store[key]
    }
  })
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

export function rateLimit(config: RateLimitConfig) {
  return async (req: NextRequest, handler: Function, ...args: any[]) => {
    const clientId = req.headers.get('x-client-id') || 'anonymous'
    const now = Date.now()
    const key = `${clientId}-${Math.floor(now / config.windowMs)}`

    if (!store[key]) {
      store[key] = {
        count: 0,
        resetAt: now + config.windowMs
      }
    }

    store[key].count++

    const remaining = config.maxRequests - store[key].count
    const resetAt = store[key].resetAt

    // Add rate limit headers
    const response = await handler(req, ...args)
    
    if (response instanceof NextResponse) {
      response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
      response.headers.set('X-RateLimit-Remaining', Math.max(0, remaining).toString())
      response.headers.set('X-RateLimit-Reset', Math.floor(resetAt / 1000).toString())
    }

    if (store[key].count > config.maxRequests) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retry_after: Math.ceil((resetAt - now) / 1000)
        }, 
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.floor(resetAt / 1000).toString(),
            'Retry-After': Math.ceil((resetAt - now) / 1000).toString()
          }
        }
      )
    }

    return response
  }
}

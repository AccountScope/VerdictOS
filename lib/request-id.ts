import { NextRequest } from 'next/server'
import crypto from 'crypto'

export function getRequestId(req: NextRequest): string {
  // Check if request already has ID from upstream (load balancer, proxy)
  const existingId = req.headers.get('x-request-id') || req.headers.get('x-correlation-id')
  
  if (existingId) {
    return existingId
  }

  // Generate new ID
  return `req_${crypto.randomBytes(16).toString('hex')}`
}

export function attachRequestId(req: NextRequest): string {
  const requestId = getRequestId(req)
  ;(req as any).requestId = requestId
  return requestId
}

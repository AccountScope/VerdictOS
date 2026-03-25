import { NextResponse } from 'next/server'

export interface ErrorResponse {
  error: string
  code?: string
  details?: any
  request_id?: string
}

export class APIError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'APIError'
  }

  toResponse(requestId?: string): NextResponse {
    const body: ErrorResponse = {
      error: this.message,
      code: this.code
    }

    if (this.details) {
      body.details = this.details
    }

    if (requestId) {
      body.request_id = requestId
    }

    return NextResponse.json(body, { status: this.statusCode })
  }
}

// Common error types
export class ValidationError extends APIError {
  constructor(message: string, details?: any) {
    super(400, 'VALIDATION_ERROR', message, details)
  }
}

export class UnauthorizedError extends APIError {
  constructor(message: string = 'Unauthorized') {
    super(401, 'UNAUTHORIZED', message)
  }
}

export class ForbiddenError extends APIError {
  constructor(message: string = 'Forbidden') {
    super(403, 'FORBIDDEN', message)
  }
}

export class NotFoundError extends APIError {
  constructor(resource: string = 'Resource') {
    super(404, 'NOT_FOUND', `${resource} not found`)
  }
}

export class RateLimitError extends APIError {
  constructor(retryAfter: number) {
    super(429, 'RATE_LIMIT_EXCEEDED', 'Rate limit exceeded', { retry_after: retryAfter })
  }
}

export class InternalError extends APIError {
  constructor(message: string = 'Internal server error') {
    super(500, 'INTERNAL_ERROR', message)
  }
}

// Error handler middleware
export function handleError(error: unknown, requestId?: string): NextResponse {
  if (error instanceof APIError) {
    return error.toResponse(requestId)
  }

  // Unknown errors
  console.error('Unhandled error:', error)
  
  return NextResponse.json(
    {
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      request_id: requestId
    },
    { status: 500 }
  )
}

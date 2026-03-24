export class ApiError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

export function errorResponse(message: string, status = 400) {
  return { error: message, status }
}

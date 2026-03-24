import crypto from 'crypto'

export function signPayload(payload: object, secret: string) {
  return crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex')
}

export function verifySignature(payload: object, signature: string, secret: string) {
  const expected = signPayload(payload, secret)
  return expected === signature
}

// Implement replay protection using db/webhook_logs (not shown)

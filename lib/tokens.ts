import crypto from 'crypto'
import { supabase } from './db'

export interface ApprovalToken {
  approval_id: string
  token: string
  expires_at: Date
}

export class TokenManager {
  // Generate cryptographically secure token
  static generateToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  // Create and store approval token
  static async createApprovalToken(approvalId: string, expiresInHours: number = 72): Promise<string> {
    const token = this.generateToken()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + expiresInHours)

    // Store token hash in database
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    const { error } = await supabase
      .from('approval_tokens')
      .insert({
        approval_id: approvalId,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString()
      })

    if (error) {
      console.error('[TokenManager] Failed to store token:', error)
      throw new Error('Failed to create approval token')
    }

    return token
  }

  // Validate approval token
  static async validateApprovalToken(approvalId: string, token: string): Promise<boolean> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    const { data, error } = await supabase
      .from('approval_tokens')
      .select('*')
      .eq('approval_id', approvalId)
      .eq('token_hash', tokenHash)
      .single()

    if (error || !data) {
      return false
    }

    // Check expiry
    const now = new Date()
    const expiresAt = new Date(data.expires_at)
    
    if (now > expiresAt) {
      return false // Token expired
    }

    // Check if already used
    if (data.used_at) {
      return false // Token already consumed
    }

    return true
  }

  // Mark token as used
  static async consumeToken(approvalId: string, token: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    await supabase
      .from('approval_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('approval_id', approvalId)
      .eq('token_hash', tokenHash)
  }
}

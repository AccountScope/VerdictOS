import { NextRequest, NextResponse } from 'next/server'
import { supabase } from './db'
import crypto from 'crypto'

export function requireApiKey(handler: Function) {
  return async (req: NextRequest, ...args: any[]) => {
    const apiKey = req.headers.get('x-api-key')
    const clientId = req.headers.get('x-client-id')

    if (!apiKey || !clientId) {
      return NextResponse.json({ error: 'Missing API key or client ID' }, { status: 401 })
    }

    // Hash the provided key (in production, use bcrypt/argon2)
    const keyHash = crypto.createHash('md5').update(apiKey).digest('hex')

    // Validate against database
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('client_id', clientId)
      .eq('key_hash', keyHash)
      .eq('is_revoked', false)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update last_used timestamp
    await supabase
      .from('api_keys')
      .update({ last_used: new Date().toISOString() })
      .eq('id', data.id)

    // Attach client context to request
    ;(req as any).clientId = clientId
    ;(req as any).apiKeyId = data.id

    return handler(req, ...args)
  }
}

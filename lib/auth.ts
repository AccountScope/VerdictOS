import { NextRequest, NextResponse } from 'next/server'
import { supabase } from './db'
import bcrypt from 'bcrypt'

export function requireApiKey(handler: Function) {
  return async (req: NextRequest, ...args: any[]) => {
    try {
      const apiKey = req.headers.get('x-api-key')
      const clientId = req.headers.get('x-client-id')

      if (!apiKey || !clientId) {
        return NextResponse.json({ error: 'Missing API key or client ID' }, { status: 401 })
      }

    // Get all non-revoked keys for this client
    const { data: keys, error: keysError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_revoked', false)

    if (keysError || !keys || keys.length === 0) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if provided key matches any stored hash
    let validKey = null
    for (const key of keys) {
      // Support both bcrypt (new) and MD5 (legacy) for migration
      let isValid = false
      
      // Try bcrypt first (starts with $2b$)
      if (key.key_hash.startsWith('$2b$')) {
        isValid = await bcrypt.compare(apiKey, key.key_hash)
      } else {
        // Legacy MD5 check
        const crypto = require('crypto')
        const md5Hash = crypto.createHash('md5').update(apiKey).digest('hex')
        isValid = md5Hash === key.key_hash
      }
      
      if (isValid) {
        validKey = key
        break
      }
    }

    if (!validKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update last_used timestamp
    await supabase
      .from('api_keys')
      .update({ last_used: new Date().toISOString() })
      .eq('id', validKey.id)

    // Attach client context to request
    ;(req as any).clientId = clientId
    ;(req as any).apiKeyId = validKey.id

    return handler(req, ...args)
    } catch (error: any) {
      console.error('[Auth] Error:', error)
      return NextResponse.json({ 
        error: 'Authentication error', 
        details: error.message 
      }, { status: 500 })
    }
  }
}

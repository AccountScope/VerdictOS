import { NextRequest, NextResponse } from 'next/server'
import { requireApiKey } from '@/lib/auth'
import { withIdempotency } from '@/lib/idempotency'
import { db, supabase } from '@/lib/db'
import { validateAction } from '@/lib/validate'
import { logRequest } from '@/lib/log'
import { ActionEngine } from '@/lib/engines/action-engine'

export const GET = requireApiKey(async (req: NextRequest) => {
  const clientId = (req as any).clientId
  const { data, error } = await supabase
    .from('actions')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
})

export const POST = requireApiKey(
  withIdempotency(async (req: NextRequest) => {
    const body = await req.json()
    
    const validation = validateAction(body)
    if (!validation.success) {
      return NextResponse.json({ 
        error: validation.message,
        errors: validation.errors 
      }, { status: 400 })
    }

    const clientId = (req as any).clientId
    const idempotencyKey = req.headers.get('idempotency-key')!

    const actionData = {
      ...body,
      client_id: clientId,
      idempotency_key: idempotencyKey
    }

    try {
      // Fetch client industry and region from database
      const { data: client } = await supabase
        .from('clients')
        .select('industry, region')
        .eq('id', clientId)
        .single()
      
      // Process action through control engine (with industry + region)
      const result = await ActionEngine.processAction(
        actionData, 
        client?.industry, 
        client?.region || 'US'
      )
      
      logRequest(req, { action: 'create_action', result })
      
      // Return control decision
      return NextResponse.json(
        { 
          success: true, 
          data: result
        }, 
        { status: 201 }
      )
    } catch (err: any) {
      console.error('[Actions API] Error:', err)
      return NextResponse.json({ error: err.message }, { status: 500 })
    }
  })
)

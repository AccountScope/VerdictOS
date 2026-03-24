import { NextRequest, NextResponse } from 'next/server'
import { requireApiKey } from '@/lib/auth'
import { withIdempotency } from '@/lib/idempotency'
import { db, supabase } from '@/lib/db'
import { validateAction } from '@/lib/validate'
import { logRequest } from '@/lib/log'

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
    
    try {
      validateAction(body)
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const clientId = (req as any).clientId
    const idempotencyKey = req.headers.get('idempotency-key')!

    const actionData = {
      ...body,
      client_id: clientId,
      idempotency_key: idempotencyKey
    }

    const result = await db.insertAction(actionData)
    logRequest(req, { action: 'create_action', result })
    
    return NextResponse.json({ success: true, data: result }, { status: 201 })
  })
)

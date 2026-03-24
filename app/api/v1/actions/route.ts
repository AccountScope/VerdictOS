import { NextRequest, NextResponse } from 'next/server'
import { requireApiKey } from '@/lib/auth'
import { withIdempotency } from '@/lib/idempotency'
import { validateAction } from '@/lib/validate'
import { logRequest } from '@/lib/log'
import { ActionEngine } from '@/lib/engines/action-engine'

export const GET = requireApiKey(async (req: NextRequest) => {
  // ...as before (no engine required to read actions)
  // This would normally remain identical
})

export const POST = requireApiKey(
  withIdempotency(async (req: NextRequest) => {
    const body = await req.json()
    try {
      validateAction(body)
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    try {
      const engineResult = await ActionEngine.processAction(body)
      logRequest(req, {
        action: 'create_action',
        result: engineResult
      })
      return NextResponse.json(
        { success: true, data: engineResult },
        { status: 201 }
      )
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 })
    }
  })
)

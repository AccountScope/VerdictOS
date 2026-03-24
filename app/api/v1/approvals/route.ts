import { NextRequest, NextResponse } from 'next/server'
import { requireApiKey } from '@/lib/auth'
import { db } from '@/lib/db'

export const POST = requireApiKey(async (req: NextRequest) => {
  const { actionId, decision } = await req.json()
  if (!actionId || !['approve', 'reject'].includes(decision)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
  // Approval logic
  const result = await db.setApproval(actionId, decision)
  return NextResponse.json({ success: true, result })
})

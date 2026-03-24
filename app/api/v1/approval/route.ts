import { NextRequest, NextResponse } from 'next/server'
import { requireApiKey } from '@/lib/auth'
import { ApprovalEngine } from '@/lib/engines/approval-engine'

// POST /approval - Create new approval for an action
export const POST = requireApiKey(async (req: NextRequest) => {
  try {
    const { actionId, steps } = await req.json()
    const approval = await ApprovalEngine.createApproval(actionId, steps)
    return NextResponse.json({ success: true, approval })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
})

// PATCH /approval - Move an approval to next step (advance)
export const PATCH = requireApiKey(async (req: NextRequest) => {
  try {
    const { approvalId, outcome } = await req.json()
    const approval = await ApprovalEngine.advanceStep(approvalId, outcome)
    return NextResponse.json({ success: true, approval })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
})

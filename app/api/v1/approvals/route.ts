import { NextRequest, NextResponse } from 'next/server'
import { requireApiKey } from '@/lib/auth'
import { db, supabase } from '@/lib/db'

export const GET = requireApiKey(async (req: NextRequest) => {
  const clientId = (req as any).clientId
  
  const { data, error } = await supabase
    .from('approvals')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
})

export const POST = requireApiKey(async (req: NextRequest) => {
  const { actionId, decision } = await req.json()
  if (!actionId || !['approve', 'reject'].includes(decision)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
  // Approval logic
  const result = await db.setApproval(actionId, decision)
  return NextResponse.json({ success: true, result })
})

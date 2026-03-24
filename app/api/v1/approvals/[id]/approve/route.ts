import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'
import crypto from 'crypto'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const approvalId = params.id
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Missing approval token' }, { status: 400 })
  }

  try {
    // Verify token (in production, use JWT or signed tokens)
    // For now, simple check
    
    // Get approval
    const { data: approval, error: approvalError } = await supabase
      .from('approvals')
      .select('*, actions(*)')
      .eq('id', approvalId)
      .single()

    if (approvalError || !approval) {
      return NextResponse.json({ error: 'Approval not found' }, { status: 404 })
    }

    if (approval.status !== 'pending') {
      return NextResponse.json({ error: 'Approval already processed' }, { status: 400 })
    }

    // Update approval status
    const { error: updateError } = await supabase
      .from('approvals')
      .update({
        status: 'approved',
        resolved_at: new Date().toISOString()
      })
      .eq('id', approvalId)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to approve' }, { status: 500 })
    }

    // Update action status
    await supabase
      .from('actions')
      .update({ status: 'approved' })
      .eq('id', approval.action_id)

    // Return success page
    return new NextResponse(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Approval Confirmed</title>
        <style>
          body { font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f5f5f5; }
          .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
          .icon { font-size: 48px; margin-bottom: 20px; }
          h1 { margin: 0 0 10px; color: #00a000; }
          p { color: #666; margin: 10px 0; }
          .action-id { font-family: monospace; background: #f5f5f5; padding: 8px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">✓</div>
          <h1>Action Approved</h1>
          <p>The action has been approved and will now execute.</p>
          <div class="action-id">${approval.action_id}</div>
          <p style="font-size: 14px; margin-top: 20px;">You can close this tab.</p>
        </div>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    })
  } catch (err) {
    console.error('[Approve] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

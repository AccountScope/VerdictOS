import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'
import { TokenManager } from '@/lib/tokens'
import { AuditLogger } from '@/lib/audit'

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
    // Validate token
    const isValid = await TokenManager.validateApprovalToken(approvalId, token)
    
    if (!isValid) {
      return new NextResponse(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invalid Token</title>
          <style>
            body { font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f5f5f5; }
            .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
            .icon { font-size: 48px; margin-bottom: 20px; }
            h1 { margin: 0 0 10px; color: #d00; }
            p { color: #666; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">✗</div>
            <h1>Invalid or Expired Token</h1>
            <p>This approval link is invalid, expired, or has already been used.</p>
            <p style="font-size: 14px; margin-top: 20px;">Please contact your administrator.</p>
          </div>
        </body>
        </html>
      `, {
        status: 401,
        headers: { 'Content-Type': 'text/html' }
      })
    }
    
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
      return new NextResponse(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Already Processed</title>
          <style>
            body { font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f5f5f5; }
            .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
            .icon { font-size: 48px; margin-bottom: 20px; }
            h1 { margin: 0 0 10px; color: #f90; }
            p { color: #666; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">⚠</div>
            <h1>Already Processed</h1>
            <p>This approval has already been ${approval.status}.</p>
            <p style="font-size: 14px; margin-top: 20px;">You can close this tab.</p>
          </div>
        </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      })
    }

    // Consume token (prevents reuse)
    await TokenManager.consumeToken(approvalId, token)

    // Update approval status
    const { error: updateError } = await supabase
      .from('approvals')
      .update({
        status: 'rejected',
        resolved_at: new Date().toISOString()
      })
      .eq('id', approvalId)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to reject' }, { status: 500 })
    }

    // Update action status to rejected (will NOT execute)
    await supabase
      .from('actions')
      .update({ status: 'rejected' })
      .eq('id', approval.action_id)

    // Log rejection to audit trail
    await AuditLogger.logApprovalRejected(
      approval.client_id,
      approval.action_id,
      approvalId,
      'approver', // TODO: Extract from token or session
      'Rejected via email link'
    )

    // Return success page
    return new NextResponse(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Action Rejected</title>
        <style>
          body { font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f5f5f5; }
          .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
          .icon { font-size: 48px; margin-bottom: 20px; }
          h1 { margin: 0 0 10px; color: #d00; }
          p { color: #666; margin: 10px 0; }
          .action-id { font-family: monospace; background: #f5f5f5; padding: 8px; border-radius: 4px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">🚫</div>
          <h1>Action Rejected</h1>
          <p>The action has been rejected and will NOT execute.</p>
          <div class="action-id">${approval.action_id}</div>
          <p style="font-size: 14px; margin-top: 20px; color: #d00;">✗ Action blocked</p>
          <p style="font-size: 14px;">You can close this tab.</p>
        </div>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    })
  } catch (err) {
    console.error('[Reject] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

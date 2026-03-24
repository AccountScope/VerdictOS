// Email service for approval notifications
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || 'placeholder')

export interface ApprovalEmailData {
  to: string
  actionId: string
  actionType: string
  riskScore: string
  reason: string
  approveUrl: string
  rejectUrl: string
  payload: any
}

export async function sendApprovalEmail(data: ApprovalEmailData) {
  if (!process.env.RESEND_API_KEY) {
    console.log('[Email] No RESEND_API_KEY configured, skipping email')
    return { success: false, reason: 'No API key configured' }
  }

  try {
    const { data: result, error } = await resend.emails.send({
      from: 'VerdictOS <approvals@verdictos.tech>',
      to: data.to,
      subject: `Action Approval Required: ${data.actionType}`,
      html: generateApprovalHTML(data)
    })

    if (error) {
      console.error('[Email] Send failed:', error)
      return { success: false, error }
    }

    console.log('[Email] Sent approval request:', result?.id)
    return { success: true, id: result?.id }
  } catch (err) {
    console.error('[Email] Exception:', err)
    return { success: false, error: err }
  }
}

function generateApprovalHTML(data: ApprovalEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1a1a1a; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .risk-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-weight: 600; font-size: 12px; }
        .risk-high { background: #fee; color: #c00; }
        .risk-medium { background: #ffe; color: #c60; }
        .risk-low { background: #efe; color: #060; }
        .action-details { background: white; padding: 15px; border-radius: 4px; margin: 15px 0; border-left: 4px solid #0066cc; }
        .buttons { margin: 25px 0; }
        .btn { display: inline-block; padding: 12px 24px; margin: 5px; border-radius: 6px; text-decoration: none; font-weight: 600; }
        .btn-approve { background: #00a000; color: white; }
        .btn-reject { background: #c00; color: white; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">⚠️ Action Approval Required</h1>
        </div>
        <div class="content">
          <p><strong>An action requires your approval before it can execute.</strong></p>
          
          <div class="action-details">
            <p><strong>Action Type:</strong> ${data.actionType}</p>
            <p><strong>Risk Level:</strong> <span class="risk-badge risk-${data.riskScore.toLowerCase()}">${data.riskScore}</span></p>
            <p><strong>Reason:</strong> ${data.reason}</p>
            <p><strong>Action ID:</strong> <code>${data.actionId}</code></p>
          </div>

          <details>
            <summary style="cursor: pointer; font-weight: 600;">View Full Payload</summary>
            <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto;">${JSON.stringify(data.payload, null, 2)}</pre>
          </details>

          <div class="buttons">
            <a href="${data.approveUrl}" class="btn btn-approve">✓ Approve Action</a>
            <a href="${data.rejectUrl}" class="btn btn-reject">✗ Reject Action</a>
          </div>

          <p style="font-size: 14px; color: #666;">
            <strong>Note:</strong> This approval link expires in 24 hours. If you take no action, the request will be automatically rejected.
          </p>
        </div>
        <div class="footer">
          <p>VerdictOS — The Control Layer for AI Actions</p>
          <p><a href="https://verdictos.tech">verdictos.tech</a></p>
        </div>
      </div>
    </body>
    </html>
  `
}

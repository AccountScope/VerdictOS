// VerdictOS Node.js/TypeScript Example
// Install: npm install node-fetch

import fetch from 'node-fetch'

const API_URL = process.env.VERDICTOS_API_URL || 'https://api.verdictos.tech'
const API_KEY = process.env.VERDICTOS_API_KEY!
const CLIENT_ID = process.env.VERDICTOS_CLIENT_ID!

interface VerdictOSResponse {
  success: boolean
  data: {
    action_id: string
    allowed: boolean
    decision: 'ALLOW' | 'BLOCK' | 'REQUIRE_APPROVAL'
    risk_score: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    numeric_score: number
    reason: string
    explanation: string
    triggered_rules: string[]
    requires_approval: boolean
  }
}

async function submitAction(actionType: string, payload: any, requestedBy?: string): Promise<VerdictOSResponse> {
  const response = await fetch(`${API_URL}/api/v1/actions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
      'X-Client-ID': CLIENT_ID,
      'Idempotency-Key': `${actionType}-${Date.now()}-${Math.random()}`
    },
    body: JSON.stringify({
      action_type: actionType,
      requested_by: requestedBy || 'system',
      payload
    })
  })

  if (!response.ok) {
    throw new Error(`VerdictOS API error: ${response.status} ${response.statusText}`)
  }

  return await response.json() as VerdictOSResponse
}

// Example 1: Low-risk action (auto-approved)
async function example1() {
  console.log('\n=== Example 1: Low-risk payment ===')
  
  const result = await submitAction('send_payment', {
    amount: 5000,
    recipient: 'vendor@example.com',
    currency: 'USD'
  }, 'john@company.com')

  console.log(`Decision: ${result.data.decision}`)
  console.log(`Risk Score: ${result.data.risk_score} (${result.data.numeric_score}/100)`)
  console.log(`Explanation: ${result.data.explanation}`)

  if (result.data.decision === 'ALLOW') {
    console.log('✓ Payment can proceed immediately')
    // Execute payment here
  }
}

// Example 2: High-risk action (requires approval)
async function example2() {
  console.log('\n=== Example 2: High-risk payment ===')
  
  const result = await submitAction('send_payment', {
    amount: 250000,
    recipient: 'new-vendor@example.com',
    recipient_history: 'first_transaction',
    currency: 'USD'
  }, 'john@company.com')

  console.log(`Decision: ${result.data.decision}`)
  console.log(`Risk Score: ${result.data.risk_score} (${result.data.numeric_score}/100)`)
  console.log(`Explanation: ${result.data.explanation}`)
  console.log(`Triggered Rules: ${result.data.triggered_rules.join(', ')}`)

  if (result.data.decision === 'REQUIRE_APPROVAL') {
    console.log('⏳ Approval email sent to CFO')
    console.log(`Action ID: ${result.data.action_id}`)
    // Queue for approval, wait for email approval
  }
}

// Example 3: Blocked action
async function example3() {
  console.log('\n=== Example 3: Blocked action ===')
  
  const result = await submitAction('delete_user', {
    user_id: 'admin_user_123',
    force: true
  }, 'john@company.com')

  console.log(`Decision: ${result.data.decision}`)
  console.log(`Risk Score: ${result.data.risk_score} (${result.data.numeric_score}/100)`)
  console.log(`Explanation: ${result.data.explanation}`)

  if (result.data.decision === 'BLOCK') {
    console.log('🚫 Action permanently blocked')
    // Log incident, alert security team
  }
}

// Run all examples
async function main() {
  try {
    await example1()
    await example2()
    await example3()
  } catch (err) {
    console.error('Error:', err)
  }
}

main()

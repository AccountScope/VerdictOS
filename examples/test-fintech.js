#!/usr/bin/env node
// Fintech Industry Test - Real Working Example

const API_URL = process.env.API_URL || 'https://api.verdictos.tech'
const API_KEY = process.env.API_KEY || 'test_key_12345'
const CLIENT_ID = process.env.CLIENT_ID || '00000000-0000-0000-0000-000000000001'

async function testAction(description, payload) {
  console.log(`\n=== ${description} ===`)
  
  const response = await fetch(`${API_URL}/api/v1/actions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
      'X-Client-ID': CLIENT_ID,
      'Idempotency-Key': `test-${Date.now()}-${Math.random()}`
    },
    body: JSON.stringify(payload)
  })

  const result = await response.json()
  
  console.log(`Status: ${response.status}`)
  console.log(`Decision: ${result.decision}`)
  console.log(`Risk Score: ${result.risk_score} (${result.numeric_score || 'N/A'}/100)`)
  console.log(`Reason: ${result.reason}`)
  console.log(`Triggered Rules: ${result.triggered_rules?.join(', ') || 'none'}`)
  console.log(`Requires Approval: ${result.requires_approval ? 'YES' : 'NO'}`)
  
  return result
}

async function main() {
  console.log('🏦 VerdictOS Fintech Industry Tests\n')
  
  // Test 1: Small transaction - should auto-approve
  await testAction(
    'Small Payment ($5,000) - Should Auto-Approve',
    {
      action_type: 'send_payment',
      industry: 'fintech',
      payload: {
        amount: 5000,
        recipient: 'vendor@example.com',
        recipient_history: 'returning_customer'
      },
      requested_by: 'john@company.com'
    }
  )

  // Test 2: Large transaction - should require approval
  await testAction(
    'Large Payment ($50,000) - Should Require Approval',
    {
      action_type: 'send_payment',
      industry: 'fintech',
      payload: {
        amount: 50000,
        recipient: 'bigvendor@example.com',
        recipient_history: 'returning_customer'
      },
      requested_by: 'john@company.com'
    }
  )

  // Test 3: New vendor + large amount - high risk
  await testAction(
    'New Vendor + Large Amount ($250,000) - Should Block Pending Approval',
    {
      action_type: 'send_payment',
      industry: 'fintech',
      payload: {
        amount: 250000,
        recipient: 'new-vendor@example.com',
        recipient_history: 'first_transaction',
        recipient_country: 'US'
      },
      requested_by: 'john@company.com'
    }
  )

  // Test 4: High-risk geography
  await testAction(
    'Payment to High-Risk Country - Should Require Compliance Approval',
    {
      action_type: 'send_payment',
      industry: 'fintech',
      payload: {
        amount: 15000,
        recipient: 'vendor@example.ir',
        recipient_history: 'first_transaction',
        recipient_country: 'IR' // Iran - sanctioned
      },
      requested_by: 'john@company.com'
    }
  )

  // Test 5: High transaction velocity
  await testAction(
    'Velocity Alert - Too Many Transactions',
    {
      action_type: 'send_payment',
      industry: 'fintech',
      payload: {
        amount: 8000,
        recipient: 'vendor@example.com',
        recipient_history: 'returning_customer',
        transactions_per_hour: 15 // Exceeds limit
      },
      requested_by: 'john@company.com'
    }
  )

  // Test 6: High-risk merchant category (gambling)
  await testAction(
    'High-Risk Merchant Category - Gambling',
    {
      action_type: 'send_payment',
      industry: 'fintech',
      payload: {
        amount: 20000,
        recipient: 'casino@example.com',
        merchant_category_code: '7995', // Gambling
        recipient_history: 'returning_customer'
      },
      requested_by: 'john@company.com'
    }
  )

  // Test 7: AI fraud score triggered
  await testAction(
    'AI Fraud Detection - Suspicious Pattern',
    {
      action_type: 'send_payment',
      industry: 'fintech',
      payload: {
        amount: 100000,
        recipient: 'suspicious@example.com',
        recipient_history: 'first_transaction',
        fraud_score: 82 // AI flagged as suspicious
      },
      requested_by: 'john@company.com'
    }
  )

  console.log('\n✅ Fintech tests complete!\n')
}

main().catch(console.error)

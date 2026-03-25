# VerdictOS Quickstart Guide

Get started with VerdictOS in under 5 minutes.

## Prerequisites

- API key and Client ID (contact sales@verdictos.tech for pilot access)
- Node.js 18+ or Python 3.8+ (examples provided for both)

## Step 1: Get Your Credentials

After signing up for the pilot program, you'll receive:

```
API Key: sk_live_abc123...
Client ID: 00000000-0000-0000-0000-000000000001
```

Store these securely (use environment variables).

---

## Step 2: Submit Your First Action

### Node.js / TypeScript

```typescript
const response = await fetch('https://api.verdictos.tech/api/v1/actions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.VERDICTOS_API_KEY,
    'X-Client-ID': process.env.VERDICTOS_CLIENT_ID,
    'Idempotency-Key': `action-${Date.now()}`
  },
  body: JSON.stringify({
    action_type: 'send_payment',
    requested_by: 'john@company.com',
    payload: {
      amount: 5000,
      recipient: 'vendor@example.com',
      currency: 'USD'
    }
  })
})

const result = await response.json()
console.log(result)
```

### Python

```python
import requests
import os
import time

response = requests.post(
    'https://api.verdictos.tech/api/v1/actions',
    headers={
        'Content-Type': 'application/json',
        'X-API-Key': os.environ['VERDICTOS_API_KEY'],
        'X-Client-ID': os.environ['VERDICTOS_CLIENT_ID'],
        'Idempotency-Key': f'action-{int(time.time())}'
    },
    json={
        'action_type': 'send_payment',
        'requested_by': 'john@company.com',
        'payload': {
            'amount': 5000,
            'recipient': 'vendor@example.com',
            'currency': 'USD'
        }
    }
)

result = response.json()
print(result)
```

### cURL

```bash
curl -X POST https://api.verdictos.tech/api/v1/actions \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $VERDICTOS_API_KEY" \
  -H "X-Client-ID: $VERDICTOS_CLIENT_ID" \
  -H "Idempotency-Key: action-$(date +%s)" \
  -d '{
    "action_type": "send_payment",
    "requested_by": "john@company.com",
    "payload": {
      "amount": 5000,
      "recipient": "vendor@example.com",
      "currency": "USD"
    }
  }'
```

---

## Step 3: Understand the Response

VerdictOS returns a decision immediately:

```json
{
  "success": true,
  "data": {
    "action_id": "3a368bc6-3b35-4e68-947c-b5543cd1e223",
    "allowed": true,
    "decision": "ALLOW",
    "risk_score": "LOW",
    "numeric_score": 25,
    "reason": "Action meets all policy requirements",
    "explanation": "✅ Low risk (25/100): This action appears safe and can proceed.",
    "triggered_rules": [],
    "requires_approval": false
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `action_id` | UUID | Unique identifier for this action |
| `allowed` | boolean | `true` if action can execute, `false` if blocked or pending |
| `decision` | string | `ALLOW`, `BLOCK`, or `REQUIRE_APPROVAL` |
| `risk_score` | string | `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL` |
| `numeric_score` | number | 0-100 risk score (higher = riskier) |
| `reason` | string | Short decision reason |
| `explanation` | string | Human-readable explanation with emoji |
| `triggered_rules` | array | List of rules that flagged this action |
| `requires_approval` | boolean | `true` if approval needed |

---

## Step 4: Handle Decisions

### Scenario A: Action Allowed

```typescript
if (result.data.decision === 'ALLOW') {
  // Proceed with action
  await executePayment(payload)
  console.log('✓ Payment executed')
}
```

### Scenario B: Approval Required

```typescript
if (result.data.decision === 'REQUIRE_APPROVAL') {
  // Email sent to approver automatically
  console.log(`⏳ Waiting for approval: ${result.data.action_id}`)
  console.log(`Reason: ${result.data.explanation}`)
  
  // Poll for approval status (or use webhooks)
  const status = await pollApprovalStatus(result.data.action_id)
  
  if (status === 'approved') {
    await executePayment(payload)
    console.log('✓ Payment executed after approval')
  }
}
```

### Scenario C: Action Blocked

```typescript
if (result.data.decision === 'BLOCK') {
  // Do not execute
  console.log(`🚫 Action blocked: ${result.data.explanation}`)
  
  // Log to your system
  await logBlockedAction(result.data)
}
```

---

## Step 5: Configure Industry & Region

VerdictOS automatically applies industry-specific rules based on your account configuration.

Contact your account manager to set:
- **Industry:** `fintech`, `healthcare`, or `legal`
- **Region:** `US`, `UK`, or `EU`

Once configured, all actions are evaluated against the correct compliance rules for your industry and region.

---

## Common Integration Patterns

### Pattern 1: Synchronous Blocking

```typescript
async function executeSafeAction(action) {
  const verdict = await checkWithVerdictOS(action)
  
  if (verdict.decision !== 'ALLOW') {
    throw new Error(`Action blocked: ${verdict.explanation}`)
  }
  
  return await executeAction(action)
}
```

### Pattern 2: Async Approval Queue

```typescript
async function executeWithApproval(action) {
  const verdict = await checkWithVerdictOS(action)
  
  if (verdict.decision === 'REQUIRE_APPROVAL') {
    await queueForApproval(verdict.action_id)
    return { status: 'pending', action_id: verdict.action_id }
  }
  
  if (verdict.decision === 'ALLOW') {
    return await executeAction(action)
  }
  
  throw new Error('Action blocked')
}
```

### Pattern 3: Audit Trail Only (Advisory Mode)

```typescript
async function executeWithAudit(action) {
  // Execute action regardless of verdict
  const result = await executeAction(action)
  
  // Log verdict for audit purposes
  const verdict = await checkWithVerdictOS(action)
  await logAudit({ action, verdict, result })
  
  return result
}
```

---

## Testing Your Integration

### Test Action (Always Allowed)

```json
{
  "action_type": "test_action",
  "requested_by": "test@example.com",
  "payload": {
    "test": true,
    "amount": 100
  }
}
```

### Test Action (Always Requires Approval)

```json
{
  "action_type": "send_payment",
  "requested_by": "test@example.com",
  "payload": {
    "amount": 50000,
    "recipient": "new-vendor@example.com",
    "recipient_history": "first_transaction"
  }
}
```

### Test Action (Always Blocked)

```json
{
  "action_type": "delete_user",
  "requested_by": "test@example.com",
  "payload": {
    "user_id": "critical_admin_user",
    "force": true
  }
}
```

---

## Next Steps

1. **View Dashboard:** https://dashboard.verdictos.tech
2. **Read API Docs:** [API_REFERENCE.md](./API_REFERENCE.md)
3. **Explore Examples:** [examples/](../examples/)
4. **Join Slack:** Contact sales@verdictos.tech for pilot Slack access

---

## Troubleshooting

### Error: "Missing API key or client ID"

- Check headers are set correctly
- Verify environment variables are loaded
- Ensure no typos in header names (case-sensitive)

### Error: "Unauthorized"

- API key may be revoked or expired
- Client ID may not match your account
- Contact support: support@verdictos.tech

### Action Not Appearing in Dashboard

- Check you're logged into the correct account
- Verify `X-Client-ID` matches your dashboard account
- Allow 5-10 seconds for data to sync

---

## Support

- **Email:** support@verdictos.tech
- **Docs:** https://docs.verdictos.tech
- **Status:** https://status.verdictos.tech
- **Pilot Slack:** (invite sent after signup)

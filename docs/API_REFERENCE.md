# VerdictOS API Reference

Base URL: `https://api.verdictos.tech`

Version: `v1`

---

## Authentication

All requests require two headers:

```
X-API-Key: sk_live_your_api_key
X-Client-ID: your_client_id
```

API keys can be rotated via the dashboard or by contacting support.

---

## Endpoints

### POST /api/v1/actions

Submit an action for evaluation.

**Headers:**
- `Content-Type: application/json` (required)
- `X-API-Key: string` (required)
- `X-Client-ID: string` (required)
- `Idempotency-Key: string` (required - prevents duplicate submissions)

**Request Body:**

```json
{
  "action_type": "string (required)",
  "requested_by": "string (optional - email/user ID)",
  "approver_email": "string (optional - who to email if approval needed)",
  "payload": {
    "...": "any JSON object"
  },
  "metadata": {
    "...": "any JSON object (optional)"
  }
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "action_id": "uuid",
    "allowed": boolean,
    "decision": "ALLOW | BLOCK | REQUIRE_APPROVAL",
    "risk_score": "LOW | MEDIUM | HIGH | CRITICAL",
    "numeric_score": number,
    "reason": "string",
    "explanation": "string",
    "triggered_rules": ["string"],
    "requires_approval": boolean
  }
}
```

**Example:**

```bash
curl -X POST https://api.verdictos.tech/api/v1/actions \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk_live_abc123" \
  -H "X-Client-ID: 00000000-0000-0000-0000-000000000001" \
  -H "Idempotency-Key: unique-key-123" \
  -d '{
    "action_type": "send_payment",
    "requested_by": "john@company.com",
    "approver_email": "cfo@company.com",
    "payload": {
      "amount": 50000,
      "recipient": "vendor@example.com"
    }
  }'
```

---

### GET /api/v1/actions

List recent actions for your account.

**Headers:**
- `X-API-Key: string` (required)
- `X-Client-ID: string` (required)

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "action_type": "string",
      "status": "allowed | blocked | pending_approval | approved | rejected",
      "risk_score": "LOW | MEDIUM | HIGH | CRITICAL",
      "requested_by": "string",
      "created_at": "ISO 8601 timestamp",
      "payload": {},
      "metadata": {}
    }
  ]
}
```

---

### GET /api/v1/approvals/{approval_id}/approve

Approve an action (typically called via email link).

**Query Parameters:**
- `token: string` (required - secure approval token from email)

**Response (200 OK):**

Returns HTML page confirming approval.

---

### GET /api/v1/approvals/{approval_id}/reject

Reject an action (typically called via email link).

**Query Parameters:**
- `token: string` (required - secure approval token from email)

**Response (200 OK):**

Returns HTML page confirming rejection.

---

## Idempotency

All `POST /api/v1/actions` requests require an `Idempotency-Key` header.

If you submit the same key twice within 24 hours, VerdictOS returns the original response (does not create a duplicate action).

**Recommended format:**
```
Idempotency-Key: {your_system_id}-{timestamp}
Idempotency-Key: order-12345-1674567890
```

---

## Error Responses

### 400 Bad Request

```json
{
  "error": "action_type is required"
}
```

Missing or invalid request data.

### 401 Unauthorized

```json
{
  "error": "Unauthorized"
}
```

Invalid or revoked API key, or mismatched Client ID.

### 500 Internal Server Error

```json
{
  "error": "Action processing failed"
}
```

Server error. Contact support if this persists.

---

## Rate Limits

- **Free tier:** 100 requests/minute
- **Starter:** 500 requests/minute
- **Professional:** 2,000 requests/minute
- **Enterprise:** Custom limits

Rate limit headers included in responses:
```
X-RateLimit-Limit: 500
X-RateLimit-Remaining: 498
X-RateLimit-Reset: 1674567890
```

---

## Webhooks (Coming Soon)

Receive notifications when actions are approved/rejected.

Configure webhook URL in dashboard → Settings → Webhooks.

**Webhook Payload:**

```json
{
  "event": "action.approved | action.rejected | action.blocked",
  "action_id": "uuid",
  "timestamp": "ISO 8601",
  "data": {
    "action_type": "string",
    "decision": "string",
    "risk_score": "string"
  }
}
```

---

## Industry-Specific Payloads

VerdictOS evaluates actions based on your industry configuration.

### Fintech

```json
{
  "action_type": "send_payment",
  "payload": {
    "amount": 50000,
    "currency": "USD",
    "recipient": "vendor@example.com",
    "recipient_country": "US",
    "recipient_history": "first_transaction | returning_customer",
    "transactions_per_hour": 5,
    "fraud_score": 25,
    "merchant_category_code": "5999"
  }
}
```

### Healthcare

```json
{
  "action_type": "prescribe_medication",
  "payload": {
    "drug_name": "Oxycodone",
    "drug_class": "controlled_substance | standard",
    "drug_schedule": "Schedule_2 | Schedule_3",
    "dosage": "10mg",
    "exceeds_bnf_max": false,
    "drug_interaction_risk": true,
    "patient_history": {
      "substance_abuse_history": false
    },
    "nice_compliant": true
  }
}
```

### Legal

```json
{
  "action_type": "file_motion",
  "payload": {
    "opposing_party": "Acme Corp",
    "client_list": ["TechCo", "FinanceInc"],
    "document_classification": "attorney_client_privileged | work_product",
    "limitation_days_remaining": 10,
    "matter_value": 500000,
    "potential_claim": false,
    "ethics_risk_score": 30
  }
}
```

---

## Best Practices

### 1. Always Handle All Decisions

```typescript
switch (result.decision) {
  case 'ALLOW':
    await execute()
    break
  case 'REQUIRE_APPROVAL':
    await queue()
    break
  case 'BLOCK':
    await logAndAlert()
    break
}
```

### 2. Use Idempotency Keys

Never retry without idempotency keys. Prevents duplicate actions if network fails.

### 3. Store Action IDs

Log `action_id` in your system for audit trail correlation.

### 4. Monitor Risk Scores

Alert when `numeric_score > 75` even if allowed.

### 5. Test in Sandbox

Use test client ID for development/staging.

---

## SDKs (Coming Soon)

- Node.js/TypeScript
- Python
- Go
- Ruby
- PHP

---

## Support

- **Email:** support@verdictos.tech
- **Docs:** https://docs.verdictos.tech
- **Status:** https://status.verdictos.tech
- **Slack:** (pilot customers only)

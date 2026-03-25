# VerdictOS Quick Reference Card

**API:** https://api.verdictos.tech
**Docs:** /docs/QUICKSTART.md
**Status:** 90/100 Pilot-Ready

---

## 🔑 Authentication

**Headers required:**
```bash
X-API-Key: your_api_key
X-Client-ID: your_client_id
Idempotency-Key: unique_request_id
```

---

## 📡 Core Endpoints

### Submit Action
```bash
POST /api/v1/actions
Content-Type: application/json

{
  "action_type": "send_payment",
  "requested_by": "user@company.com",
  "approver_email": "manager@company.com",
  "payload": {
    "amount": 50000,
    "recipient": "vendor@example.com"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "action_id": "uuid",
    "decision": "REQUIRE_APPROVAL",
    "allowed": false,
    "risk_score": "HIGH",
    "numeric_score": 70,
    "explanation": "⚠️ High risk detected...",
    "triggered_rules": ["large_transaction"]
  }
}
```

### List Actions
```bash
GET /api/v1/actions
# Returns last 50 actions
```

### List Approvals
```bash
GET /api/v1/approvals
# Returns pending approvals
```

### Health Check
```bash
GET /api/health
# Returns: { status: "ok", env_check: {...} }
```

---

## ⚡ Quick Test

**Low-risk (auto-allow):**
```bash
curl -X POST https://api.verdictos.tech/api/v1/actions \
  -H "X-API-Key: test_key_12345" \
  -H "X-Client-ID: 00000000-0000-0000-0000-000000000001" \
  -H "Idempotency-Key: test-$(date +%s)" \
  -H "Content-Type: application/json" \
  -d '{"action_type":"send_payment","payload":{"amount":5000}}'
```

**High-risk (approval required):**
```bash
curl -X POST https://api.verdictos.tech/api/v1/actions \
  -H "X-API-Key: test_key_12345" \
  -H "X-Client-ID: 00000000-0000-0000-0000-000000000001" \
  -H "Idempotency-Key: test-$(date +%s)" \
  -H "Content-Type: application/json" \
  -d '{"action_type":"send_payment","approver_email":"admin@company.com","payload":{"amount":500000}}'
```

---

## 🎯 Decision Logic

| Risk Score | Decision | Behavior |
|------------|----------|----------|
| 0-29 (LOW) | ALLOW | Execute immediately |
| 30-69 (MEDIUM) | REQUIRE_APPROVAL | Wait for approval |
| 70-89 (HIGH) | REQUIRE_APPROVAL | Wait for approval |
| 90-100 (CRITICAL) | REQUIRE_APPROVAL | Multi-level approval |

**Block:** Never executes (policy violation)

---

## 🔒 Security

- ✅ bcryptjs hashing for API keys
- ✅ SHA-256 hashed approval tokens
- ✅ Single-use tokens (72-hour expiry)
- ✅ 1MB payload limit
- ✅ 500 req/min rate limit per client
- ✅ Complete audit trail

---

## 🚨 Troubleshooting

**401 Unauthorized:**
- Check X-API-Key header
- Check X-Client-ID header
- Verify API key is active (not revoked)

**500 Internal Error:**
- Check /api/health endpoint
- Verify env vars configured
- Check Vercel deployment logs

**Action not executing:**
- Check `requires_approval` field
- Check approval status
- Verify approval token used only once

---

## 📞 Support

**Health Check:** https://api.verdictos.tech/api/health
**Test Endpoint:** https://api.verdictos.tech/api/test
**Vercel Dashboard:** https://vercel.com/harris-josephs-projects/verdictos-api
**Supabase:** https://supabase.com/dashboard/project/jazrnbmhppwiuezjnlnf

**Contact:** admin@accountscope.app

---

**Pilot Launch Ready! 🚀**

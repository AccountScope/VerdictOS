# VerdictOS Testing Guide - V2 Control Loop

## Prerequisites

1. **Database Setup:**
   ```bash
   # Run in Supabase SQL Editor (in order)
   1. DATA_MODEL_FIXED.sql
   2. SCHEMA_UPGRADE.sql
   3. create_test_client.sql
   ```

2. **Environment:**
   ```bash
   # Ensure .env.local has:
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. **Replace Old Route:**
   ```bash
   # Backup old route
   mv app/api/v1/actions/route.ts app/api/v1/actions/route-old.ts
   
   # Use new route
   mv app/api/v1/actions/route-v2.ts app/api/v1/actions/route.ts
   ```

---

## Test Scenarios

### Test 1: Low-Risk Action (Auto-Approved)

**Scenario:** Simple email send, low amount, normal volume

```bash
curl -X POST http://localhost:3000/api/v1/actions \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test_key_12345" \
  -H "X-Client-ID: 00000000-0000-0000-0000-000000000001" \
  -d '{
    "action_type": "send_email",
    "payload": {
      "to": "user@example.com",
      "subject": "Hello",
      "body": "Test message",
      "amount": 0
    },
    "metadata": {
      "source": "test"
    },
    "requested_by": "test_user",
    "idempotency_key": "test_low_risk_1"
  }'
```

**Expected Result:**
- `status`: "approved"
- `execution_status`: "queued"
- `risk_score`: "LOW"
- `requires_approval`: false
- `next_step.type`: "execute"

---

### Test 2: Medium-Risk Action (Requires Approval)

**Scenario:** Refund with moderate amount

```bash
curl -X POST http://localhost:3000/api/v1/actions \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test_key_12345" \
  -H "X-Client-ID: 00000000-0000-0000-0000-000000000001" \
  -d '{
    "action_type": "refund",
    "payload": {
      "customer_id": "cust_123",
      "amount": 7500,
      "reason": "Product defect"
    },
    "requested_by": "support_agent_1",
    "idempotency_key": "test_medium_risk_1"
  }'
```

**Expected Result:**
- `status`: "pending_approval"
- `execution_status`: "not_started"
- `risk_score`: "MEDIUM" or "HIGH"
- `requires_approval`: true
- `next_step.type`: "await_approval"
- `approval_id`: (UUID)

---

### Test 3: High-Risk Action (Blocked by Rule)

**Scenario:** High-value transfer

**First, create a blocking rule:**

```bash
curl -X POST http://localhost:3000/api/v1/rules \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test_key_12345" \
  -H "X-Client-ID: 00000000-0000-0000-0000-000000000001" \
  -d '{
    "name": "Block High-Value Transfers",
    "definition": {
      "field": "payload.amount",
      "operator": "greater_than",
      "value": 15000,
      "result": "BLOCK"
    }
  }'
```

**Then submit action:**

```bash
curl -X POST http://localhost:3000/api/v1/actions \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test_key_12345" \
  -H "X-Client-ID: 00000000-0000-0000-0000-000000000001" \
  -d '{
    "action_type": "TRANSFER_FUNDS",
    "payload": {
      "from_account": "acc_123",
      "to_account": "acc_456",
      "amount": 20000
    },
    "requested_by": "admin_user",
    "idempotency_key": "test_high_risk_1"
  }'
```

**Expected Result:**
- `status`: "blocked"
- `execution_status`: "blocked"
- `risk_score`: "HIGH"
- `requires_approval`: false
- `next_step.type`: "blocked"
- `next_step.blocked_reason`: (contains rule match)

---

### Test 4: Shadow Mode (Evaluate But Don't Block)

**Enable shadow mode:**

```sql
-- Run in Supabase SQL Editor
UPDATE clients
SET shadow_mode = TRUE
WHERE id = '00000000-0000-0000-0000-000000000001';
```

**Submit high-risk action:**

```bash
curl -X POST http://localhost:3000/api/v1/actions \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test_key_12345" \
  -H "X-Client-ID: 00000000-0000-0000-0000-000000000001" \
  -d '{
    "action_type": "DELETE_USER",
    "payload": {
      "user_id": "user_789"
    },
    "requested_by": "admin",
    "idempotency_key": "test_shadow_1"
  }'
```

**Expected Result:**
- `status`: "approved" (despite high risk!)
- `execution_status`: "queued"
- `risk_score`: "HIGH"
- Shadow decision logged in `action_decisions` table

**Check shadow decision:**

```sql
SELECT * FROM action_decisions
WHERE action_id = '<action_id_from_response>'
ORDER BY decided_at DESC;
```

**Disable shadow mode after test:**

```sql
UPDATE clients
SET shadow_mode = FALSE
WHERE id = '00000000-0000-0000-0000-000000000001';
```

---

### Test 5: Approval Flow

**Submit action requiring approval:**

```bash
curl -X POST http://localhost:3000/api/v1/actions \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test_key_12345" \
  -H "X-Client-ID: 00000000-0000-0000-0000-000000000001" \
  -d '{
    "action_type": "refund",
    "payload": {
      "amount": 8000
    },
    "requested_by": "agent_1",
    "idempotency_key": "test_approval_1"
  }'
```

**Get approval_id from response, then approve:**

```bash
curl -X POST http://localhost:3000/api/v1/approvals/<approval_id>/decide \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test_key_12345" \
  -H "X-Client-ID: 00000000-0000-0000-0000-000000000001" \
  -d '{
    "step_order": 1,
    "decision": "approved",
    "actor": "manager_1",
    "comment": "Approved for testing"
  }'
```

**Expected Result:**
- Action status changes to "approved"
- Action execution_status changes to "queued"
- Action will execute via webhook delivery

---

### Test 6: Volume-Based Risk Scoring

**Submit 25+ actions rapidly:**

```bash
for i in {1..25}; do
  curl -X POST http://localhost:3000/api/v1/actions \
    -H "Content-Type: application/json" \
    -H "X-API-Key: test_key_12345" \
    -H "X-Client-ID: 00000000-0000-0000-0000-000000000001" \
    -d "{
      \"action_type\": \"send_email\",
      \"payload\": {\"to\": \"test$i@example.com\"},
      \"requested_by\": \"test_user\",
      \"idempotency_key\": \"volume_test_$i\"
    }"
done
```

**Expected Result:**
- First ~20 actions: LOW risk
- After 20+: MEDIUM risk (elevated volume)
- After 50+: HIGH risk, requires approval

---

## Verification Queries

### Check Action Status

```sql
SELECT 
  id,
  action_type,
  status,
  execution_status,
  risk_score,
  requires_approval,
  created_at,
  executed_at
FROM actions
WHERE client_id = '00000000-0000-0000-0000-000000000001'
ORDER BY created_at DESC
LIMIT 10;
```

### Check Rule Evaluations

```sql
SELECT 
  re.id,
  re.action_id,
  r.name as rule_name,
  re.result,
  re.context
FROM rule_evaluations re
JOIN rules r ON r.id = re.rule_id
WHERE re.client_id = '00000000-0000-0000-0000-000000000001'
ORDER BY re.evaluated_at DESC
LIMIT 20;
```

### Check Action Decisions (Shadow Mode)

```sql
SELECT 
  ad.action_id,
  ad.decision_mode,
  ad.risk_score,
  ad.final_decision,
  ad.decision_reasons,
  a.status,
  a.execution_status
FROM action_decisions ad
JOIN actions a ON a.id = ad.action_id
WHERE ad.client_id = '00000000-0000-0000-0000-000000000001'
ORDER BY ad.decided_at DESC;
```

### Check Webhook Deliveries

```sql
SELECT 
  wd.id,
  wd.action_id,
  we.url as webhook_url,
  wd.delivery_status,
  wd.delivery_attempt,
  wd.response_status,
  wd.delivery_at
FROM webhook_deliveries wd
JOIN webhook_endpoints we ON we.id = wd.webhook_endpoint_id
WHERE wd.client_id = '00000000-0000-0000-0000-000000000001'
ORDER BY wd.delivery_at DESC
LIMIT 10;
```

### Check Approvals

```sql
SELECT 
  ap.id as approval_id,
  ap.action_id,
  ap.status,
  ap.created_at,
  ap.resolved_at,
  COUNT(aps.id) as total_steps,
  SUM(CASE WHEN aps.status = 'approved' THEN 1 ELSE 0 END) as approved_steps
FROM approvals ap
LEFT JOIN approval_steps aps ON aps.approval_id = ap.id
WHERE ap.client_id = '00000000-0000-0000-0000-000000000001'
GROUP BY ap.id
ORDER BY ap.created_at DESC;
```

---

## Smoke Test Checklist

- [ ] Low-risk action auto-approved and queued
- [ ] Medium-risk action requires approval
- [ ] High-risk action blocked by rule
- [ ] Shadow mode evaluates but doesn't block
- [ ] Approval flow works (approve → execute)
- [ ] Volume-based risk scoring triggers
- [ ] Rule evaluations stored in database
- [ ] Action decisions logged
- [ ] Webhook deliveries recorded
- [ ] Audit trail complete (action_events)

---

## Performance Testing

### Load Test Setup

```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Create test payload file
cat > action_payload.json <<EOF
{
  "action_type": "send_email",
  "payload": {"to": "test@example.com"},
  "requested_by": "load_test",
  "idempotency_key": "load_test_${RANDOM}"
}
EOF

# Run load test (100 requests, 10 concurrent)
ab -n 100 -c 10 -p action_payload.json -T application/json \
  -H "X-API-Key: test_key_12345" \
  -H "X-Client-ID: 00000000-0000-0000-0000-000000000001" \
  http://localhost:3000/api/v1/actions
```

**Target Performance:**
- P50 latency: <200ms
- P95 latency: <500ms
- P99 latency: <1000ms
- Throughput: >100 req/sec (on local dev)

---

## Troubleshooting

### Issue: "Failed to store action"
**Fix:** Check Supabase connection, verify tables exist

### Issue: "Rule evaluation error"
**Fix:** Check rule definitions, ensure `field` uses dot notation correctly

### Issue: "Webhook delivery failed"
**Fix:** Ensure webhook URL is reachable, check signature generation

### Issue: "Approval not triggering"
**Fix:** Check rule result is `REQUIRE_APPROVAL`, verify approval engine is called

---

## Next Steps

1. Add approval decision API endpoint
2. Implement execution queue worker
3. Add webhook retry worker
4. Build dashboard for action monitoring
5. Add notification engine (email/Slack)

---

**Status: Ready for testing**

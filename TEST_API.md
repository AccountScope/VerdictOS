# VerdictOS API — Quick Test Guide

## Step 1: Create Test Client ✅
Run `create_test_client.sql` in Supabase SQL Editor

## Step 2: Test Action Submission

```bash
curl -X POST http://localhost:3000/api/v1/actions \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test_key_12345" \
  -H "X-Client-ID: 00000000-0000-0000-0000-000000000001" \
  -d '{
    "action_type": "send_email",
    "payload": {
      "to": "user@example.com",
      "subject": "Test",
      "body": "Hello World"
    },
    "metadata": {
      "source": "manual_test"
    },
    "requested_by": "test_user"
  }'
```

## Step 3: List Actions

```bash
curl http://localhost:3000/api/v1/actions \
  -H "X-API-Key: test_key_12345" \
  -H "X-Client-ID: 00000000-0000-0000-0000-000000000001"
```

## Step 4: Get Single Action

```bash
# Replace {action_id} with ID from previous response
curl http://localhost:3000/api/v1/actions/{action_id} \
  -H "X-API-Key: test_key_12345" \
  -H "X-Client-ID: 00000000-0000-0000-0000-000000000001"
```

## Step 5: Create a Rule

```bash
curl -X POST http://localhost:3000/api/v1/rules \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test_key_12345" \
  -H "X-Client-ID: 00000000-0000-0000-0000-000000000001" \
  -d '{
    "name": "Block High-Risk Actions",
    "definition": {
      "conditions": [
        {
          "field": "risk_score",
          "operator": "equals",
          "value": "HIGH"
        }
      ],
      "action": "block"
    }
  }'
```

## Step 6: Test Webhook Endpoint

```bash
curl -X POST http://localhost:3000/api/v1/webhooks \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test_key_12345" \
  -H "X-Client-ID: 00000000-0000-0000-0000-000000000001" \
  -d '{
    "url": "https://webhook.site/your-unique-id",
    "description": "Test webhook",
    "secret": "my_webhook_secret"
  }'
```

---

## Expected Response Structure

### Success (200/201):
```json
{
  "success": true,
  "data": { ... }
}
```

### Error (4xx/5xx):
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Action type is required"
  }
}
```

---

## API Endpoints Available

- `POST /api/v1/actions` — Submit new action
- `GET /api/v1/actions` — List actions (paginated)
- `GET /api/v1/actions/:id` — Get single action
- `POST /api/v1/rules` — Create rule
- `GET /api/v1/rules` — List rules
- `POST /api/v1/webhooks` — Register webhook
- `GET /api/v1/health` — Health check

---

## Next Steps

1. Run the test client SQL
2. Try submitting an action
3. Check Supabase tables to see data
4. Test rule evaluation
5. Test webhook delivery

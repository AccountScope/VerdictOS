# API_SPEC.md

## General

- **JSON-only**, Machine-first, deterministic.
- **Versioning:** `/v1/` prefix. All fields explicit; unknown fields tolerated but ignored.
- **Auth:** `Authorization: Bearer <api_key>`, per-tenant scope. All endpoints require.
- **All responses:**
  ```json
  {
    "code": "ERROR_CODE|OK",
    "message": "Human-readable",
    "request_id": "req_xyz",
    "data": { ... }
  }
  ```

## Endpoints

### `/v1/actions`

- `POST`: Create new action request.
  - **Input:**  
    - action_type (string)
    - payload (object)
    - metadata (object, optional)
    - requested_by (string, user/agent)
    - client_id (string, required)
    - idempotency_key (string, required)
  - **Returns:**  
    - action_id (string)
    - status (enum: pending|awaiting_approval|approved|rejected|failed|executed)
    - risk_score (LOW|MEDIUM|HIGH)
    - requires_approval (bool)
    - next_step (object)
    - request_id

- `GET /v1/actions/{action_id}`:  
  - Returns the full action record, including approvals, audit trail.
- `GET /v1/actions`:  
  - List actions (paged: `page` + `limit`), filter by status/type/range.

### `/v1/rules`

- `GET`: List all rules (tenant-scoped)
- `POST`: Create new rule (dynamic, see below)
- `PATCH /{rule_id}`: Update rule
- `DELETE /{rule_id}`: Remove rule

**Rule schema example:**
```json
{
  "rule_id": "rule_abc123",
  "action_type": "refund",
  "condition": "payload.amount <= 10000",
  "auto_approve": true,
  "requires_role": "finance_manager",
  "created_at": "...",
  "updated_at": "..."
}
```

### `/v1/approvals`

- `GET`: List approval tasks (for approvers)
- `GET /{approval_id}`: Get approval details
- `POST /{approval_id}`: Approve/reject action
  - **Input:** `{ "approved": true|false, "comment": "...", "actor": "user_id" }`

### `/v1/audit`

- `GET`: Query audit logs (tenant, date, action_id)
- **Output:**  
  - timestamp, actor, event_type, action_id, approval_id, status, context

### `/v1/webhooks`

- `GET`: List webhook endpoints
- `POST`: Register webhook endpoint
- `DELETE /{webhook_id}`: Remove endpoint

**Webhook Payload (on action execution):**
- All payloads signed with HMAC-SHA256 (`X-VerdictOS-Signature`), using per-tenant secret.
- Includes: action_id, original request, approval outcome, full audit trail.

- **Replay:** Support endpoint to request replay of any `webhook_delivery_id` (with security checks).

### `/v1/keys`

- `GET`: List API keys
- `POST`: Create new API key
- `DELETE /{key_id}`: Delete/revoke

### `/v1/health`
- Simple liveness/readiness (`status: "ok"`, timestamp, version)

## Pagination

- Standard: `?page=1&limit=50`
- Return: `data`, `page`, `limit`, `total`, `has_next`

## Errors

- All errors as:
    ```json
    {
      "code": "RULE_FAILED",
      "message": "Rule xyz not satisfied",
      "request_id": "req_abc",
      "context": { ... }
    }
    ```

## Idempotency

- All create/execute endpoints require `idempotency_key` in body or header.
- Duplicates return same object (`idempotency_records` log all).

## Webhook signing & replay

- All outbound webhooks signed.  
- Replay endpoint requires admin role, logs all attempts.

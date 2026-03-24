# TECH_ARCHITECTURE.md

## Modules

- **API Layer** (Next.js App Router)  
  Route requests, validate shape & auth, marshal to subsystems.
- **Action Engine**
  - Accepts/creates actions, persists and dispatches for evaluation.
  - Ensures idempotency.
- **Rule Engine**
  - Loads rules (tenant-scoped, live-editable) from DB.
  - Evaluates per action with composable logic.
- **Risk Engine**
  - Stateless risk calculator—inputs: action, context, some basic pattern memory.
- **Approval Engine**
  - Assigns needs for approvals, multi-step flows, role chaining, SLA expiry.
  - Writes approval state & events.
- **Execution Engine**
  - Durable, signed webhook dispatcher with delivery logs.
  - Manages retries, replay, idempotency.
- **Audit Engine**
  - Streams all mutating events to immutable logs.
  - All writes append-only, tenant/actor/context-rich.
- **Notification Engine**
  - Triggers webhooks/email based on action/rule states.
- **Security Layer**
  - API Key validation, RLS policy enforcement, tenant boundary checks, rate limiting.
- **Dashboard (Out-of-Scope for API Draft)**
  - Admin UI, not detailed here.

## Request Flow

1. **`POST /v1/actions`:**  
   Auth → Validate payload & idempotency → Store action → Rule/risk/approval evaluation → Respond (action_id, status, next steps)

2. **Rule & Risk:**  
   DB fetch rules → Evaluate → Risk assignment → Approval path triggered if needed

3. **Approval:**  
   If approval required, new approval record(s) created. Approval state machine drives flow until executed or terminal.

4. **Execution:**  
   On approval, push to outbound webhook queue. Execution engine signs, delivers, logs, retries.

5. **Audit:**  
   Every event/action/state change is logged to `audit_logs` immediately.

6. **Notifications:**  
   Notification engine triggers, propagates via email/webhook per tenant config.

## Sequence Diagrams (Text)

### Action Creation & Execution

```
[Client] -> [API]: POST /v1/actions
[API] -> [Action Engine]: create action, check idempotency
[Action Engine] -> [Rule Engine]: evaluate rules
[Rule Engine] -> [Risk Engine]: get risk score
[Risk Engine] -> [Rule Engine]: risk-based flow returned
[Rule Engine] -> [Approval Engine]: approval needed?
[Approval Engine] -> [Execution Engine]: if auto-approved, proceed to execution
[Approval/Execution Engine] -> [Audit Engine]: log all events/states
[Execution Engine] -> [Webhook Endpoint]: send signed webhook
[Webhook Endpoint] -> [Execution Engine]: ack/fail
[Execution Engine] -> [Audit Engine]: log delivery, status
```

### Approval Flow

```
[Approver] -> [API]: POST /v1/approvals/{approval_id}
[API] -> [Approval Engine]: update approval state
[Approval Engine] -> [Execution Engine]: if approved, execute
[Approval Engine] -> [Audit Engine]: log approval event
```

## Failure, Timeout & Retry Handling

- **API Surface:** All errors with explicit code, message, request_id.
- **Idempotency:** Idempotency keys required for action creation, execution/webhook delivery.
- **Rule/Eval/DB:** On evaluation error, action set to terminal `failed` state (audited); no silent drops.
- **Webhook Delivery:** Retries with exponential backoff (configurable, default 5 attempts). All attempts logged. Replay prevented via signature + nonce checking.
- **Timeouts:** Approval records include SLA expiry and will auto-fail/expire with clear status.
- **Audit:** Unexpected failures never lost—logged with context & trace IDs for forensics.

## Correlation IDs

- Every inbound request receives a unique `request_id` (UUIDv7), propagated through all logs, events, audit entries, and notification/webhook payloads.
- Child objects (actions, approvals, deliveries) inherit/request_id for tracing.

## Observability

- **Structured logs** (JSON, `action_id`/`request_id` included)
- **Metrics:** Actions by status, rule eval durations, webhook delivery stats (success, failure, retries)
- **Audit Logs:** All state transitions, user/role changes, config edits, API key usage, error events.
- **Webhook Debugging:** Detailed delivery logs (status, attempts, signatures, payload snapshot, receiver response).

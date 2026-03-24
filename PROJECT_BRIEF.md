# VerdictOS API — Project Brief

**Company:** VerdictOS (Standalone SaaS)  
**Tagline:** The Control Layer For AI Actions  
**Category:** AI Action Governance Infrastructure  
**Positioning:** £100M+ infrastructure company from day one

---

## Core Philosophy

**AI can suggest actions. VerdictOS decides:**
- Whether an action is allowed
- Whether it needs approval
- Who should approve it
- How risky it is
- What gets logged
- What gets executed
- How failures are handled

---

## Product Vision

VerdictOS sits between:
- AI agents
- Copilots
- Automation systems
- Business applications
- Real-world execution

**Market Standard:** Beat everything by being more focused, enterprise-grade, audit-ready, API-native, reliable, governance-centric, and scalable.

**Must NOT feel like:** Zapier with approvals, lightweight workflow toy, prompt wrapper, generic automation dashboard

**Must feel like:** Real infrastructure, control plane, governance engine, audit-grade action system, future standard for AI execution safety

---

## Target Use Cases

- AI-triggered refunds
- AI-sent emails
- AI approvals/rejections
- AI-generated compliance actions
- AI-triggered account changes
- AI-initiated transfers or financial workflows
- Agent-to-agent execution requests
- Human-in-the-loop action routing
- Policy-based automated approvals

---

## Core System Modules

### 1. Action Engine
**Primary endpoint:** `POST /v1/actions`

**Inputs:**
- action_type
- payload (JSON)
- metadata
- requested_by (agent/user/system)
- client_id
- idempotency_key

**Outputs:**
- action_id
- status
- risk_score
- requires_approval
- next_step metadata

### 2. Rule Engine (Core Differentiator)
Dynamic, database-driven rules:
- Auto-approve under threshold
- Require human approval over threshold
- Escalate based on risk
- Route to specific approver roles
- Block forbidden action types
- Trigger conditional execution paths

**Must be:** Dynamic, database-driven, real-time evaluated, composable, future-ready for policy templates

### 3. Risk Engine
Returns: LOW | MEDIUM | HIGH

**Considers:**
- Action type
- Payload shape/content
- Amount/value
- Requester type
- Rule context
- Basic historical patterns

### 4. Approval Engine
**States:** pending, approved, rejected, escalated, expired, failed, executed

**Features:**
- Single/multi-step approvals
- Role-based approvals
- Approval comments
- SLA timers
- Approval expiration
- Escalation routing

### 5. Execution Engine
Signed webhook-based execution with:
- Signed payloads
- Replay protection
- Retries
- Idempotent delivery design
- Delivery logging
- Failure handling
- Clear status transitions

### 6. Audit Engine (Major Differentiator)
**Logs everything:**
- Who/what requested it
- Original payload snapshot
- Evaluated rules
- Risk score
- Approval decision(s)
- Timestamps
- Execution outcome
- Decision comments/reasons
- Status transitions

**Requirements:** Immutable/append-only, queryable, exportable, enterprise-grade, compliance-ready

### 7. Notification Engine
**Initial support:**
- Email
- Webhook callbacks

**Future expansion:** Slack, WhatsApp, SMS, internal dashboards, escalation notifications

### 8. Security Layer
- API key auth
- Strict tenant isolation
- RLS-safe patterns
- Signed webhooks
- Replay attack protection
- Payload validation
- Safe secret handling
- Rate limiting foundations
- Secure audit visibility boundaries

### 9. Dashboard
Premium admin experience:
- Action list
- Action detail view
- Approve/reject interface
- Rule management
- Audit log browsing
- Basic webhook/notification visibility
- API key management

**Must feel:** Enterprise-grade, premium, operationally clear, uncluttered, trusted

---

## API Design Requirements

**All endpoints must be:**
- JSON-only
- Versioned
- Deterministic
- Documented cleanly
- Easy for developers to integrate
- Built for machine-to-machine usage

**Core route families:**
- `/v1/actions`
- `/v1/rules`
- `/v1/approvals`
- `/v1/audit`
- `/v1/webhooks`
- `/v1/keys`
- `/v1/health`

**Error format:**
```json
{
  "code": "ACTION_REJECTED",
  "message": "Action rejected by rule R-123",
  "request_id": "req_abc123",
  "context": {}
}
```

---

## Database / Data Model

**Core tables:**
- clients
- api_keys
- actions
- action_events
- rules
- rule_evaluations
- approvals
- approval_steps
- audit_logs
- webhook_endpoints
- webhook_deliveries
- notifications
- idempotency_records

---

## Technical Stack

**Baseline:**
- Next.js for application/API surfaces
- Supabase/Postgres with RLS
- Queue/background processing
- Signed webhooks
- Strong auth and tenant isolation
- Modular services

**Architecture principles:**
- API-first, UI-second
- Deterministic
- Composable
- Observable
- Secure by default
- Versioned from day one
- Built for scale (millions of actions/day)
- No silent failure paths

---

## MVP Success Criteria

**Minimum end-to-end flow:**
1. Create action
2. Evaluate rules
3. Assign risk
4. Determine approval need
5. Approve or reject
6. Trigger signed webhook on approved execution path
7. Record full audit trail
8. Expose action status and history cleanly

**Must verify:**
- Action creation works reliably
- Rule engine evaluates correctly
- Risk engine returns stable outputs
- Approval flow works end-to-end
- Execution webhook fires safely
- Audit logs are complete and trustworthy
- Tenant isolation is sound
- Dashboard is usable and premium
- Architecture is clean enough to scale hard

---

## Integration with Ecosystem

VerdictOS is **standalone** but easy to integrate with other products.

**Example flow:**
1. AccountScope detects high-risk anomaly
2. AccountScope sends action request into VerdictOS
3. VerdictOS evaluates rules and risk
4. VerdictOS routes for approval
5. VerdictOS logs full trail
6. VerdictOS triggers downstream action after approval

**VerdictOS becomes the control plane across the ecosystem.**

---

## Future-Ready Differentiators

Design architecture to cleanly add later:
- Programmable policies
- Compliance templates by industry
- Agent-to-agent approvals
- Adaptive risk models
- Approval delegation
- Emergency kill switches
- Action replay/reversal support
- Sandbox/test environments
- Richer identity/role systems
- Enterprise SSO
- Region-aware controls

---

## Build Standard

**Optimize for:**
- Trust
- Control
- Scalability
- Clarity
- Auditability
- Future dominance

**Do NOT:**
- Cut corners
- Optimize for quick hacks
- Build like a generic automation tool

**Report completion only when:**
- Full end-to-end flows are tested
- Audit logs are verified
- Rule evaluation is stable
- Security basics are in place
- Webhook execution is reliable
- Product feels enterprise-ready at MVP stage

---

## Timeline & Priority

**Build duration:** 4-6 weeks for production-ready MVP  
**Priority:** Takes priority over LEXORA and GLOWDROP  
**Start date:** 2026-03-24  
**Status:** Kickoff — channels created, architecture phase starting

---

**Source:** `/data/.openclaw/media/inbound/29a61c61-ca36-4b43-867c-2ce2f0b41521.txt`  
**Created:** 2026-03-24 00:43 UTC

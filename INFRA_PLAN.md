# INFRA_PLAN.md

## Stack

- **Next.js (App Router, API routes)**
- **Supabase/Postgres (with RLS for tenant isolation)**
- **Queue/Workers:** (e.g., Supabase Functions or queue service for webhook retries, long work)
- **Typed, signed webhooks:** (HMAC-SHA256, per-tenant secret)

## Environments

- **Development:** Local, personal Supabase project, .env with local secrets, permissive rate limits.
- **Staging:** Mirror prod infra, gated access, synthetic client data. Runs pre-prod verification.
- **Production:** Strict RLS, locked secrets, high-rate/scale config, full observability/alerting.

## Multi-Tenancy

- All keys, actions, rules, logs, endpoints tenant-scoped
- Enforced at DB (RLS), service (key scoping), API
- No global access patterns

## Rate Limiting

- Global per-tenant and per-key limits at API gateway / middleware (e.g., 1000 req/min)
- Burst controls on async jobs (queue depth/speed)

## Secrets

- All secrets (API keys, webhook secrets) encrypted-at-rest (Supabase), never logged
- Signing keys rotated via `/v1/keys`
- Use ENV for system secrets

## Deployment

- **Per-environment config via env vars**
- **Automated deploys:** e.g., Vercel for Next.js, linked to Git main branch, env protections
- **Migrations:** Managed via Supabase migrations
- **Backups:** Automated DB snapshots
- **Monitoring:** Use Supabase monitoring, custom webhooks to incident channels

## MVP Data Model

- **DB Tables:** As per brief (actions, rules, approvals, audit_logs, webhook_endpoints, idempotency_records, etc.)
- **RLS:** Policies per-tenant for all sensitive entities

## Webhook Delivery

- Durable queue (db table or queue infra)
- Workers for retry/backoff (configurable)
- Comprehensive delivery status, logs, signatures, replay command

## Key Risks

- **Rules Complexity:** Custom/rich rules risk instability or edge bugs.
- **Async Delivery Reliability:** Webhook signing/retry must be bulletproof; execution reliability critical for trust.
- **Tenant Isolation:** Bad RLS policy exposes data; every DB query must be RLS-safe.
- **Scale:** Write-heavy logs and high action volume—validate that MVP DB, queues, and logging infra handle expected load.
- **Idempotency:** Needs thorough enforcement on all mutating endpoints.

## Day 1–3 Engineering Tasks

1. **Bootstrap Next.js App Router API skeleton.**
2. **Design initial DB schema (tables, RLS policies, MVP fields).**
3. **Implement POST /v1/actions (with idempotency & stubbed action flow).**
4. **API key logic, per-request authentication, and request_id propagation.**
5. **Unit test: basic action → rule eval → risk assign → audit log.**

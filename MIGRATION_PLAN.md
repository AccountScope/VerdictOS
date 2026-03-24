# MIGRATION_PLAN.md

## Initial Migration Order

1. `clients`
2. `api_keys`
3. All core domain tables in dependency order:
    - `actions`  
    - `rules`  
    - `approvals`  
    - `approval_steps`  
    - `rule_evaluations`  
    - `action_events`  
    - `audit_logs`  
    - `webhook_endpoints`
4. `webhook_deliveries`, `notifications`, `idempotency_keys`, `correlation_ids`

## Rollback Plan

- **DDL (table creation):** Drop tables in reverse dependency order
- **Schema changes:** Use transactional DDL where possible; always have tested downgrade scripts for major changes
- **Data:** Seed table deletions with cascade, respecting FK dependencies

## Seed Data

- Minimal seed, just enough to bootstrap the system:
    - Insert 1 client (test tenant)
    - Insert 1 API key for the test client (key_hash only)
    - Insert example rule definitions (e.g., always-approve baseline)
    - Insert system user/approver for approvals

## Notes & Recommendations

- All tables with `client_id`: Default queries should scope by client at the DB level using RLS
- Soft-delete: Use `deleted_at IS NULL` in queries, enforce by partial index
- Immutability: `audit_logs` and `action_events` must be append-only
- Idempotency and correlation: Use composite unique keys and check constraint indexes
- Pagination: Always prefer `(created_at, id)` for stable, keyset pagination
- Webhook deliveries: Each delivery has its own idempotency key + delivery_attempt
- Never store secrets unencrypted; key_hash and webhook secrets should be hashed at app level

---

**Schema is future-proofed for scale, audit, and tenant safety.** For questions on further extensibility or deep compliance modes, request out-of-band architecture review.

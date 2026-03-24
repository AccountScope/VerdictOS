-- Multi-tenant normalized schema for VerdictOS (Postgres)
-- Fixed: Removed circular FK dependencies, will add them after all tables exist

-- 1. Clients (tenants)
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 2. API Keys
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id),
    key_hash TEXT NOT NULL,
    name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_used TIMESTAMPTZ,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT unique_client_keys UNIQUE (client_id, key_hash)
);

-- 3. Actions (without approval FK for now)
CREATE TABLE actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id),
    action_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    metadata JSONB,
    requested_by TEXT,
    idempotency_key TEXT NOT NULL,
    status TEXT NOT NULL,
    risk_score TEXT,
    requires_approval BOOLEAN DEFAULT FALSE,
    current_approval_id UUID, -- FK added later
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT unique_idempotency_key UNIQUE (client_id, idempotency_key),
    CONSTRAINT fk_client FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- 4. Action Events
CREATE TABLE action_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_id UUID REFERENCES actions(id),
    client_id UUID REFERENCES clients(id),
    event_type TEXT NOT NULL,
    event_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    actor TEXT,
    snapshot JSONB,
    CONSTRAINT fk_action FOREIGN KEY (action_id) REFERENCES actions(id),
    CONSTRAINT fk_client FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- 5. Rules
CREATE TABLE rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id),
    name TEXT NOT NULL,
    definition JSONB NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

-- 6. Rule Evaluations
CREATE TABLE rule_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_id UUID REFERENCES actions(id),
    client_id UUID REFERENCES clients(id),
    rule_id UUID REFERENCES rules(id),
    result TEXT NOT NULL,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    context JSONB
);

-- 7. Approvals
CREATE TABLE approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_id UUID REFERENCES actions(id),
    client_id UUID REFERENCES clients(id),
    status TEXT NOT NULL,
    requires_all_steps BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

-- 8. Approval Steps
CREATE TABLE approval_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    approval_id UUID REFERENCES approvals(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id),
    step_order INT NOT NULL,
    role_required TEXT,
    approver TEXT,
    status TEXT NOT NULL,
    decision_comment TEXT,
    decided_at TIMESTAMPTZ,
    sla_expires_at TIMESTAMPTZ
);

-- 9. Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id),
    record_type TEXT NOT NULL,
    record_id UUID NOT NULL,
    payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    actor TEXT NOT NULL,
    action_snapshot JSONB,
    CONSTRAINT must_be_immutable CHECK (true)
);

-- 10. Webhook Endpoints
CREATE TABLE webhook_endpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id),
    url TEXT NOT NULL,
    secret TEXT,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_used TIMESTAMPTZ
);

-- 11. Webhook Deliveries
CREATE TABLE webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_endpoint_id UUID REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id),
    action_id UUID,
    delivery_status TEXT NOT NULL,
    delivery_attempt INT NOT NULL DEFAULT 1,
    response_status INT,
    response_body TEXT,
    delivery_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    idempotency_key TEXT,
    CONSTRAINT unique_webhook_delivery UNIQUE (webhook_endpoint_id, idempotency_key, delivery_attempt)
);

-- 12. Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id),
    recipient TEXT,
    channel TEXT,
    subject TEXT,
    message TEXT,
    sent_at TIMESTAMPTZ,
    delivery_status TEXT NOT NULL DEFAULT 'pending'
);

-- 13. Idempotency Keys
CREATE TABLE idempotency_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id),
    key TEXT NOT NULL,
    context JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    CONSTRAINT unique_idem_key_per_client UNIQUE (client_id, key)
);

-- 14. Correlation IDs
CREATE TABLE correlation_ids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id),
    correlation_id TEXT NOT NULL,
    related_table TEXT,
    related_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_corr_id_per_client UNIQUE (client_id, correlation_id)
);

-- Now add the circular FK constraint
ALTER TABLE actions
ADD CONSTRAINT fk_current_approval
FOREIGN KEY (current_approval_id) REFERENCES approvals(id);

-- High-volume + partial indexes for scale and speed

-- Always-indexed fields
CREATE INDEX idx_actions_client_created_at ON actions (client_id, created_at, id);
CREATE INDEX idx_action_events_action_id ON action_events (action_id, created_at);
CREATE INDEX idx_rules_client_id ON rules (client_id, is_active);
CREATE INDEX idx_approvals_action_id ON approvals (action_id, status);
CREATE INDEX idx_approval_steps_approval_id_order ON approval_steps (approval_id, step_order);

-- Soft-delete pattern — filter out deleted rows by default
CREATE INDEX idx_actions_not_deleted ON actions (client_id, deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_rules_not_deleted ON rules (client_id, deleted_at) WHERE deleted_at IS NULL;

-- Webhook and idempotency
CREATE UNIQUE INDEX idx_webhook_deliveries_idem ON webhook_deliveries (webhook_endpoint_id, idempotency_key, delivery_attempt);

-- Idempotency
CREATE UNIQUE INDEX idx_actions_idempotency ON actions (client_id, idempotency_key);
CREATE UNIQUE INDEX idx_idempotency_keys_per_client ON idempotency_keys (client_id, key);

-- Notifications/channel
CREATE INDEX idx_notifications_client_status ON notifications (client_id, delivery_status);

-- Audit/log scale
CREATE INDEX idx_audit_logs_client_type_created ON audit_logs (client_id, record_type, created_at);

-- Foreign keys (where not PK)
CREATE INDEX idx_action_events_client_id ON action_events (client_id);
CREATE INDEX idx_approval_steps_client_id ON approval_steps (client_id);

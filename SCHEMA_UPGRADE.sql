-- Schema Upgrade for VerdictOS Control Loop
-- Adds execution control, shadow mode, and missing fields
-- Run this AFTER DATA_MODEL_FIXED.sql

-- 1. Add execution control fields to actions table
ALTER TABLE actions
ADD COLUMN execution_status TEXT DEFAULT 'not_started' CHECK (execution_status IN ('not_started', 'queued', 'executing', 'succeeded', 'failed', 'blocked', 'cancelled')),
ADD COLUMN executed_at TIMESTAMPTZ,
ADD COLUMN execution_result JSONB,
ADD COLUMN execution_error TEXT,
ADD COLUMN blocked_reason TEXT,
ADD COLUMN decision_context JSONB;

-- Update status constraint to include all states
ALTER TABLE actions DROP CONSTRAINT IF EXISTS actions_status_check;
ALTER TABLE actions ADD CONSTRAINT actions_status_check 
CHECK (status IN ('pending', 'evaluating', 'pending_approval', 'approved', 'rejected', 'blocked', 'executed', 'failed', 'cancelled'));

-- 2. Add shadow mode to clients table
ALTER TABLE clients
ADD COLUMN shadow_mode BOOLEAN DEFAULT FALSE,
ADD COLUMN settings JSONB DEFAULT '{}'::jsonb;

-- 3. Add missing fields to rule_evaluations
ALTER TABLE rule_evaluations
ADD COLUMN triggered BOOLEAN DEFAULT FALSE,
ADD COLUMN reasons JSONB,
ADD COLUMN recommendation TEXT;

-- 4. Add structured risk output to actions
ALTER TABLE actions
ADD COLUMN risk_reasons JSONB,
ADD COLUMN risk_recommendation TEXT;

-- 5. Add notification payload to approvals
ALTER TABLE approvals
ADD COLUMN notification_payload JSONB,
ADD COLUMN notification_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN sla_deadline TIMESTAMPTZ;

-- 6. Add retry tracking to webhook_deliveries
ALTER TABLE webhook_deliveries
ADD COLUMN next_retry_at TIMESTAMPTZ,
ADD COLUMN max_retries INT DEFAULT 5,
ADD COLUMN error_message TEXT;

-- 7. Create index for execution queue (performance)
CREATE INDEX idx_actions_execution_queue ON actions(execution_status, created_at)
WHERE execution_status = 'queued' AND deleted_at IS NULL;

-- 8. Create index for pending approvals (performance)
CREATE INDEX idx_approvals_pending ON approvals(status, created_at)
WHERE status = 'pending';

-- 9. Create index for webhook delivery retries
CREATE INDEX idx_webhook_retries ON webhook_deliveries(next_retry_at)
WHERE delivery_status = 'pending' AND next_retry_at IS NOT NULL;

-- 10. Add action decision log table (for shadow mode comparison)
CREATE TABLE action_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_id UUID REFERENCES actions(id),
    client_id UUID REFERENCES clients(id),
    decision_mode TEXT NOT NULL CHECK (decision_mode IN ('live', 'shadow')),
    risk_score TEXT NOT NULL,
    risk_reasons JSONB,
    rule_results JSONB,  -- Array of {rule_id, result, triggered, reasons}
    final_decision TEXT NOT NULL CHECK (final_decision IN ('ALLOW', 'BLOCK', 'REQUIRE_APPROVAL')),
    decision_reasons JSONB,
    decided_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_action FOREIGN KEY (action_id) REFERENCES actions(id),
    CONSTRAINT fk_client FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE INDEX idx_action_decisions_comparison ON action_decisions(action_id, decision_mode);

-- 11. Add comments for clarity
COMMENT ON COLUMN actions.execution_status IS 'Tracks execution lifecycle: not_started → queued → executing → succeeded/failed/blocked';
COMMENT ON COLUMN actions.status IS 'Tracks approval lifecycle: pending → evaluating → pending_approval → approved/rejected/blocked';
COMMENT ON COLUMN clients.shadow_mode IS 'If true, evaluate rules but do not block actions (testing mode)';
COMMENT ON TABLE action_decisions IS 'Logs all decision outputs for shadow mode comparison and audit trail';

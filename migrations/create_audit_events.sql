-- Audit Events Table
CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  action_id UUID REFERENCES actions(id) ON DELETE SET NULL,
  approval_id UUID REFERENCES approvals(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  actor VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_events_client ON audit_events(client_id);
CREATE INDEX idx_audit_events_action ON audit_events(action_id);
CREATE INDEX idx_audit_events_type ON audit_events(event_type);
CREATE INDEX idx_audit_events_created ON audit_events(created_at DESC);

COMMENT ON TABLE audit_events IS 'Audit trail for all action lifecycle events';
COMMENT ON COLUMN audit_events.event_type IS 'action.created, action.allowed, action.blocked, action.approval_required, approval.approved, approval.rejected, etc.';

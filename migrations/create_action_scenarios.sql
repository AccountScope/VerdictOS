-- Action Scenarios Table
-- Stores custom scenario templates for clients

CREATE TABLE IF NOT EXISTS action_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  scenario_id VARCHAR(100) NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  industry VARCHAR(50),
  pattern JSONB NOT NULL,
  auto_approve BOOLEAN DEFAULT false,
  approval_rules JSONB DEFAULT '{}',
  enabled BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  created_by VARCHAR(255),
  UNIQUE(client_id, scenario_id)
);

CREATE INDEX idx_scenarios_client ON action_scenarios(client_id);
CREATE INDEX idx_scenarios_industry ON action_scenarios(industry);
CREATE INDEX idx_scenarios_enabled ON action_scenarios(enabled) WHERE enabled = true;

COMMENT ON TABLE action_scenarios IS 'Pre-defined action scenarios for auto-approval and custom workflows';
COMMENT ON COLUMN action_scenarios.pattern IS 'JSON pattern for matching actions (action_type + conditions)';
COMMENT ON COLUMN action_scenarios.approval_rules IS 'JSON rules for approval workflow (approvers, chains, timeouts)';
COMMENT ON COLUMN action_scenarios.usage_count IS 'Number of times this scenario has been matched';

-- Enable RLS for all tenant tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE correlation_ids ENABLE ROW LEVEL SECURITY;

-- Sample: Only allow access to rows for the session's client_id
-- (Assume always set: `set session.client_id = '...'`)
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    AND tablename IN ('api_keys','actions','action_events','rules','rule_evaluations','approvals','approval_steps','audit_logs','webhook_endpoints','webhook_deliveries','notifications','idempotency_keys','correlation_ids')
  LOOP
    EXECUTE format($f$ CREATE POLICY tenant_isolation ON %I
      USING (client_id::text = current_setting('session.client_id', true))
    $f$, t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
  END LOOP;
END$$;

-- For clients table, restrict to their own record only
CREATE POLICY self_view ON clients
  USING (id::text = current_setting('session.client_id', true));
ALTER TABLE clients FORCE ROW LEVEL SECURITY;

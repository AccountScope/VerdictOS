# VerdictOS Database Migrations

## Required Migrations (Phase 1)

Run these in Supabase SQL Editor (https://supabase.com/dashboard/project/jazrnbmhppwiuezjnlnf/sql/new):

### 1. Audit Events Table

```sql
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
```

### 2. Approval Tokens Table

```sql
CREATE TABLE IF NOT EXISTS approval_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_id UUID NOT NULL REFERENCES approvals(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_approval_tokens_approval ON approval_tokens(approval_id);
CREATE INDEX idx_approval_tokens_hash ON approval_tokens(token_hash);
CREATE INDEX idx_approval_tokens_expires ON approval_tokens(expires_at);

COMMENT ON TABLE approval_tokens IS 'Secure tokens for approval links (hashed, expirable, single-use)';
```

### 3. Client Region & Industry

```sql
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS region VARCHAR(10) DEFAULT 'US' CHECK (region IN ('US', 'UK', 'EU'));

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS industry VARCHAR(50);

-- Update test client
UPDATE clients 
SET region = 'US', industry = 'fintech'
WHERE id = '00000000-0000-0000-0000-000000000001';
```

---

## Verification

After running migrations, verify:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('audit_events', 'approval_tokens');

-- Check client columns
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'clients' AND column_name IN ('region', 'industry');

-- Test insert
INSERT INTO audit_events (client_id, event_type, event_data, actor)
VALUES ('00000000-0000-0000-0000-000000000001', 'test.migration', '{"test": true}', 'system');

SELECT * FROM audit_events WHERE event_type = 'test.migration';
```

---

## Rollback (if needed)

```sql
DROP TABLE IF EXISTS audit_events CASCADE;
DROP TABLE IF EXISTS approval_tokens CASCADE;
ALTER TABLE clients DROP COLUMN IF EXISTS region;
ALTER TABLE clients DROP COLUMN IF EXISTS industry;
```

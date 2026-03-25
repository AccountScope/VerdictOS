-- Approval Tokens Table
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
COMMENT ON COLUMN approval_tokens.token_hash IS 'SHA-256 hash of the approval token';
COMMENT ON COLUMN approval_tokens.used_at IS 'Timestamp when token was consumed (prevents reuse)';

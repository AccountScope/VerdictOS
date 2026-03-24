-- Create test client
INSERT INTO clients (id, name, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'Test Client', true)
RETURNING *;

-- Create test API key (hash of "test_key_12345")
INSERT INTO api_keys (client_id, key_hash, name)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'e99a18c428cb38d5f260853678922e03', -- MD5 hash for demo
  'Test API Key'
)
RETURNING *;

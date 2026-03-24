-- Update the test API key with correct hash
UPDATE api_keys 
SET key_hash = '8cd8988fae32162c373a076eefeb9401'
WHERE client_id = '00000000-0000-0000-0000-000000000001';

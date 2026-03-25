-- Add region column to clients table
ALTER TABLE clients 
ADD COLUMN region VARCHAR(10) DEFAULT 'US' CHECK (region IN ('US', 'UK', 'EU'));

-- Add industry column if not exists
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS industry VARCHAR(50);

-- Update existing test client
UPDATE clients 
SET region = 'US', industry = 'fintech'
WHERE id = '00000000-0000-0000-0000-000000000001';

COMMENT ON COLUMN clients.region IS 'Client region for compliance: US, UK, EU';
COMMENT ON COLUMN clients.industry IS 'Client industry: fintech, healthcare, legal';

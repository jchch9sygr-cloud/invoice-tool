-- Add archive columns to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- Add archive columns to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster archive queries
CREATE INDEX IF NOT EXISTS idx_documents_is_archived ON documents(is_archived);
CREATE INDEX IF NOT EXISTS idx_customers_is_archived ON customers(is_archived);

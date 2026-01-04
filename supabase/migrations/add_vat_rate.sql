-- Migration: Add new columns to documents table
-- Run this in Supabase SQL Editor to update existing database

-- Add vat_rate column
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS vat_rate DECIMAL(5,2) DEFAULT 20;

-- Add location column
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS location TEXT;

-- Add introduction_text column
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS introduction_text TEXT;

-- Update existing documents to have 20% VAT as default
UPDATE documents
SET vat_rate = 20
WHERE vat_rate IS NULL;

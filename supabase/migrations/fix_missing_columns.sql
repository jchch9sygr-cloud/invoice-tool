-- Migration: Fehlende Spalten hinzufügen
-- Führe dieses SQL in Supabase SQL Editor aus

-- 1. sender_name zu documents
ALTER TABLE documents ADD COLUMN IF NOT EXISTS sender_name TEXT;

-- 2. Subscription-Spalten für Kündigung
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- 3. Kleinunternehmer Standard auf false setzen (für neue Einträge)
ALTER TABLE profiles ALTER COLUMN is_kleinunternehmer SET DEFAULT false;

-- 4. Bestehende Profile auf false setzen (optional - nur wenn gewünscht)
-- UPDATE profiles SET is_kleinunternehmer = false WHERE is_kleinunternehmer IS NULL;

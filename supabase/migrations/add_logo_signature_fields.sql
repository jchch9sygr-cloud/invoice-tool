-- ============================================
-- KOMPLETTE MIGRATION - Einfach kopieren und ausführen
-- ============================================

-- 1. PROFILES: Neue Spalten hinzufügen
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS logo_size INTEGER DEFAULT 60;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS signature_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS signature_size INTEGER DEFAULT 50;

-- 2. SUBSCRIPTIONS: Erst Daten updaten, dann Constraint ändern
-- Alle 'lifetime' zu 'yearly' konvertieren
UPDATE subscriptions SET plan = 'yearly' WHERE plan = 'lifetime';

-- Alten Constraint löschen
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;

-- Neuen Constraint erstellen
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_check
  CHECK (plan IN ('free', 'yearly', 'monthly'));

-- 3. STORAGE: Signatures Bucket erstellen
INSERT INTO storage.buckets (id, name, public)
VALUES ('signatures', 'signatures', true)
ON CONFLICT (id) DO NOTHING;

-- 4. STORAGE POLICIES: Für Signatures
-- Erst alle alten Policies löschen (falls vorhanden)
DROP POLICY IF EXISTS "Users can upload own signature" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view signatures" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own signature" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own signature" ON storage.objects;

-- Neue Policies erstellen
CREATE POLICY "Users can upload own signature"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'signatures' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view signatures"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'signatures');

CREATE POLICY "Users can update own signature"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'signatures' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own signature"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'signatures' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================
-- FERTIG!
-- ============================================

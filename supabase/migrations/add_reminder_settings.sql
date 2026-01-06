-- Add reminder interval settings to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reminder_days_first INTEGER DEFAULT 7;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reminder_days_second INTEGER DEFAULT 14;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reminder_days_third INTEGER DEFAULT 14;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reminder_days_final INTEGER DEFAULT 7;

COMMENT ON COLUMN profiles.reminder_days_first IS 'Tage nach Fälligkeit bis zur Zahlungserinnerung';
COMMENT ON COLUMN profiles.reminder_days_second IS 'Tage nach Zahlungserinnerung bis zur 1. Mahnung';
COMMENT ON COLUMN profiles.reminder_days_third IS 'Tage nach 1. Mahnung bis zur 2. Mahnung';
COMMENT ON COLUMN profiles.reminder_days_final IS 'Tage nach 2. Mahnung bis zur letzten Mahnung';

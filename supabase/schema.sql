-- RechnungsBlitz Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  company_name TEXT,
  address TEXT,
  city TEXT,
  zip TEXT,
  phone TEXT,
  email TEXT,
  tax_number TEXT,
  logo_url TEXT,
  is_kleinunternehmer BOOLEAN DEFAULT true,
  bank_name TEXT,
  iban TEXT,
  bic TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  company TEXT,
  address TEXT,
  city TEXT,
  zip TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents (invoices & quotes)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('invoice', 'quote')),
  number TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'cancelled')),
  notes TEXT,
  vat_rate DECIMAL(5,2) DEFAULT 20,
  location TEXT,
  introduction_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Line items
CREATE TABLE line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1,
  unit TEXT DEFAULT 'Stück',
  unit_price DECIMAL(10,2) NOT NULL,
  position INTEGER DEFAULT 0
);

-- Subscriptions (for Stripe)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'lifetime', 'monthly')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  documents_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_customer_id ON documents(customer_id);
CREATE INDEX idx_line_items_document_id ON line_items(document_id);

-- Function to auto-create profile and subscription on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, email)
  VALUES (NEW.id, NEW.email);

  INSERT INTO subscriptions (user_id, plan, status, documents_count)
  VALUES (NEW.id, 'free', 'active', 0);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update documents_count
CREATE OR REPLACE FUNCTION update_documents_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE subscriptions
    SET documents_count = documents_count + 1
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to count documents
CREATE OR REPLACE TRIGGER on_document_created
  AFTER INSERT ON documents
  FOR EACH ROW EXECUTE FUNCTION update_documents_count();

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Customers policies
CREATE POLICY "Users can view own customers"
  ON customers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own customers"
  ON customers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own customers"
  ON customers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own customers"
  ON customers FOR DELETE
  USING (auth.uid() = user_id);

-- Documents policies
CREATE POLICY "Users can view own documents"
  ON documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own documents"
  ON documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
  ON documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON documents FOR DELETE
  USING (auth.uid() = user_id);

-- Line items policies (through documents)
CREATE POLICY "Users can view own line items"
  ON line_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id = line_items.document_id
    AND documents.user_id = auth.uid()
  ));

CREATE POLICY "Users can create line items for own documents"
  ON line_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id = line_items.document_id
    AND documents.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own line items"
  ON line_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id = line_items.document_id
    AND documents.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own line items"
  ON line_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id = line_items.document_id
    AND documents.user_id = auth.uid()
  ));

-- Subscriptions policies
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Storage bucket for logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT DO NOTHING;

-- Storage policy for logos
CREATE POLICY "Users can upload own logo"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'logos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'logos');

CREATE POLICY "Users can update own logo"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'logos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own logo"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'logos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

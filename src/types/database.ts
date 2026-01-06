export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  company_name: string | null;
  address: string | null;
  city: string | null;
  zip: string | null;
  phone: string | null;
  email: string | null;
  tax_number: string | null;
  logo_url: string | null;
  logo_size: number | null; // Höhe in Pixel (40-120)
  signature_url: string | null;
  signature_size: number | null; // Höhe in Pixel (30-80)
  is_kleinunternehmer: boolean;
  allow_paid_invoice_deletion: boolean;
  bank_name: string | null;
  iban: string | null;
  bic: string | null;
  // Mahnwesen Intervalle (in Tagen)
  reminder_days_first: number | null; // Tage nach Fälligkeit bis Zahlungserinnerung
  reminder_days_second: number | null; // Tage nach Erinnerung bis 1. Mahnung
  reminder_days_third: number | null; // Tage nach 1. Mahnung bis 2. Mahnung
  reminder_days_final: number | null; // Tage nach 2. Mahnung bis letzte Mahnung
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  user_id: string;
  name: string;
  company: string | null;
  address: string | null;
  city: string | null;
  zip: string | null;
  email: string | null;
  created_at: string;
}

export type DocumentType = 'invoice' | 'quote';
export type DocumentStatus = 'draft' | 'sent' | 'paid' | 'cancelled';

export interface ProfileSnapshot {
  company_name: string | null;
  address: string | null;
  city: string | null;
  zip: string | null;
  phone: string | null;
  email: string | null;
  tax_number: string | null;
  logo_url: string | null;
  logo_size: number | null;
  signature_url: string | null;
  signature_size: number | null;
  is_kleinunternehmer: boolean;
  bank_name: string | null;
  iban: string | null;
  bic: string | null;
}

export interface Document {
  id: string;
  user_id: string;
  customer_id: string;
  type: DocumentType;
  number: string;
  date: string;
  due_date: string | null;
  status: DocumentStatus;
  notes: string | null;
  vat_rate: number;
  location: string | null;
  salutation: string | null;
  introduction_text: string | null;
  sender_name: string | null;
  paid_at: string | null;
  profile_snapshot: ProfileSnapshot | null;
  // Courtage fields
  courtage_base_amount: number | null;
  courtage_percentage: number | null;
  // Reminder fields
  reminder_count: number;
  last_reminder_date: string | null;
  created_at: string;
  customer?: Customer;
  line_items?: LineItem[];
}

export interface LineItem {
  id: string;
  document_id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  position: number;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: 'yearly' | 'monthly' | 'free';
  status: 'active' | 'cancelled' | 'expired';
  cancel_at_period_end: boolean;
  current_period_end: string | null;
  documents_count: number;
  created_at: string;
}

// Form Types
export interface ProfileFormData {
  company_name: string;
  address: string;
  city: string;
  zip: string;
  phone: string;
  email: string;
  tax_number: string;
  is_kleinunternehmer: boolean;
  bank_name: string;
  iban: string;
  bic: string;
}

export interface CustomerFormData {
  name: string;
  company: string;
  address: string;
  city: string;
  zip: string;
  email: string;
}

export interface LineItemFormData {
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
}

export interface DocumentFormData {
  customer_id: string;
  type: DocumentType;
  date: string;
  due_date: string;
  notes: string;
  vat_rate: number;
  line_items: LineItemFormData[];
}

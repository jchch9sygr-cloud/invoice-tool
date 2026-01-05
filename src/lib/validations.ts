import { z } from 'zod';

// Passwort: Mindestens 12 Zeichen, 1 Großbuchstabe, 1 Kleinbuchstabe, 1 Zahl
export const passwordSchema = z
  .string()
  .min(12, 'Passwort muss mindestens 12 Zeichen lang sein')
  .regex(/[A-Z]/, 'Passwort muss mindestens einen Großbuchstaben enthalten')
  .regex(/[a-z]/, 'Passwort muss mindestens einen Kleinbuchstaben enthalten')
  .regex(/[0-9]/, 'Passwort muss mindestens eine Zahl enthalten');

export const emailSchema = z
  .string()
  .email('Ungültige E-Mail-Adresse')
  .min(5, 'E-Mail ist zu kurz')
  .max(255, 'E-Mail ist zu lang');

// Registrierung
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  passwordConfirm: z.string(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: 'Passwörter stimmen nicht überein',
  path: ['passwordConfirm'],
});

// Login
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Passwort ist erforderlich'),
});

// Stripe Checkout
export const checkoutSchema = z.object({
  plan: z.enum(['yearly', 'monthly'], {
    message: 'Ungültiger Plan',
  }),
});

// Kunde
export const customerSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(255, 'Name ist zu lang'),
  company: z.string().max(255, 'Firmenname ist zu lang').optional().nullable(),
  address: z.string().max(500, 'Adresse ist zu lang').optional().nullable(),
  zip: z.string().max(20, 'PLZ ist zu lang').optional().nullable(),
  city: z.string().max(100, 'Stadt ist zu lang').optional().nullable(),
  email: z.string().email('Ungültige E-Mail').optional().nullable().or(z.literal('')),
});

// Dokument (Rechnung/Angebot)
export const documentSchema = z.object({
  type: z.enum(['invoice', 'quote']),
  customer_id: z.string().uuid('Ungültige Kunden-ID').optional().nullable(),
  number: z.string().min(1, 'Dokumentnummer ist erforderlich').max(50, 'Dokumentnummer ist zu lang'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datumsformat'),
  location: z.string().max(100, 'Ort ist zu lang').optional().nullable(),
  introduction_text: z.string().max(2000, 'Einleitungstext ist zu lang').optional().nullable(),
  notes: z.string().max(2000, 'Notizen sind zu lang').optional().nullable(),
  vat_rate: z.number().min(0).max(100).optional().nullable(),
  sender_name: z.string().max(255, 'Absendername ist zu lang').optional().nullable(),
});

// Position
export const lineItemSchema = z.object({
  description: z.string().min(1, 'Beschreibung ist erforderlich').max(500, 'Beschreibung ist zu lang'),
  quantity: z.number().positive('Menge muss positiv sein').max(999999, 'Menge ist zu groß'),
  unit: z.string().max(50, 'Einheit ist zu lang').optional().nullable(),
  unit_price: z.number().min(0, 'Preis kann nicht negativ sein').max(99999999, 'Preis ist zu hoch'),
});

// Profil/Einstellungen
export const profileSchema = z.object({
  company_name: z.string().min(1, 'Firmenname ist erforderlich').max(255, 'Firmenname ist zu lang'),
  address: z.string().max(500, 'Adresse ist zu lang').optional().nullable(),
  zip: z.string().max(20, 'PLZ ist zu lang').optional().nullable(),
  city: z.string().max(100, 'Stadt ist zu lang').optional().nullable(),
  phone: z.string().max(50, 'Telefonnummer ist zu lang').optional().nullable(),
  email: z.string().email('Ungültige E-Mail').optional().nullable().or(z.literal('')),
  tax_number: z.string().max(50, 'Steuernummer ist zu lang').optional().nullable(),
  bank_name: z.string().max(100, 'Bankname ist zu lang').optional().nullable(),
  iban: z.string().max(34, 'IBAN ist zu lang').optional().nullable(),
  bic: z.string().max(11, 'BIC ist zu lang').optional().nullable(),
  is_kleinunternehmer: z.boolean().optional(),
});

// Typ-Exports für TypeScript
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CustomerInput = z.infer<typeof customerSchema>;
export type DocumentInput = z.infer<typeof documentSchema>;
export type LineItemInput = z.infer<typeof lineItemSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;

// Hilfsfunktion für API-Validierung
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const firstError = result.error.issues[0];
    return { success: false, error: firstError?.message || 'Validierungsfehler' };
  }
  return { success: true, data: result.data };
}

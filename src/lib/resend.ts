import { Resend } from 'resend';

// Lazy-load Resend client to avoid build-time errors
let resendInstance: Resend | null = null;

export function getResend(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY ist nicht konfiguriert');
    }
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

// Default sender email - change this to your verified domain
export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'RechnungsBlitz <onboarding@resend.dev>';

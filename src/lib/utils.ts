import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

export function generateDocumentNumber(
  type: 'invoice' | 'quote',
  count: number
): string {
  const prefix = type === 'invoice' ? 'RE' : 'AN';
  const year = new Date().getFullYear();
  const number = String(count + 1).padStart(4, '0');
  return `${prefix}-${year}-${number}`;
}

export function calculateTotal(
  items: { quantity: number; unit_price: number }[]
): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
}

export function getKleinunternehmerText(): string {
  return 'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.';
}

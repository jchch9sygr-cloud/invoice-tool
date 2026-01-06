import * as React from 'react';

interface SimpleReminderEmailProps {
  customerName: string;
  documentType: string; // "Zahlungserinnerung" oder "1. Mahnung" etc.
  invoiceNumber: string;
}

export function SimpleReminderEmail({
  customerName,
  documentType,
  invoiceNumber,
}: SimpleReminderEmailProps) {
  // Anrede bestimmen
  const getSalutation = () => {
    const name = customerName.toLowerCase();
    if (name.includes('herr')) {
      return `Sehr geehrter ${customerName}`;
    } else if (name.includes('frau')) {
      return `Sehr geehrte ${customerName}`;
    }
    return 'Sehr geehrte Damen und Herren';
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto', padding: '20px', color: '#333' }}>
      <p style={{ marginBottom: '20px' }}>
        {getSalutation()},
      </p>

      <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>
        im Anhang finden Sie die {documentType} zur Rechnung {invoiceNumber}.
      </p>

      <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>
        Bei Fragen stehen wir Ihnen gerne zur Verfügung.
      </p>

      <p style={{ marginBottom: '5px' }}>
        Mit freundlichen Grüßen
      </p>
      <p style={{ fontWeight: 'bold' }}>
        RechnungsBlitz
      </p>

      <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '30px 0 15px' }} />
      <p style={{ fontSize: '11px', color: '#999' }}>
        Diese E-Mail wurde automatisch versendet.
      </p>
    </div>
  );
}

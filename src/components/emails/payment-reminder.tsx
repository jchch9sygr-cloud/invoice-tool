import * as React from 'react';

interface PaymentReminderEmailProps {
  customerName: string;
  invoiceNumber: string;
  amount: string;
  dueDate: string;
  daysOverdue: number;
  level: number;
  companyName: string;
  bankName?: string;
  iban?: string;
  bic?: string;
}

export function PaymentReminderEmail({
  customerName,
  invoiceNumber,
  amount,
  dueDate,
  daysOverdue,
  level,
  companyName,
  bankName,
  iban,
  bic,
}: PaymentReminderEmailProps) {
  const getLevelTitle = () => {
    switch (level) {
      case 0: return 'Zahlungserinnerung';
      case 1: return '1. Mahnung';
      case 2: return '2. Mahnung';
      case 3: return 'Letzte Mahnung';
      default: return 'Zahlungserinnerung';
    }
  };

  const getLevelColor = () => {
    switch (level) {
      case 0: return '#06b6d4'; // cyan
      case 1: return '#eab308'; // yellow
      case 2: return '#f97316'; // orange
      default: return '#ef4444'; // red
    }
  };

  const getMessage = () => {
    switch (level) {
      case 0:
        return `wir möchten Sie freundlich daran erinnern, dass die Rechnung ${invoiceNumber} mit einem Betrag von ${amount} seit ${daysOverdue} Tagen fällig ist.`;
      case 1:
        return `leider müssen wir feststellen, dass die Rechnung ${invoiceNumber} über ${amount} trotz unserer Zahlungserinnerung noch nicht beglichen wurde. Wir bitten Sie, den Betrag innerhalb von 14 Tagen zu überweisen.`;
      case 2:
        return `trotz unserer bisherigen Erinnerungen ist der Rechnungsbetrag von ${amount} für Rechnung ${invoiceNumber} noch nicht auf unserem Konto eingegangen. Wir fordern Sie auf, den Betrag innerhalb von 10 Tagen zu begleichen.`;
      default:
        return `dies ist unsere letzte Mahnung. Die Rechnung ${invoiceNumber} über ${amount} ist seit ${daysOverdue} Tagen überfällig. Sollte der Betrag nicht innerhalb von 7 Tagen eingehen, sehen wir uns gezwungen, rechtliche Schritte einzuleiten.`;
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ borderBottom: '3px solid ' + getLevelColor(), paddingBottom: '20px', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', color: '#1f2937' }}>{companyName}</h1>
        <p style={{ margin: '10px 0 0', fontSize: '14px', color: '#6b7280' }}>{getLevelTitle()}</p>
      </div>

      {/* Invoice Box */}
      <div style={{
        backgroundColor: '#f3f4f6',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        borderLeft: '4px solid ' + getLevelColor()
      }}>
        <table style={{ width: '100%' }}>
          <tbody>
            <tr>
              <td style={{ padding: '5px 0' }}>
                <strong style={{ color: '#374151' }}>Rechnung:</strong>
              </td>
              <td style={{ textAlign: 'right', color: '#1f2937' }}>{invoiceNumber}</td>
            </tr>
            <tr>
              <td style={{ padding: '5px 0' }}>
                <strong style={{ color: '#374151' }}>Betrag:</strong>
              </td>
              <td style={{ textAlign: 'right', fontSize: '18px', fontWeight: 'bold', color: getLevelColor() }}>{amount}</td>
            </tr>
            <tr>
              <td style={{ padding: '5px 0' }}>
                <strong style={{ color: '#374151' }}>Fällig seit:</strong>
              </td>
              <td style={{ textAlign: 'right', color: '#1f2937' }}>{dueDate} ({daysOverdue} Tage)</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Message */}
      <div style={{ marginBottom: '20px' }}>
        <p style={{ color: '#374151', lineHeight: '1.6' }}>
          Sehr geehrte Damen und Herren,
        </p>
        <p style={{ color: '#374151', lineHeight: '1.6' }}>
          {getMessage()}
        </p>
        <p style={{ color: '#374151', lineHeight: '1.6' }}>
          Sollte sich Ihre Zahlung mit dieser E-Mail überschnitten haben, betrachten Sie diese bitte als gegenstandslos.
        </p>
      </div>

      {/* Bank Details */}
      {(bankName || iban) && (
        <div style={{
          backgroundColor: '#f0fdf4',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #bbf7d0'
        }}>
          <p style={{ margin: '0 0 10px', fontWeight: 'bold', color: '#166534' }}>Bankverbindung:</p>
          {bankName && <p style={{ margin: '5px 0', color: '#374151' }}>Bank: {bankName}</p>}
          {iban && <p style={{ margin: '5px 0', color: '#374151' }}>IBAN: {iban}</p>}
          {bic && <p style={{ margin: '5px 0', color: '#374151' }}>BIC: {bic}</p>}
        </div>
      )}

      {/* Closing */}
      <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
        <p style={{ color: '#374151', marginBottom: '5px' }}>Mit freundlichen Grüßen</p>
        <p style={{ color: '#1f2937', fontWeight: 'bold' }}>{companyName}</p>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
        <p style={{ color: '#9ca3af', fontSize: '12px' }}>
          Diese E-Mail wurde automatisch von RechnungsBlitz versendet.
        </p>
      </div>
    </div>
  );
}

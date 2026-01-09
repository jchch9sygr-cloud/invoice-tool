'use client';

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Document as InvoiceDocument, LineItem, Profile, Customer } from '@/types/database';

// Konstante für mm zu pt Umrechnung (DIN A4: 210 x 297 mm)
const MM = 2.835;

// Feste Styles - konsistent mit invoice-pdf für einheitliches Erscheinungsbild
const styles = StyleSheet.create({
  page: {
    paddingTop: 15 * MM,         // 15mm
    paddingBottom: 25 * MM,      // 25mm für Footer-Bereich
    paddingLeft: 25 * MM,        // 25mm (DIN 5008)
    paddingRight: 20 * MM,       // 20mm (DIN 5008)
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1f2937',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8 * MM,
  },
  logo: {
    objectFit: 'contain',
  },
  signature: {
    objectFit: 'contain',
    marginBottom: 1 * MM,
  },
  companyInfo: {
    textAlign: 'right',
    fontSize: 8,
  },
  companyName: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 1,
  },
  recipientBox: {
    width: 85 * MM,
    minHeight: 20 * MM,
    marginBottom: 3 * MM,
  },
  dateLineRight: {
    textAlign: 'right',
    marginBottom: 5 * MM,
  },
  subject: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 5 * MM,
  },
  warningBanner: {
    backgroundColor: '#fef3c7',
    padding: 6,
    marginBottom: 3 * MM,
    borderRadius: 3,
  },
  warningText: {
    color: '#92400e',
    fontSize: 8,
    textAlign: 'center',
    fontWeight: 700,
  },
  bodySection: {
    marginBottom: 3 * MM,
  },
  bodyText: {
    fontSize: 10,
    lineHeight: 1.4,
    marginBottom: 1,
  },
  text: {
    fontSize: 10,
    marginBottom: 0.5,
  },
  textBold: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 0.5,
  },
  textSmall: {
    fontSize: 8,
    marginBottom: 0.5,
  },
  invoiceDetails: {
    marginTop: 3 * MM,
    marginBottom: 3 * MM,
    padding: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  detailLabel: {
    fontSize: 9,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 10,
    fontWeight: 600,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#d1d5db',
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: 700,
  },
  totalValue: {
    fontSize: 12,
    fontWeight: 700,
    color: '#dc2626',
  },
  bankSection: {
    marginTop: 3 * MM,
    marginBottom: 3 * MM,
  },
  closingSection: {
    marginTop: 5 * MM,
    alignItems: 'flex-start',
  },
  closingText: {
    fontSize: 10,
    marginBottom: 3 * MM,
  },
  greeting: {
    fontSize: 10,
    marginBottom: 2 * MM,
  },
  signatureName: {
    fontSize: 10,
    fontWeight: 700,
  },
  footer: {
    position: 'absolute',
    bottom: 10 * MM,
    left: 25 * MM,
    right: 20 * MM,
  },
  footerDivider: {
    borderTopWidth: 0.5,
    borderTopColor: '#d1d5db',
    paddingTop: 4,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 6.5,
    color: '#6b7280',
  },
  footerSection: {
    maxWidth: '30%',
  },
  footerBank: {
    textAlign: 'right',
    maxWidth: '35%',
  },
  footerLabel: {
    fontWeight: 700,
    marginBottom: 0.5,
  },
});

interface ReminderPDFProps {
  document: InvoiceDocument;
  lineItems: LineItem[];
  profile: Profile;
  customer: Customer | null;
  level: number;
  totalAmount: number;
  customText?: string | null;
  customClosing?: string | null;
}

export function ReminderPDF({
  document,
  profile,
  customer,
  level,
  totalAmount,
  customText,
  customClosing,
}: ReminderPDFProps) {
  const today = new Date().toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const getLevelTitle = () => {
    switch (level) {
      case 0: return 'Zahlungserinnerung';
      case 1: return '1. Mahnung';
      case 2: return '2. Mahnung';
      case 3: return 'Letzte Mahnung';
      default: return `${level}. Mahnung`;
    }
  };

  const getDefaultText = () => {
    const salutation = customer?.name?.toLowerCase().includes('herr')
      ? 'Sehr geehrter Herr'
      : customer?.name?.toLowerCase().includes('frau')
      ? 'Sehr geehrte Frau'
      : 'Sehr geehrte Damen und Herren';

    switch (level) {
      case 0:
        return `${salutation},

wir möchten Sie freundlich daran erinnern, dass die oben genannte Rechnung fällig ist. Bitte überweisen Sie den ausstehenden Betrag auf das in der Rechnung angegebene Konto.

Sollte sich Ihre Zahlung mit diesem Schreiben überschnitten haben, betrachten Sie diese Erinnerung bitte als gegenstandslos.`;
      case 1:
        return `${salutation},

bei der Durchsicht unserer Buchhaltung haben wir festgestellt, dass die oben genannte Rechnung trotz unserer Zahlungserinnerung noch nicht beglichen wurde.

Wir bitten Sie, den ausstehenden Betrag innerhalb von 14 Tagen zu überweisen.`;
      case 2:
        return `${salutation},

trotz unserer bisherigen Erinnerungen ist der Rechnungsbetrag leider noch nicht auf unserem Konto eingegangen.

Wir fordern Sie hiermit auf, den ausstehenden Betrag innerhalb von 10 Tagen zu begleichen.`;
      default:
        return `${salutation},

leider müssen wir feststellen, dass Sie trotz unserer bisherigen Mahnungen den ausstehenden Rechnungsbetrag nicht beglichen haben.

Dies ist unsere letzte Mahnung. Sollte der Betrag nicht innerhalb von 7 Tagen auf unserem Konto eingehen, sehen wir uns gezwungen, rechtliche Schritte einzuleiten.`;
    }
  };

  const getDefaultClosing = () => {
    return level >= 3
      ? 'Wir erwarten Ihre Zahlung innerhalb von 7 Tagen.'
      : 'Für Rückfragen stehen wir Ihnen gerne zur Verfügung.';
  };

  const reminderText = customText || getDefaultText();
  const closingText = customClosing || getDefaultClosing();

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            {profile.logo_url && (
              <Image
                src={profile.logo_url}
                style={[styles.logo, { height: Math.min(profile.logo_size || 45, 45) }]}
              />
            )}
          </View>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{profile.company_name}</Text>
            <Text style={styles.textSmall}>{profile.address}</Text>
            <Text style={styles.textSmall}>{profile.zip} {profile.city}</Text>
            {profile.phone && <Text style={styles.textSmall}>Tel: {profile.phone}</Text>}
            {profile.email && <Text style={styles.textSmall}>{profile.email}</Text>}
          </View>
        </View>

        {/* Recipient */}
        <View style={styles.recipientBox}>
          {customer ? (
            <>
              <Text style={styles.textBold}>{customer.name}</Text>
              {customer.company && <Text style={styles.text}>{customer.company}</Text>}
              {customer.address && <Text style={styles.text}>{customer.address}</Text>}
              <Text style={styles.text}>{customer.zip} {customer.city}</Text>
            </>
          ) : (
            <Text style={styles.text}>—</Text>
          )}
        </View>

        {/* Date */}
        <View style={styles.dateLineRight}>
          <Text style={styles.text}>
            {profile.city ? `${profile.city}, ` : ''}{today}
          </Text>
        </View>

        {/* Subject */}
        <Text style={styles.subject}>
          {getLevelTitle()} - Rechnung Nr. {document.number}
        </Text>

        {/* Warning Banner for level 3+ */}
        {level >= 3 && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>
              LETZTE MAHNUNG VOR EINLEITUNG RECHTLICHER SCHRITTE
            </Text>
          </View>
        )}

        {/* Body */}
        <View style={styles.bodySection}>
          <Text style={styles.bodyText}>{reminderText}</Text>
        </View>

        {/* Invoice Details */}
        <View style={styles.invoiceDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Rechnungsnummer:</Text>
            <Text style={styles.detailValue}>{document.number}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Rechnungsdatum:</Text>
            <Text style={styles.detailValue}>{formatDate(document.date)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Fälligkeitsdatum:</Text>
            <Text style={styles.detailValue}>{formatDate(document.due_date)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Offener Betrag:</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
          </View>
        </View>

        {/* Payment Info */}
        <View style={styles.bankSection}>
          <Text style={styles.bodyText}>
            Bitte überweisen Sie den Betrag auf folgendes Konto:
          </Text>
          {profile.bank_name && (
            <Text style={styles.text}>Bank: {profile.bank_name}</Text>
          )}
          {profile.iban && (
            <Text style={styles.text}>IBAN: {profile.iban}</Text>
          )}
          {profile.bic && (
            <Text style={styles.text}>BIC: {profile.bic}</Text>
          )}
          <Text style={styles.text}>Verwendungszweck: {document.number}</Text>
        </View>

        {/* Closing */}
        <View style={styles.closingSection}>
          <Text style={styles.closingText}>{closingText}</Text>
          <Text style={styles.greeting}>Mit freundlichen Grüßen</Text>
          {profile.signature_url ? (
            <Image
              src={profile.signature_url}
              style={[styles.signature, { height: Math.min(profile.signature_size || 35, 40) }]}
            />
          ) : (
            <View style={{ height: 30, marginTop: 3, marginBottom: 3 }} />
          )}
          <Text style={styles.signatureName}>{profile.company_name}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerDivider}>
            <View style={styles.footerContent}>
              <View style={styles.footerSection}>
                <Text style={styles.footerLabel}>{profile.company_name}</Text>
                <Text>{profile.address}</Text>
                <Text>{profile.zip} {profile.city}</Text>
              </View>
              <View style={styles.footerSection}>
                {profile.phone && <Text>Tel: {profile.phone}</Text>}
                {profile.email && <Text>{profile.email}</Text>}
                {profile.tax_number && <Text>St.-Nr.: {profile.tax_number}</Text>}
              </View>
              {(profile.bank_name || profile.iban) && (
                <View style={styles.footerBank}>
                  <Text style={styles.footerLabel}>Bankverbindung</Text>
                  {profile.bank_name && <Text>{profile.bank_name}</Text>}
                  {profile.iban && <Text>IBAN: {profile.iban}</Text>}
                  {profile.bic && <Text>BIC: {profile.bic}</Text>}
                </View>
              )}
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

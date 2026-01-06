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

const styles = StyleSheet.create({
  page: {
    paddingTop: 20 * 2.835,
    paddingBottom: 20 * 2.835,
    paddingLeft: 25 * 2.835,
    paddingRight: 20 * 2.835,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1f2937',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10 * 2.835,
  },
  logo: {
    objectFit: 'contain',
  },
  companyInfo: {
    textAlign: 'right',
    fontSize: 8,
  },
  companyName: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 2,
  },
  recipientBox: {
    width: 85 * 2.835,
    minHeight: 27.3 * 2.835,
    marginBottom: 4 * 2.835,
  },
  dateLineRight: {
    textAlign: 'right',
    marginBottom: 8.46 * 2.835,
  },
  subject: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 8.46 * 2.835,
  },
  warningBanner: {
    backgroundColor: '#fef3c7',
    padding: 10,
    marginBottom: 15,
    borderRadius: 4,
  },
  warningText: {
    color: '#92400e',
    fontSize: 9,
    textAlign: 'center',
  },
  bodySection: {
    marginBottom: 4.23 * 2.835,
  },
  bodyText: {
    fontSize: 10,
    lineHeight: 1.5,
    marginBottom: 8,
  },
  text: {
    fontSize: 10,
    marginBottom: 1,
  },
  textBold: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 1,
  },
  textSmall: {
    fontSize: 8,
    marginBottom: 1,
  },
  invoiceDetails: {
    marginTop: 15,
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
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
    marginTop: 8,
    paddingTop: 8,
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
  closingSection: {
    marginTop: 20,
  },
  closingText: {
    fontSize: 10,
    marginBottom: 8,
  },
  signatureName: {
    fontSize: 10,
    fontWeight: 700,
    marginTop: 30,
  },
  footer: {
    position: 'absolute',
    bottom: 15 * 2.835,
    left: 25 * 2.835,
    right: 20 * 2.835,
  },
  footerDivider: {
    borderTopWidth: 0.5,
    borderTopColor: '#d1d5db',
    paddingTop: 6,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
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
    marginBottom: 1,
  },
});

interface ReminderPDFProps {
  document: InvoiceDocument;
  lineItems: LineItem[];
  profile: Profile;
  customer: Customer | null;
  level: number;
  totalAmount: number;
}

export function ReminderPDF({ document, lineItems, profile, customer, level, totalAmount }: ReminderPDFProps) {
  const today = new Date().toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const getLevelTitle = () => {
    switch (level) {
      case 1:
        return 'Zahlungserinnerung';
      case 2:
        return '2. Mahnung';
      case 3:
        return 'Letzte Mahnung';
      default:
        return `${level}. Mahnung`;
    }
  };

  const getLevelText = () => {
    switch (level) {
      case 1:
        return `bei der Durchsicht unserer Buchhaltung haben wir festgestellt, dass die oben genannte Rechnung noch nicht beglichen wurde. Wir möchten Sie freundlich daran erinnern, den ausstehenden Betrag zu überweisen.

Sollte sich Ihre Zahlung mit diesem Schreiben überschnitten haben, betrachten Sie dieses bitte als gegenstandslos.`;
      case 2:
        return `trotz unserer Zahlungserinnerung vom ${formatDate(document.last_reminder_date)} ist der Rechnungsbetrag leider noch nicht auf unserem Konto eingegangen.

Wir bitten Sie daher nochmals, den ausstehenden Betrag umgehend zu begleichen. Sollten Sie Fragen zur Rechnung haben oder eine Ratenzahlung wünschen, nehmen Sie bitte Kontakt mit uns auf.`;
      default:
        return `leider müssen wir feststellen, dass Sie trotz unserer bisherigen Mahnungen den ausstehenden Rechnungsbetrag nicht beglichen haben.

Dies ist unsere letzte Mahnung. Sollte der Betrag nicht innerhalb von 7 Tagen auf unserem Konto eingehen, sehen wir uns gezwungen, weitere rechtliche Schritte einzuleiten und den Fall an ein Inkassounternehmen zu übergeben.`;
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            {profile.logo_url && (
              <Image
                src={profile.logo_url}
                style={[styles.logo, { height: profile.logo_size || 60 }]}
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
          <Text style={styles.bodyText}>
            Sehr geehrte{customer?.name.includes('Herr') ? 'r Herr' : ' Damen und Herren'},
          </Text>
          <Text style={styles.bodyText}>
            {getLevelText()}
          </Text>
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
        <View style={styles.bodySection}>
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
          <Text style={styles.closingText}>
            {level >= 3
              ? 'Wir erwarten Ihre Zahlung innerhalb von 7 Tagen.'
              : 'Für Rückfragen stehen wir Ihnen gerne zur Verfügung.'}
          </Text>
          <Text style={styles.closingText}>Mit freundlichen Grüßen</Text>
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

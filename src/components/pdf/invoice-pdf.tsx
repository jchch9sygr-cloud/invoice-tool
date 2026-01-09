'use client';

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';
import { formatCurrency, formatDate, getKleinunternehmerText } from '@/lib/utils';
import type { Document as InvoiceDocument, LineItem, Profile, Customer } from '@/types/database';

// Konstante für mm zu pt Umrechnung (DIN A4: 210 x 297 mm)
const MM = 2.835;

// Feste Styles - konsistent mit reminder-pdf für einheitliches Erscheinungsbild
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
  table: {
    marginTop: 3 * MM,
    marginBottom: 3 * MM,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingVertical: 4,
    paddingHorizontal: 4,
    fontSize: 8,
    fontWeight: 600,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    fontSize: 10,
  },
  colDescription: {
    width: '75%',
  },
  colAmount: {
    width: '25%',
    textAlign: 'right',
  },
  totalSection: {
    marginTop: 3 * MM,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 280,
    paddingVertical: 2,
    paddingHorizontal: 4,
    fontSize: 10,
  },
  totalRowBorder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 280,
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
    marginTop: 2,
  },
  totalLabel: {
    fontSize: 10,
  },
  totalLabelBold: {
    fontWeight: 700,
    fontSize: 11,
  },
  totalValue: {
    fontSize: 10,
  },
  totalValueBold: {
    fontWeight: 700,
    fontSize: 11,
  },
  paymentInfo: {
    marginTop: 5 * MM,
    fontSize: 10,
    lineHeight: 1.4,
  },
  kleinunternehmer: {
    marginTop: 3 * MM,
    fontSize: 8,
    color: '#6b7280',
    fontStyle: 'italic',
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

interface InvoicePDFProps {
  document: InvoiceDocument;
  lineItems: LineItem[];
  profile: Profile;
  customer: Customer | null;
}

export function InvoicePDF({ document, lineItems, profile, customer }: InvoicePDFProps) {
  // Calculate totals
  const positionsTotal = lineItems.reduce(
    (sum, item) => sum + (item.quantity * item.unit_price),
    0
  );

  const hasCourtage = document.courtage_base_amount != null && document.courtage_percentage != null;
  const courtageAmount = hasCourtage
    ? (document.courtage_base_amount! * document.courtage_percentage!) / 100
    : 0;

  const netTotal = positionsTotal + courtageAmount;
  const vatRate = document.vat_rate || 0;
  const vatAmount = (netTotal * vatRate) / 100;
  const grossTotal = netTotal + vatAmount;
  const isInvoice = document.type === 'invoice';

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
            {profile.tax_number && <Text style={styles.textSmall}>St.-Nr.: {profile.tax_number}</Text>}
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
            {document.location ? `${document.location}, ` : ''}{formatDate(document.date)}
          </Text>
        </View>

        {/* Subject */}
        <Text style={styles.subject}>
          {isInvoice ? 'Rechnung' : 'Angebot'} Nr. {document.number}
        </Text>

        {/* Body */}
        <View style={styles.bodySection}>
          <Text style={styles.bodyText}>{document.salutation || 'Sehr geehrte Damen und Herren,'}</Text>
          {document.introduction_text && (
            <Text style={styles.bodyText}>{document.introduction_text}</Text>
          )}
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDescription}>Beschreibung</Text>
            <Text style={styles.colAmount}>Betrag</Text>
          </View>
          {lineItems.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.colDescription}>{item.description}</Text>
              <Text style={styles.colAmount}>
                {formatCurrency(item.quantity * item.unit_price)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Nettobetrag:</Text>
            <Text style={styles.totalValue}>{formatCurrency(positionsTotal)}</Text>
          </View>

          {hasCourtage && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Courtage ({document.courtage_percentage}%):
              </Text>
              <Text style={styles.totalValue}>{formatCurrency(courtageAmount)}</Text>
            </View>
          )}

          {vatRate > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{vatRate}% USt.:</Text>
              <Text style={styles.totalValue}>{formatCurrency(vatAmount)}</Text>
            </View>
          )}

          <View style={styles.totalRowBorder}>
            <Text style={styles.totalLabelBold}>Gesamtbetrag:</Text>
            <Text style={styles.totalValueBold}>{formatCurrency(grossTotal)}</Text>
          </View>
        </View>

        {/* Notes */}
        {document.notes && (
          <Text style={styles.paymentInfo}>{document.notes}</Text>
        )}

        {/* Kleinunternehmer */}
        {profile.is_kleinunternehmer && (
          <Text style={styles.kleinunternehmer}>{getKleinunternehmerText()}</Text>
        )}

        {/* Closing */}
        <View style={styles.closingSection}>
          <Text style={styles.closingText}>
            {isInvoice
              ? 'Wir bedanken uns für die Zusammenarbeit.'
              : 'Wir freuen uns auf Ihre Rückmeldung.'}
          </Text>
          <Text style={styles.greeting}>Mit freundlichen Grüßen</Text>
          {profile.signature_url ? (
            <Image
              src={profile.signature_url}
              style={[styles.signature, { height: Math.min(profile.signature_size || 35, 40) }]}
            />
          ) : (
            <View style={{ height: 30, marginTop: 3, marginBottom: 3 }} />
          )}
          <Text style={styles.signatureName}>
            {document.sender_name || profile.company_name}
          </Text>
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

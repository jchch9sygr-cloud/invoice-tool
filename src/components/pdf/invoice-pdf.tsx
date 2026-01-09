'use client';

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';
import { formatCurrency, formatDate, getKleinunternehmerText, calculateTotal, calculateVat, calculateGrossTotal } from '@/lib/utils';
import type { Document as InvoiceDocument, LineItem, Profile, Customer } from '@/types/database';

// Dynamische Styles basierend auf Schriftgröße
const createStyles = (fontSize: number, compact: boolean = false) => {
  const spacing = compact ? 0.7 : 1; // Reduziere Abstände wenn kompakt

  return StyleSheet.create({
  page: {
    paddingTop: 15 * 2.835,      // 15mm (reduziert)
    paddingBottom: 18 * 2.835,   // 18mm für Footer
    paddingLeft: 25 * 2.835,     // 25mm (DIN 5008)
    paddingRight: 20 * 2.835,    // 20mm (DIN 5008)
    fontSize: fontSize,
    fontFamily: 'Helvetica',
    color: '#1f2937',
  },
  // Kopfbereich mit Logo rechts
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8 * 2.835 * spacing,    // 8mm Abstand
  },
  logo: {
    objectFit: 'contain',
  },
  signature: {
    objectFit: 'contain',
    marginBottom: 1 * 2.835,
  },
  companyInfo: {
    textAlign: 'right',
    fontSize: fontSize * 0.8,
  },
  companyName: {
    fontSize: fontSize,
    fontWeight: 700,
    marginBottom: 1,
  },
  // Rücksendezeile (klein, über Empfänger)
  senderLine: {
    fontSize: fontSize * 0.6,
    color: '#6b7280',
    marginBottom: 1.5 * 2.835,
    paddingBottom: 0.5 * 2.835,
    borderBottomWidth: 0.5,
    borderBottomColor: '#9ca3af',
  },
  // Empfängerfeld nach DIN 5008
  recipientBox: {
    width: 85 * 2.835,
    minHeight: 22 * 2.835 * spacing,     // Reduziert
    marginBottom: 3 * 2.835 * spacing,
  },
  // Ort, Datum rechts ausgerichtet
  dateLineRight: {
    textAlign: 'right',
    marginBottom: 6 * 2.835 * spacing,
  },
  // Betreff (fett, nach DIN 5008)
  subject: {
    fontSize: fontSize * 1.1,
    fontWeight: 700,
    marginBottom: 6 * 2.835 * spacing,
  },
  // Brieftext
  bodySection: {
    marginBottom: 3 * 2.835 * spacing,
  },
  bodyText: {
    fontSize: fontSize,
    lineHeight: 1.4,
    marginBottom: 1,
  },
  text: {
    fontSize: fontSize,
    marginBottom: 0.5,
  },
  textBold: {
    fontSize: fontSize,
    fontWeight: 700,
    marginBottom: 0.5,
  },
  textSmall: {
    fontSize: fontSize * 0.8,
    marginBottom: 0.5,
  },
  // Positionstabelle
  table: {
    marginTop: 3 * 2.835 * spacing,
    marginBottom: 3 * 2.835 * spacing,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingVertical: 4,
    paddingHorizontal: 4,
    fontSize: fontSize * 0.8,
    fontWeight: 600,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    fontSize: fontSize,
  },
  colDescription: {
    width: '75%',
  },
  colAmount: {
    width: '25%',
    textAlign: 'right',
  },
  // Summenblock rechts
  totalSection: {
    marginTop: 3 * 2.835 * spacing,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 280,
    paddingVertical: 2,
    paddingHorizontal: 4,
    fontSize: fontSize,
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
    fontSize: fontSize,
  },
  totalLabelBold: {
    fontWeight: 700,
    fontSize: fontSize * 1.1,
  },
  totalValue: {
    fontSize: fontSize,
  },
  totalValueBold: {
    fontWeight: 700,
    fontSize: fontSize * 1.1,
  },
  // Zahlungshinweis
  paymentInfo: {
    marginTop: 6 * 2.835 * spacing,
    fontSize: fontSize,
    lineHeight: 1.4,
  },
  kleinunternehmer: {
    marginTop: 3 * 2.835 * spacing,
    fontSize: fontSize * 0.8,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  // Grußformel (DIN 5008: 1 Leerzeile vor Gruß)
  closingSection: {
    marginTop: 6 * 2.835 * spacing,
    alignItems: 'flex-start',
  },
  closingText: {
    fontSize: fontSize,
    marginBottom: 3 * 2.835 * spacing,
  },
  greeting: {
    fontSize: fontSize,
    marginBottom: 2 * 2.835,
  },
  signatureName: {
    fontSize: fontSize,
    fontWeight: 700,
  },
  // Fußzeile
  footer: {
    position: 'absolute',
    bottom: 12 * 2.835,
    left: 25 * 2.835,
    right: 20 * 2.835,
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
};

interface InvoicePDFProps {
  document: InvoiceDocument;
  lineItems: LineItem[];
  profile: Profile;
  customer: Customer | null;
}

export function InvoicePDF({ document, lineItems, profile, customer }: InvoicePDFProps) {
  // Calculate positions total
  const positionsTotal = lineItems.reduce(
    (sum, item) => sum + (item.quantity * item.unit_price),
    0
  );

  // Calculate courtage if present
  const hasCourtage = document.courtage_base_amount != null && document.courtage_percentage != null;
  const courtageAmount = hasCourtage
    ? (document.courtage_base_amount! * document.courtage_percentage!) / 100
    : 0;

  const netTotal = positionsTotal + courtageAmount;
  const vatRate = document.vat_rate || 0;
  const vatAmount = (netTotal * vatRate) / 100;
  const grossTotal = netTotal + vatAmount;
  const isInvoice = document.type === 'invoice';

  // Dynamische Schriftgröße basierend auf Inhaltsmenge
  const introLength = (document.introduction_text || '').length;
  const notesLength = (document.notes || '').length;
  const itemCount = lineItems.length;
  const totalContentLength = introLength + notesLength + (itemCount * 30);

  // Berechne optimale Schriftgröße und ob kompakt
  let fontSize = 10;
  let compact = false;

  if (itemCount > 8 || totalContentLength > 600) {
    fontSize = 8;
    compact = true;
  } else if (itemCount > 5 || totalContentLength > 400) {
    fontSize = 9;
    compact = true;
  }

  const styles = createStyles(fontSize, compact);

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap={false}>
        {/* Kopfbereich: Logo links, Absenderdaten rechts */}
        <View style={styles.header}>
          <View>
            {profile.logo_url && (
              <Image
                src={profile.logo_url}
                style={[styles.logo, { height: Math.min(profile.logo_size || 50, compact ? 40 : 50) }]}
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

        {/* Empfängeradresse (ohne Rücksendezeile für Fensterkuvert) */}
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

        {/* Ort, Datum - rechts unter Empfänger */}
        <View style={styles.dateLineRight}>
          <Text style={styles.text}>
            {document.location ? `${document.location}, ` : ''}{formatDate(document.date)}
          </Text>
        </View>

        {/* Betreff (DIN 5008: fett, 2 Leerzeilen Abstand) */}
        <Text style={styles.subject}>
          {isInvoice ? 'Rechnung' : 'Angebot'} Nr. {document.number}
        </Text>

        {/* Brieftext: Anrede + Einleitung */}
        <View style={styles.bodySection}>
          <Text style={styles.bodyText}>{document.salutation || 'Sehr geehrte Damen und Herren,'}</Text>
          {document.introduction_text && (
            <Text style={styles.bodyText}>{document.introduction_text}</Text>
          )}
        </View>

        {/* Positionstabelle - Vereinfacht */}
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

        {/* Summenblock rechts */}
        <View style={styles.totalSection}>
          {/* Nettobetrag (Positionen) */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Nettobetrag:</Text>
            <Text style={styles.totalValue}>{formatCurrency(positionsTotal)}</Text>
          </View>

          {/* Courtage Zeile */}
          {hasCourtage && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Courtage von {document.courtage_percentage}% von {formatCurrency(document.courtage_base_amount!)}:
              </Text>
              <Text style={styles.totalValue}>{formatCurrency(courtageAmount)}</Text>
            </View>
          )}

          {/* USt. */}
          {vatRate > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{vatRate}% USt.:</Text>
              <Text style={styles.totalValue}>{formatCurrency(vatAmount)}</Text>
            </View>
          )}

          {/* Gesamtbetrag */}
          <View style={styles.totalRowBorder}>
            <Text style={styles.totalLabelBold}>Gesamtbetrag:</Text>
            <Text style={styles.totalValueBold}>{formatCurrency(grossTotal)}</Text>
          </View>
        </View>

        {/* Zahlungshinweis */}
        {document.notes && (
          <Text style={styles.paymentInfo}>{document.notes}</Text>
        )}

        {/* Kleinunternehmer-Hinweis */}
        {profile.is_kleinunternehmer && (
          <Text style={styles.kleinunternehmer}>{getKleinunternehmerText()}</Text>
        )}

        {/* Grußformel (DIN 5008) */}
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
              style={[styles.signature, { height: Math.min(profile.signature_size || 40, compact ? 30 : 40) }]}
            />
          ) : (
            /* Platz für handschriftliche Unterschrift */
            <View style={{ height: compact ? 25 : 35, marginTop: 4, marginBottom: 4 }} />
          )}
          <Text style={styles.signatureName}>
            {document.sender_name || profile.company_name}
          </Text>
        </View>

        {/* Fußzeile mit Kontakt + Bankverbindung */}
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

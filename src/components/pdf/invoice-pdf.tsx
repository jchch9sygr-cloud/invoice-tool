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

// DIN 5008 Briefstandard - Maße in Punkten (1mm = 2.835pt)
// Seitenränder: Links 25mm, Rechts 20mm, Oben 20mm, Unten 20mm
// Anschriftfeld: 45mm vom oberen Rand, 85mm breit, 45mm hoch
const styles = StyleSheet.create({
  page: {
    paddingTop: 20 * 2.835,      // 20mm
    paddingBottom: 20 * 2.835,   // 20mm
    paddingLeft: 25 * 2.835,     // 25mm (DIN 5008)
    paddingRight: 20 * 2.835,    // 20mm (DIN 5008)
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1f2937',
  },
  // Kopfbereich mit Logo rechts
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10 * 2.835,    // 10mm Abstand
  },
  logo: {
    width: 50,
    height: 50,
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
  // Rücksendezeile (klein, über Empfänger)
  senderLine: {
    fontSize: 6,
    color: '#6b7280',
    marginBottom: 2 * 2.835,     // 2mm
    paddingBottom: 1 * 2.835,    // 1mm
    borderBottomWidth: 0.5,
    borderBottomColor: '#9ca3af',
  },
  // Empfängerfeld nach DIN 5008
  recipientBox: {
    width: 85 * 2.835,           // 85mm Breite (DIN 5008)
    minHeight: 27.3 * 2.835,     // Mindesthöhe Anschriftzone
    marginBottom: 4 * 2.835,     // 4mm Abstand
  },
  // Ort, Datum rechts ausgerichtet
  dateLineRight: {
    textAlign: 'right',
    marginBottom: 8.46 * 2.835,  // 2 Leerzeilen vor Betreff
  },
  // Betreff (fett, nach DIN 5008)
  subject: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 8.46 * 2.835,  // 2 Leerzeilen nach Betreff
  },
  // Brieftext
  bodySection: {
    marginBottom: 4.23 * 2.835,  // 1 Leerzeile ~ 4.23mm
  },
  bodyText: {
    fontSize: 10,
    lineHeight: 1.5,             // DIN 5008: 1-zeilig mit 1,5 Zeilenabstand
    marginBottom: 2,
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
  // Positionstabelle
  table: {
    marginTop: 4.23 * 2.835,     // 1 Leerzeile
    marginBottom: 4.23 * 2.835,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingVertical: 6,
    paddingHorizontal: 4,
    fontSize: 8,
    fontWeight: 600,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    fontSize: 10,
  },
  colDescription: {
    width: '45%',
  },
  colQuantity: {
    width: '12%',
    textAlign: 'right',
  },
  colUnit: {
    width: '13%',
    textAlign: 'center',
  },
  colPrice: {
    width: '15%',
    textAlign: 'right',
  },
  colTotal: {
    width: '15%',
    textAlign: 'right',
  },
  // Summenblock rechts
  totalSection: {
    marginTop: 4.23 * 2.835,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 180,
    paddingVertical: 3,
    paddingHorizontal: 6,
    fontSize: 10,
  },
  totalRowBorder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 180,
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
    marginTop: 3,
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
  // Zahlungshinweis
  paymentInfo: {
    marginTop: 8.46 * 2.835,     // 2 Leerzeilen
    fontSize: 10,
    lineHeight: 1.5,
  },
  kleinunternehmer: {
    marginTop: 4.23 * 2.835,
    fontSize: 8,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  // Grußformel (DIN 5008: 1 Leerzeile vor Gruß)
  closingSection: {
    marginTop: 8.46 * 2.835,     // 2 Leerzeilen
  },
  closingText: {
    fontSize: 10,
    marginBottom: 4.23 * 2.835,  // 1 Leerzeile
  },
  greeting: {
    fontSize: 10,
    marginBottom: 12 * 2.835,    // 3 Leerzeilen für Unterschrift
  },
  signatureName: {
    fontSize: 10,
    fontWeight: 700,
  },
  // Fußzeile
  footer: {
    position: 'absolute',
    bottom: 15 * 2.835,          // 15mm vom unteren Rand
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

interface InvoicePDFProps {
  document: InvoiceDocument;
  lineItems: LineItem[];
  profile: Profile;
  customer: Customer | null;
}

export function InvoicePDF({ document, lineItems, profile, customer }: InvoicePDFProps) {
  const netTotal = calculateTotal(lineItems);
  const vatRate = document.vat_rate || 0;
  const vatAmount = calculateVat(netTotal, vatRate);
  const grossTotal = calculateGrossTotal(netTotal, vatRate);
  const isInvoice = document.type === 'invoice';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Kopfbereich: Logo links, Absenderdaten rechts */}
        <View style={styles.header}>
          <View>
            {profile.logo_url && (
              <Image src={profile.logo_url} style={styles.logo} />
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
          <Text style={styles.bodyText}>Sehr geehrte Damen und Herren,</Text>
          {document.introduction_text && (
            <Text style={styles.bodyText}>{document.introduction_text}</Text>
          )}
        </View>

        {/* Positionstabelle */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDescription}>Beschreibung</Text>
            <Text style={styles.colQuantity}>Menge</Text>
            <Text style={styles.colUnit}>Einheit</Text>
            <Text style={styles.colPrice}>Einzelpreis</Text>
            <Text style={styles.colTotal}>Gesamt</Text>
          </View>
          {lineItems.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.colDescription}>{item.description}</Text>
              <Text style={styles.colQuantity}>{item.quantity}</Text>
              <Text style={styles.colUnit}>{item.unit}</Text>
              <Text style={styles.colPrice}>{formatCurrency(item.unit_price)}</Text>
              <Text style={styles.colTotal}>
                {formatCurrency(item.quantity * item.unit_price)}
              </Text>
            </View>
          ))}
        </View>

        {/* Summenblock rechts */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Nettobetrag:</Text>
            <Text style={styles.totalValue}>{formatCurrency(netTotal)}</Text>
          </View>
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

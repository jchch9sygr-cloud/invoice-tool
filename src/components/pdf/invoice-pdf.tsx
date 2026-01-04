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

const styles = StyleSheet.create({
  page: {
    padding: 40,
    paddingBottom: 80,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#1f2937',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  logo: {
    width: 60,
    height: 60,
    objectFit: 'contain',
  },
  companyInfo: {
    textAlign: 'right',
    fontSize: 8,
  },
  companyName: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 2,
  },
  senderLine: {
    fontSize: 7,
    color: '#6b7280',
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: '#d1d5db',
  },
  recipientSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  recipientBox: {
    width: '55%',
  },
  dateBox: {
    width: '40%',
    textAlign: 'right',
  },
  title: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 10,
  },
  introSection: {
    marginBottom: 12,
  },
  introText: {
    fontSize: 9,
    lineHeight: 1.4,
    marginBottom: 3,
  },
  text: {
    fontSize: 9,
    marginBottom: 1,
  },
  textBold: {
    fontSize: 9,
    fontWeight: 700,
    marginBottom: 1,
  },
  textSmall: {
    fontSize: 8,
    marginBottom: 1,
  },
  table: {
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 6,
    fontSize: 8,
    fontWeight: 600,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    fontSize: 9,
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
  totalSection: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 180,
    paddingVertical: 2,
    paddingHorizontal: 6,
    fontSize: 9,
  },
  totalRowBorder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 180,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
    marginTop: 2,
  },
  totalLabel: {
    fontSize: 9,
  },
  totalLabelBold: {
    fontWeight: 700,
    fontSize: 10,
  },
  totalValue: {
    fontSize: 9,
  },
  totalValueBold: {
    fontWeight: 700,
    fontSize: 10,
  },
  paymentInfo: {
    marginTop: 12,
    fontSize: 9,
  },
  kleinunternehmer: {
    marginTop: 10,
    fontSize: 8,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  closingSection: {
    marginTop: 20,
  },
  closingText: {
    fontSize: 9,
    marginBottom: 3,
  },
  signature: {
    marginTop: 12,
    fontSize: 9,
  },
  signatureName: {
    marginTop: 3,
    fontSize: 9,
    fontWeight: 700,
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 40,
    right: 40,
  },
  footerDivider: {
    borderTopWidth: 0.5,
    borderTopColor: '#d1d5db',
    paddingTop: 8,
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
        {/* Header mit Logo und Absender */}
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

        {/* Absenderzeile klein */}
        <Text style={styles.senderLine}>
          {profile.company_name} · {profile.address} · {profile.zip} {profile.city}
        </Text>

        {/* Empfänger und Datum */}
        <View style={styles.recipientSection}>
          <View style={styles.recipientBox}>
            {customer ? (
              <>
                <Text style={styles.textBold}>{customer.name}</Text>
                {customer.company && <Text style={styles.text}>{customer.company}</Text>}
                {customer.address && <Text style={styles.text}>{customer.address}</Text>}
                <Text style={styles.text}>{customer.zip} {customer.city}</Text>
              </>
            ) : (
              <Text style={styles.text}>-</Text>
            )}
          </View>
          <View style={styles.dateBox}>
            <Text style={styles.text}>
              {document.location && `${document.location}, `}{formatDate(document.date)}
            </Text>
          </View>
        </View>

        {/* Betreff / Titel */}
        <Text style={styles.title}>
          {isInvoice ? 'Rechnung' : 'Angebot'} Nr. {document.number}
        </Text>

        {/* Anrede und Einleitungstext */}
        <View style={styles.introSection}>
          <Text style={styles.introText}>Sehr geehrte Damen und Herren,</Text>
          {document.introduction_text && (
            <Text style={styles.introText}>{document.introduction_text}</Text>
          )}
        </View>

        {/* Positionen-Tabelle */}
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

        {/* Summen: Netto, USt., Brutto */}
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

        {/* Zahlungshinweis / Anmerkungen */}
        {document.notes && (
          <Text style={styles.paymentInfo}>{document.notes}</Text>
        )}

        {/* Kleinunternehmer Hinweis */}
        {profile.is_kleinunternehmer && (
          <Text style={styles.kleinunternehmer}>{getKleinunternehmerText()}</Text>
        )}

        {/* Danksagung und Grußformel */}
        <View style={styles.closingSection}>
          <Text style={styles.closingText}>
            {isInvoice
              ? 'Wir bedanken uns für die Zusammenarbeit.'
              : 'Wir freuen uns auf Ihre Rückmeldung.'}
          </Text>
          <Text style={styles.signature}>mit freundlichen Grüßen</Text>
          {document.sender_name ? (
            <Text style={styles.signatureName}>{document.sender_name}</Text>
          ) : (
            <Text style={styles.signatureName}>{profile.company_name}</Text>
          )}
        </View>

        {/* Footer mit Bankverbindung */}
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

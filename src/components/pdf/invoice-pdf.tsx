'use client';

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from '@react-pdf/renderer';
import { formatCurrency, formatDate, getKleinunternehmerText, calculateTotal } from '@/lib/utils';
import type { Document as InvoiceDocument, LineItem, Profile, Customer } from '@/types/database';

// Register font (optional - uses default if not available)
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hjp-Ek-_EeA.woff2', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.woff2', fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Inter',
    color: '#1f2937',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    objectFit: 'contain',
  },
  companyInfo: {
    textAlign: 'right',
  },
  companyName: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 20,
  },
  metaSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  customerBox: {
    width: '50%',
  },
  detailsBox: {
    width: '40%',
  },
  label: {
    fontSize: 8,
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  value: {
    fontSize: 10,
    marginBottom: 2,
  },
  table: {
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 8,
    fontWeight: 600,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  colDescription: {
    width: '45%',
  },
  colQuantity: {
    width: '15%',
    textAlign: 'right',
  },
  colUnit: {
    width: '15%',
    textAlign: 'center',
  },
  colPrice: {
    width: '12%',
    textAlign: 'right',
  },
  colTotal: {
    width: '13%',
    textAlign: 'right',
  },
  totalSection: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
    padding: 8,
  },
  totalLabel: {
    fontWeight: 600,
  },
  totalValue: {
    fontWeight: 700,
    fontSize: 14,
  },
  notes: {
    marginTop: 30,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  notesLabel: {
    fontSize: 8,
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  kleinunternehmer: {
    marginTop: 20,
    fontSize: 9,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
  },
  footerDivider: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#6b7280',
  },
  bankInfo: {
    textAlign: 'right',
  },
});

interface InvoicePDFProps {
  document: InvoiceDocument;
  lineItems: LineItem[];
  profile: Profile;
  customer: Customer | null;
}

export function InvoicePDF({ document, lineItems, profile, customer }: InvoicePDFProps) {
  const total = calculateTotal(lineItems);
  const isInvoice = document.type === 'invoice';
  const title = isInvoice ? 'RECHNUNG' : 'ANGEBOT';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            {profile.logo_url && (
              <Image src={profile.logo_url} style={styles.logo} />
            )}
          </View>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{profile.company_name}</Text>
            <Text style={styles.value}>{profile.address}</Text>
            <Text style={styles.value}>{profile.zip} {profile.city}</Text>
            {profile.phone && <Text style={styles.value}>Tel: {profile.phone}</Text>}
            {profile.email && <Text style={styles.value}>{profile.email}</Text>}
            {profile.tax_number && <Text style={styles.value}>St.-Nr.: {profile.tax_number}</Text>}
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>{title} {document.number}</Text>

        {/* Meta Section */}
        <View style={styles.metaSection}>
          <View style={styles.customerBox}>
            <Text style={styles.label}>Kunde</Text>
            {customer ? (
              <>
                <Text style={styles.value}>{customer.name}</Text>
                {customer.company && <Text style={styles.value}>{customer.company}</Text>}
                {customer.address && <Text style={styles.value}>{customer.address}</Text>}
                <Text style={styles.value}>{customer.zip} {customer.city}</Text>
              </>
            ) : (
              <Text style={styles.value}>-</Text>
            )}
          </View>
          <View style={styles.detailsBox}>
            <View style={{ marginBottom: 8 }}>
              <Text style={styles.label}>{isInvoice ? 'Rechnungsdatum' : 'Angebotsdatum'}</Text>
              <Text style={styles.value}>{formatDate(document.date)}</Text>
            </View>
            {document.due_date && (
              <View>
                <Text style={styles.label}>{isInvoice ? 'Fällig am' : 'Gültig bis'}</Text>
                <Text style={styles.value}>{formatDate(document.due_date)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDescription}>Beschreibung</Text>
            <Text style={styles.colQuantity}>Menge</Text>
            <Text style={styles.colUnit}>Einheit</Text>
            <Text style={styles.colPrice}>Preis</Text>
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

        {/* Total */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Gesamtbetrag:</Text>
            <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
          </View>
        </View>

        {/* Kleinunternehmer Hinweis */}
        {profile.is_kleinunternehmer && (
          <Text style={styles.kleinunternehmer}>{getKleinunternehmerText()}</Text>
        )}

        {/* Notes */}
        {document.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesLabel}>Anmerkungen</Text>
            <Text style={styles.value}>{document.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerDivider}>
            <View style={styles.footerContent}>
              <View>
                <Text>{profile.company_name}</Text>
                <Text>{profile.address}, {profile.zip} {profile.city}</Text>
              </View>
              {(profile.bank_name || profile.iban) && (
                <View style={styles.bankInfo}>
                  <Text>Bankverbindung</Text>
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

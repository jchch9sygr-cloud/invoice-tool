// Server-Version für E-Mail-Anhänge (kein 'use client')
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';

// Kompakte Styles für eine Seite
const styles = StyleSheet.create({
  page: {
    paddingTop: 15 * 2.835,      // 15mm
    paddingBottom: 18 * 2.835,   // 18mm für Footer
    paddingLeft: 25 * 2.835,     // 25mm (DIN 5008)
    paddingRight: 20 * 2.835,    // 20mm (DIN 5008)
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#1f2937',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6 * 2.835,
  },
  logo: {
    objectFit: 'contain',
  },
  companyInfo: {
    textAlign: 'right',
    fontSize: 7,
  },
  companyName: {
    fontSize: 9,
    fontWeight: 700,
    marginBottom: 1,
  },
  recipientBox: {
    width: 85 * 2.835,
    minHeight: 18 * 2.835,
    marginBottom: 3 * 2.835,
  },
  dateLineRight: {
    textAlign: 'right',
    marginBottom: 4 * 2.835,
  },
  subject: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 4 * 2.835,
  },
  warningBanner: {
    backgroundColor: '#fef3c7',
    padding: 5,
    marginBottom: 3 * 2.835,
    borderRadius: 3,
  },
  warningText: {
    color: '#92400e',
    fontSize: 7.5,
    textAlign: 'center',
    fontWeight: 700,
  },
  bodySection: {
    marginBottom: 3 * 2.835,
  },
  bodyText: {
    fontSize: 9,
    lineHeight: 1.4,
    marginBottom: 1,
  },
  text: {
    fontSize: 9,
    marginBottom: 0.5,
  },
  textBold: {
    fontSize: 9,
    fontWeight: 700,
    marginBottom: 0.5,
  },
  textSmall: {
    fontSize: 7,
    marginBottom: 0.5,
  },
  invoiceDetails: {
    marginTop: 2 * 2.835,
    marginBottom: 2 * 2.835,
    padding: 7,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  detailLabel: {
    fontSize: 8,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 9,
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
    fontSize: 10,
    fontWeight: 700,
  },
  totalValue: {
    fontSize: 10,
    fontWeight: 700,
    color: '#dc2626',
  },
  bankSection: {
    marginTop: 2 * 2.835,
    marginBottom: 2 * 2.835,
  },
  closingSection: {
    marginTop: 4 * 2.835,
    alignItems: 'flex-start',
  },
  closingText: {
    fontSize: 9,
    marginBottom: 3 * 2.835,
  },
  greeting: {
    fontSize: 9,
    marginBottom: 2 * 2.835,
  },
  signature: {
    objectFit: 'contain',
    marginBottom: 1 * 2.835,
  },
  signatureName: {
    fontSize: 9,
    fontWeight: 700,
  },
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
    fontSize: 6,
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

function formatDate(date: string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

interface ReminderPDFServerProps {
  document: {
    number: string;
    date: string;
    due_date: string | null;
  };
  profile: {
    company_name?: string | null;
    address?: string | null;
    zip?: string | null;
    city?: string | null;
    phone?: string | null;
    email?: string | null;
    tax_number?: string | null;
    bank_name?: string | null;
    iban?: string | null;
    bic?: string | null;
    logo_url?: string | null;
    logo_size?: number | null;
    signature_url?: string | null;
    signature_size?: number | null;
  };
  customer: {
    name?: string | null;
    company?: string | null;
    address?: string | null;
    zip?: string | null;
    city?: string | null;
  } | null;
  level: number;
  totalAmount: number;
}

export function ReminderPDFServer({
  document,
  profile,
  customer,
  level,
  totalAmount,
}: ReminderPDFServerProps) {
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

  const getSalutation = () => {
    const name = customer?.name?.toLowerCase() || '';
    if (name.includes('herr')) return 'Sehr geehrter Herr';
    if (name.includes('frau')) return 'Sehr geehrte Frau';
    return 'Sehr geehrte Damen und Herren';
  };

  // Kürzere Texte für eine Seite
  const getReminderText = () => {
    const salutation = getSalutation();
    switch (level) {
      case 0:
        return `${salutation},\n\nwir möchten Sie freundlich daran erinnern, dass die oben genannte Rechnung fällig ist. Bitte überweisen Sie den ausstehenden Betrag auf das unten angegebene Konto.\n\nSollte sich Ihre Zahlung mit diesem Schreiben überschnitten haben, betrachten Sie diese Erinnerung bitte als gegenstandslos.`;
      case 1:
        return `${salutation},\n\nbei der Durchsicht unserer Buchhaltung haben wir festgestellt, dass die oben genannte Rechnung trotz unserer Zahlungserinnerung noch nicht beglichen wurde.\n\nWir bitten Sie, den ausstehenden Betrag innerhalb von 14 Tagen zu überweisen.`;
      case 2:
        return `${salutation},\n\ntrotz unserer bisherigen Erinnerungen ist der Rechnungsbetrag leider noch nicht auf unserem Konto eingegangen.\n\nWir fordern Sie hiermit auf, den ausstehenden Betrag innerhalb von 10 Tagen zu begleichen.`;
      default:
        return `${salutation},\n\nleider müssen wir feststellen, dass Sie trotz unserer bisherigen Mahnungen den ausstehenden Rechnungsbetrag nicht beglichen haben.\n\nDies ist unsere letzte Mahnung. Sollte der Betrag nicht innerhalb von 7 Tagen auf unserem Konto eingehen, sehen wir uns gezwungen, rechtliche Schritte einzuleiten.`;
    }
  };

  const getClosingText = () => {
    return level >= 3
      ? 'Wir erwarten Ihre Zahlung innerhalb von 7 Tagen.'
      : 'Für Rückfragen stehen wir Ihnen gerne zur Verfügung.';
  };

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            {profile.logo_url && (
              <Image
                src={profile.logo_url}
                style={[styles.logo, { height: Math.min(profile.logo_size || 35, 35) }]}
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
          <Text style={styles.bodyText}>{getReminderText()}</Text>
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
          <Text style={styles.closingText}>{getClosingText()}</Text>
          <Text style={styles.greeting}>Mit freundlichen Grüßen</Text>
          {profile.signature_url ? (
            <Image
              src={profile.signature_url}
              style={[styles.signature, { height: Math.min(profile.signature_size || 30, 30) }]}
            />
          ) : (
            <View style={{ height: 25, marginTop: 4, marginBottom: 4 }} />
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

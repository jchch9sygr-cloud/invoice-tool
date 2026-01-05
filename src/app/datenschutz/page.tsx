import Link from 'next/link';
import { Zap, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Datenschutzerklärung | RechnungsBlitz',
};

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Navigation */}
      <nav className="border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-blue-500" />
            <span className="text-xl font-bold text-white">RechnungsBlitz</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Zurück
            </Button>
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-white mb-8">Datenschutzerklärung</h1>

        <div className="prose prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Datenschutz auf einen Blick</h2>
            <h3 className="text-lg font-medium text-gray-200 mt-4 mb-2">Allgemeine Hinweise</h3>
            <p className="text-gray-400">
              Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen
              Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen
              Sie persönlich identifiziert werden können.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Datenerfassung auf dieser Website</h2>

            <h3 className="text-lg font-medium text-gray-200 mt-4 mb-2">Registrierung und Benutzerkonto</h3>
            <p className="text-gray-400">
              Bei der Registrierung erfassen wir folgende Daten:
            </p>
            <ul className="list-disc list-inside text-gray-400 mt-2">
              <li>E-Mail-Adresse</li>
              <li>Passwort (verschlüsselt gespeichert)</li>
            </ul>
            <p className="text-gray-400 mt-2">
              <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)
            </p>

            <h3 className="text-lg font-medium text-gray-200 mt-4 mb-2">Firmendaten</h3>
            <p className="text-gray-400">
              Zur Erstellung von Rechnungen und Angeboten speichern wir die von Ihnen eingegebenen Firmendaten:
            </p>
            <ul className="list-disc list-inside text-gray-400 mt-2">
              <li>Firmenname, Adresse</li>
              <li>Kontaktdaten (Telefon, E-Mail)</li>
              <li>Steuernummer</li>
              <li>Bankverbindung</li>
              <li>Logo (optional)</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-200 mt-4 mb-2">Kundendaten</h3>
            <p className="text-gray-400">
              Zur Rechnungsstellung speichern wir die Daten Ihrer Kunden:
            </p>
            <ul className="list-disc list-inside text-gray-400 mt-2">
              <li>Name, Firma</li>
              <li>Adresse</li>
              <li>E-Mail (optional)</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-200 mt-4 mb-2">Rechnungs- und Angebotsdaten</h3>
            <p className="text-gray-400">
              Wir speichern Ihre erstellten Dokumente (Rechnungen und Angebote) inklusive aller
              eingegebenen Positionen und Beträge.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Hosting und Drittanbieter</h2>

            <h3 className="text-lg font-medium text-gray-200 mt-4 mb-2">Supabase</h3>
            <p className="text-gray-400">
              Wir nutzen Supabase für die Datenspeicherung und Authentifizierung. Supabase ist ein
              Service der Supabase, Inc. mit Servern in der EU. Weitere Informationen finden Sie in der{' '}
              <a
                href="https://supabase.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                Datenschutzerklärung von Supabase
              </a>.
            </p>

            <h3 className="text-lg font-medium text-gray-200 mt-4 mb-2">Stripe</h3>
            <p className="text-gray-400">
              Für die Zahlungsabwicklung nutzen wir Stripe. Stripe verarbeitet Ihre Zahlungsdaten.
              Wir erhalten keine vollständigen Kreditkartennummern. Weitere Informationen:{' '}
              <a
                href="https://stripe.com/de/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                Stripe Datenschutzerklärung
              </a>.
            </p>

            <h3 className="text-lg font-medium text-gray-200 mt-4 mb-2">Vercel</h3>
            <p className="text-gray-400">
              Diese Website wird bei Vercel gehostet. Server befinden sich in der EU. Weitere Informationen:{' '}
              <a
                href="https://vercel.com/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                Vercel Datenschutzerklärung
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Ihre Rechte</h2>
            <p className="text-gray-400">Sie haben folgende Rechte:</p>
            <ul className="list-disc list-inside text-gray-400 mt-2">
              <li><strong>Auskunft:</strong> Welche Daten speichern wir über Sie?</li>
              <li><strong>Berichtigung:</strong> Korrektur falscher Daten</li>
              <li><strong>Löschung:</strong> Löschung Ihrer Daten (Art. 17 DSGVO)</li>
              <li><strong>Einschränkung:</strong> Einschränkung der Verarbeitung</li>
              <li><strong>Datenübertragbarkeit:</strong> Export Ihrer Daten</li>
              <li><strong>Widerspruch:</strong> Gegen die Verarbeitung</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Datenlöschung</h2>
            <p className="text-gray-400">
              Bei Löschung Ihres Kontos werden alle Ihre Daten (Profil, Kunden, Dokumente) unwiderruflich gelöscht.
              Gesetzliche Aufbewahrungspflichten (z.B. für Rechnungen: 10 Jahre gemäß HGB/AO) bleiben unberührt.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Cookies</h2>
            <p className="text-gray-400">
              Wir verwenden nur technisch notwendige Cookies für die Authentifizierung (Session-Cookies).
              Es werden keine Tracking- oder Werbe-Cookies eingesetzt.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. SSL-Verschlüsselung</h2>
            <p className="text-gray-400">
              Diese Seite nutzt aus Sicherheitsgründen eine SSL-Verschlüsselung. Eine verschlüsselte
              Verbindung erkennen Sie an &quot;https://&quot; in der Adresszeile Ihres Browsers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Beschwerderecht</h2>
            <p className="text-gray-400">
              Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Aktualität</h2>
            <p className="text-gray-400">
              Diese Datenschutzerklärung ist aktuell gültig und wurde zuletzt im Januar 2026 aktualisiert.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

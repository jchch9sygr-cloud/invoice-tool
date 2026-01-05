import Link from 'next/link';
import { Zap, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Navigation */}
      <nav className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-blue-500" />
            <span className="text-xl font-bold text-white">RechnungsBlitz</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Anmelden</Button>
            </Link>
            <Link href="/register">
              <Button>Kostenlos starten</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            Einfach Rechnungen schreiben
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Kunde anlegen. Rechnung ausfüllen. PDF herunterladen.
            Kein Logo nötig. Keine Komplexität.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8">
                Kostenlos testen
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <span className="text-gray-500">oder</span>
            <Link href="#pricing">
              <Button variant="outline" size="lg" className="text-lg px-8">
                60 € Lifetime kaufen
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            3 Dokumente gratis. Danach 60 € einmalig oder 10 €/Monat.
          </p>
        </div>
      </section>

      {/* Problem */}
      <section className="py-16 px-4 bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-white mb-8">Andere Tools sind zu kompliziert</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              'Buchhaltungssoftware hat zu viele Funktionen',
              'Monatliche Abos für wenige Rechnungen',
              'Excel-Vorlagen machen Arbeit',
              'Du brauchst nur ein korrektes PDF',
            ].map((problem, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-gray-800 rounded-lg border border-gray-700">
                <span className="text-gray-500 text-lg">-</span>
                <p className="text-gray-400">{problem}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            So einfach geht's
          </h2>
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="p-6">
              <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-gray-500">
                1
              </div>
              <h3 className="font-semibold text-white mb-2">Kunde anlegen</h3>
              <p className="text-gray-500">Name und Adresse eingeben</p>
            </div>
            <div className="p-6">
              <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-gray-500">
                2
              </div>
              <h3 className="font-semibold text-white mb-2">Positionen eintragen</h3>
              <p className="text-gray-500">Leistung, Menge, Preis</p>
            </div>
            <div className="p-6">
              <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-gray-500">
                3
              </div>
              <h3 className="font-semibold text-white mb-2">PDF herunterladen</h3>
              <p className="text-gray-500">Ein Klick</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-12">Was du bekommst</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'Rechnungen & Angebote', desc: 'PDF-Export, sieht professionell aus' },
              { title: 'Kundenverwaltung', desc: 'Einmal anlegen, immer wieder nutzen' },
              { title: 'Kleinunternehmer (§19)', desc: 'Hinweistext optional aktivierbar' },
              { title: 'Logo optional', desc: 'Kannst du hochladen, musst du aber nicht' },
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
                <Check className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-white">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-4" id="pricing">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-4">Preise</h2>
          <p className="text-center text-gray-400 mb-12">
            3 Dokumente kostenlos zum Testen.
          </p>
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {/* Lifetime */}
            <div className="border-2 border-blue-500 rounded-2xl p-8 relative bg-gray-900">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                Einmalig
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Lifetime</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold text-white">60 €</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Unbegrenzte Dokumente',
                  'Für immer nutzbar',
                  'Keine weiteren Kosten',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-300">
                    <Check className="h-5 w-5 text-green-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button className="w-full" size="lg">
                  Lifetime kaufen
                </Button>
              </Link>
            </div>

            {/* Monthly */}
            <div className="border border-gray-700 rounded-2xl p-8 bg-gray-900">
              <h3 className="text-xl font-bold text-white mb-2">Monatlich</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold text-white">10 €</span>
                <span className="text-gray-400">/ Monat</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Unbegrenzte Dokumente',
                  'Monatlich kündbar',
                  'Zugang bis Monatsende',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-300">
                    <Check className="h-5 w-5 text-green-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button variant="outline" className="w-full" size="lg">
                  Abo starten
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Target Audience */}
      <section className="py-16 px-4 bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-white mb-12">Für wen ist das?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Passt für - Grüne Karte */}
            <div className="bg-gray-800 border border-green-500/30 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="h-5 w-5 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Passt für dich</h3>
              </div>
              <ul className="space-y-4">
                {[
                  { title: 'Freelancer', desc: 'Designer, Entwickler, Berater' },
                  { title: 'Nebenberuflich Selbstständig', desc: 'Nebeneinkommen, kleine Projekte' },
                  { title: 'Kleinunternehmer', desc: 'Mit §19 UStG Regelung' },
                  { title: 'Wenige Rechnungen', desc: 'Bis ca. 20 Rechnungen/Monat' },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-medium">{item.title}</p>
                      <p className="text-gray-400 text-sm">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Passt nicht für - Dezente Karte */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                  <span className="text-gray-400 text-lg">—</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-400">Eher nicht geeignet</h3>
              </div>
              <ul className="space-y-4">
                {[
                  { title: 'Buchhaltungspflicht', desc: 'Du brauchst ein vollständiges Buchhaltungstool' },
                  { title: 'Elster-Anbindung', desc: 'Direktübertragung ans Finanzamt nicht möglich' },
                  { title: 'Viele Features', desc: 'Lagerverwaltung, Mahnwesen, etc.' },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-gray-500 shrink-0 mt-0.5">—</span>
                    <div>
                      <p className="text-gray-300">{item.title}</p>
                      <p className="text-gray-500 text-sm">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-white mb-8">Fragen</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Brauche ich ein Logo?',
                a: 'Nein. Du kannst eins hochladen, musst aber nicht.',
              },
              {
                q: 'Kleinunternehmer?',
                a: 'Ja. Toggle in den Einstellungen, §19-Hinweis erscheint automatisch.',
              },
              {
                q: 'Was kostet das?',
                a: '3 Dokumente gratis. Danach 60 € einmalig oder 10 €/Monat.',
              },
              {
                q: 'Und wenn ich kündige?',
                a: 'Beim Abo: Zugang bis Monatsende. Bei Lifetime: Für immer nutzbar.',
              },
            ].map((faq, i) => (
              <div key={i} className="bg-gray-800 rounded-lg border border-gray-700 p-5">
                <h3 className="font-semibold text-white mb-1">{faq.q}</h3>
                <p className="text-gray-400 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 bg-gray-900 border-t border-gray-800">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-gray-400 mb-4">
            Einfach ausprobieren. 3 Dokumente gratis.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8">
                Kostenlos starten
              </Button>
            </Link>
            <Link href="#pricing">
              <Button variant="outline" size="lg" className="text-lg px-8">
                60 € Lifetime
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-500">
            <Zap className="h-4 w-4" />
            <span className="text-sm">RechnungsBlitz</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/impressum" className="hover:text-gray-300 transition-colors">
              Impressum
            </Link>
            <Link href="/datenschutz" className="hover:text-gray-300 transition-colors">
              Datenschutz
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

import Link from 'next/link';
import { Zap, Check, FileText, Users, Clock, Shield, ArrowRight } from 'lucide-react';
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
            Rechnung in 2 Minuten. Fertig.
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Das einfachste Rechnungstool für Freelancer und Kleinunternehmer in Deutschland.
            Keine Buchhaltung. Kein Abo-Zwang. Keine Komplexität.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8">
                Jetzt kostenlos starten
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            3 Rechnungen gratis. Keine Kreditkarte nötig.
          </p>
        </div>
      </section>

      {/* Problem */}
      <section className="py-16 px-4 bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-white mb-8">Du kennst das:</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              'Lexoffice, SevDesk & Co. sind überladen mit Funktionen, die du nie brauchst',
              'Du schreibst 3-5 Rechnungen im Monat – und zahlst trotzdem 15€+',
              'Excel-Vorlagen sehen unprofessionell aus',
              'Du willst einfach nur eine korrekte Rechnung als PDF',
            ].map((problem, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-gray-800 rounded-lg border border-gray-700">
                <span className="text-red-400 text-lg">✕</span>
                <p className="text-gray-300">{problem}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            RechnungsBlitz macht genau eine Sache – und die richtig.
          </h2>
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="p-6">
              <div className="w-12 h-12 bg-blue-900/50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">Kunde anlegen</h3>
              <p className="text-gray-500">30 Sekunden</p>
            </div>
            <div className="p-6">
              <div className="w-12 h-12 bg-blue-900/50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">Rechnung ausfüllen</h3>
              <p className="text-gray-500">60 Sekunden</p>
            </div>
            <div className="p-6">
              <div className="w-12 h-12 bg-blue-900/50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">PDF exportieren</h3>
              <p className="text-gray-500">1 Klick</p>
            </div>
          </div>
          <p className="mt-8 text-lg text-gray-400">
            <strong className="text-white">Fertig.</strong> Keine Bankanbindung. Keine Steuerberechnung. Keine 47 Untermenüs.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-12">Alles was du brauchst</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: Users, title: 'Kunden verwalten', desc: 'Einmal anlegen, immer wieder nutzen' },
              { icon: FileText, title: 'Professionelle PDFs', desc: 'Mit deinem Logo, korrekt formatiert' },
              { icon: Clock, title: 'Automatische Nummerierung', desc: 'RE-2025-0001, RE-2025-0002, ...' },
              { icon: Check, title: 'Kleinunternehmer-ready', desc: '§19-Hinweis mit einem Klick' },
              { icon: FileText, title: 'Angebote & Rechnungen', desc: 'Gleiches Prinzip, zwei Templates' },
              { icon: Shield, title: 'DSGVO-konform', desc: 'Server in der EU, minimale Datenspeicherung' },
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
                <div className="w-10 h-10 bg-blue-900/50 rounded-lg flex items-center justify-center shrink-0">
                  <feature.icon className="h-5 w-5 text-blue-400" />
                </div>
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
          <h2 className="text-3xl font-bold text-center text-white mb-4">Einfache Preise</h2>
          <p className="text-center text-gray-400 mb-12">
            Keine versteckten Kosten. Keine automatische Verlängerung beim Einmalkauf.
          </p>
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {/* Lifetime */}
            <div className="border-2 border-blue-500 rounded-2xl p-8 relative bg-gray-900">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                Beliebt
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Einmalzahlung</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold text-white">29 €</span>
                <span className="text-gray-400">einmalig</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Unbegrenzte Rechnungen',
                  'Unbegrenzte Angebote',
                  'Alle Features inklusive',
                  'Lebenslanger Zugang',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-300">
                    <Check className="h-5 w-5 text-green-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button className="w-full" size="lg">
                  Jetzt kaufen
                </Button>
              </Link>
            </div>

            {/* Monthly */}
            <div className="border border-gray-700 rounded-2xl p-8 bg-gray-900">
              <h3 className="text-xl font-bold text-white mb-2">Monatlich</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold text-white">5 €</span>
                <span className="text-gray-400">/ Monat</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Unbegrenzte Rechnungen',
                  'Unbegrenzte Angebote',
                  'Alle Features inklusive',
                  'Monatlich kündbar',
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

      {/* Comparison */}
      <section className="py-16 px-4 bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-12">Warum RechnungsBlitz?</h2>
          <div className="overflow-x-auto">
            <table className="w-full bg-gray-800 rounded-xl border border-gray-700">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="p-4 text-left text-gray-400"></th>
                  <th className="p-4 text-center font-semibold text-blue-400">RechnungsBlitz</th>
                  <th className="p-4 text-center text-gray-500">Lexoffice</th>
                  <th className="p-4 text-center text-gray-500">SevDesk</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-700">
                  <td className="p-4 font-medium text-gray-300">Preis/Monat</td>
                  <td className="p-4 text-center text-green-400 font-semibold">0-5 €</td>
                  <td className="p-4 text-center text-gray-500">7-35 €</td>
                  <td className="p-4 text-center text-gray-500">9-43 €</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="p-4 font-medium text-gray-300">Einrichtungszeit</td>
                  <td className="p-4 text-center text-green-400 font-semibold">2 Min</td>
                  <td className="p-4 text-center text-gray-500">30+ Min</td>
                  <td className="p-4 text-center text-gray-500">30+ Min</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="p-4 font-medium text-gray-300">Lernkurve</td>
                  <td className="p-4 text-center text-green-400 font-semibold">Keine</td>
                  <td className="p-4 text-center text-gray-500">Hoch</td>
                  <td className="p-4 text-center text-gray-500">Hoch</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-gray-300">Für Wenignutzer</td>
                  <td className="p-4 text-center"><Check className="h-5 w-5 text-green-400 mx-auto" /></td>
                  <td className="p-4 text-center text-gray-600">✕</td>
                  <td className="p-4 text-center text-gray-600">✕</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Target Audience */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-xl font-bold mb-4 text-green-400">Perfekt für:</h3>
              <ul className="space-y-2">
                {[
                  'Freelancer & Berater',
                  'Coaches & Trainer',
                  'Nebenberuflich Selbstständige',
                  'Handwerker mit wenig Rechnungen',
                  'Kleinunternehmer (§19 UStG)',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-300">
                    <Check className="h-5 w-5 text-green-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4 text-gray-500">Nicht für:</h3>
              <ul className="space-y-2 text-gray-500">
                {[
                  'Unternehmen mit Buchhaltungspflicht',
                  'Wer Elster-Anbindung braucht',
                  'Wer Steuerberechnungen braucht',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-gray-600">✕</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-gray-900">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-12">Häufige Fragen</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Kann ich mein Logo hochladen?',
                a: 'Ja. Einmal hochladen, erscheint auf allen Rechnungen.',
              },
              {
                q: 'Funktioniert das mit der Kleinunternehmerregelung?',
                a: 'Ja. Ein Toggle in den Einstellungen. Der §19-Hinweis erscheint automatisch auf allen Dokumenten.',
              },
              {
                q: 'Gibt es eine Gratis-Version?',
                a: '3 Rechnungen/Angebote kostenlos. Danach einmalig 29€ oder 5€/Monat.',
              },
              {
                q: 'Wo werden meine Daten gespeichert?',
                a: 'Server in der EU. DSGVO-konform. Wir speichern nur das Nötigste.',
              },
              {
                q: 'Was passiert, wenn ich kündige?',
                a: 'Beim Abo: Zugang endet zum Monatsende. Beim Einmalkauf: Lebenslanger Zugang – kein Risiko.',
              },
            ].map((faq, i) => (
              <div key={i} className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h3 className="font-semibold text-white mb-2">{faq.q}</h3>
                <p className="text-gray-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-blue-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Schluss mit kompliziert.
          </h2>
          <p className="text-blue-100 mb-8">
            Erstelle deine erste Rechnung in unter 2 Minuten.
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Jetzt kostenlos starten
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Zap, Check, ArrowRight, FileText, Users, Download, Clock, Shield,
  Sparkles, Menu, X, FileDown, Edit3, Search, CreditCard, AlertTriangle,
  RefreshCw, PenLine
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 overflow-x-hidden">
      {/* Navigation */}
      <nav className="border-b border-gray-800/50 backdrop-blur-xl sticky top-0 z-50 bg-gray-950/90">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold text-white">RechnungsBlitz</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">Anmelden</Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Kostenlos starten
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 text-gray-400 hover:text-white transition-colors"
              aria-label="Menü"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-gray-800 bg-gray-950 animate-in slide-in-from-top-2 duration-200">
            <div className="px-4 py-4 space-y-3">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full justify-center">
                  Anmelden
                </Button>
              </Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full justify-center bg-blue-600 hover:bg-blue-700">
                  Kostenlos starten
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 px-4 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-3xl" />

        <div className="max-w-4xl mx-auto text-center relative">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs sm:text-sm mb-6 sm:mb-8">
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Einfach. Schnell. Professionell.</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 leading-[1.1] tracking-tight">
            Rechnungen erstellen
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              in Sekunden
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-lg md:text-xl text-gray-400 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed px-2">
            Keine komplizierte Software. Kein Buchhaltungs-Overkill.
            <span className="hidden sm:inline"><br /></span>
            {' '}Rechnung erstellen, PDF oder Word herunterladen, fertig.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 h-12 sm:h-14 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25">
                Kostenlos starten
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
            <Link href="#pricing" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 h-12 sm:h-14">
                Preise ansehen
              </Button>
            </Link>
          </div>

          {/* Trust Text */}
          <p className="mt-6 text-xs sm:text-sm text-gray-500">
            3 Dokumente gratis · Keine Kreditkarte · Sofort loslegen
          </p>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-6 sm:py-8 px-4 border-y border-gray-800/50 bg-gray-900/30">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center">
            <div className="px-2">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">100%</div>
              <div className="text-[10px] sm:text-xs md:text-sm text-gray-500 mt-0.5">DSGVO-konform</div>
            </div>
            <div className="px-2">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">30s</div>
              <div className="text-[10px] sm:text-xs md:text-sm text-gray-500 mt-0.5">zur Rechnung</div>
            </div>
            <div className="px-2">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">GoBD</div>
              <div className="text-[10px] sm:text-xs md:text-sm text-gray-500 mt-0.5">konforme PDFs</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
              So einfach geht's
            </h2>
            <p className="text-sm sm:text-base text-gray-400">In drei Schritten zur fertigen Rechnung</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {[
              {
                icon: Users,
                step: '01',
                title: 'Kunde anlegen',
                desc: 'Name und Adresse einmal eingeben, immer wieder verwenden',
              },
              {
                icon: FileText,
                step: '02',
                title: 'Rechnung ausfüllen',
                desc: 'Positionen eintragen, MwSt. wird automatisch berechnet',
              },
              {
                icon: Download,
                step: '03',
                title: 'Exportieren',
                desc: 'Als PDF oder Word herunterladen – ein Klick genügt',
              },
            ].map((item, i) => (
              <div key={i} className="relative group">
                <div className="absolute -inset-px bg-gradient-to-b from-blue-500/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative p-6 sm:p-8 bg-gray-900/50 border border-gray-800 rounded-2xl h-full hover:border-gray-700 transition-colors">
                  <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/10 rounded-xl flex items-center justify-center shrink-0">
                      <item.icon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />
                    </div>
                    <span className="text-3xl sm:text-4xl font-bold text-gray-800">{item.step}</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-sm sm:text-base text-gray-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-20 px-4 bg-gray-900/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
              Alles was du brauchst
            </h2>
            <p className="text-sm sm:text-base text-gray-400">Keine unnötigen Funktionen – nur das Wesentliche</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {[
              { icon: FileText, title: 'Rechnungen & Angebote', desc: 'Professionelle Dokumente im DIN 5008 Format' },
              { icon: AlertTriangle, title: 'Mahnwesen komplett', desc: 'Zahlungserinnerung + 3 Mahnstufen', highlight: true },
              { icon: Clock, title: 'Fälligkeits-Alarm', desc: 'Automatische Benachrichtigung bei Überfälligkeit', highlight: true },
              { icon: FileDown, title: 'PDF & Word Export', desc: 'Alle Dokumente als PDF oder Word' },
              { icon: RefreshCw, title: 'Angebot → Rechnung', desc: 'Mit einem Klick umwandeln' },
              { icon: Users, title: 'Kundenverwaltung', desc: 'Einmal anlegen, immer wieder nutzen' },
              { icon: Search, title: 'Globale Suche', desc: 'Finde alles sofort mit ⌘K' },
              { icon: Sparkles, title: 'Onboarding-Guide', desc: 'Schritt-für-Schritt Anleitung integriert' },
              { icon: Edit3, title: 'Logo & Unterschrift', desc: 'Hochladen, Größe anpassen – fertig' },
              { icon: Shield, title: 'Kleinunternehmer §19', desc: 'Ein Klick aktiviert den Hinweis' },
              { icon: CreditCard, title: 'Bezahlt-Status', desc: 'Markieren und Dokument wird gesperrt' },
              { icon: Zap, title: 'Blitzschnell', desc: 'Keine Wartezeiten, keine Ladebalken' },
            ].map((feature, i) => (
              <div
                key={i}
                className={`p-4 sm:p-5 md:p-6 border rounded-xl hover:border-gray-700 transition-all duration-200 ${
                  feature.highlight
                    ? 'bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/15'
                    : 'bg-gray-800/30 border-gray-800 hover:bg-gray-800/50'
                }`}
              >
                <feature.icon className={`h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 mb-3 sm:mb-4 ${
                  feature.highlight ? 'text-orange-400' : 'text-blue-400'
                }`} />
                <h3 className="font-semibold text-white text-sm sm:text-base mb-1 sm:mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 sm:py-20 px-4" id="pricing">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
              Einfache Preise
            </h2>
            <p className="text-sm sm:text-base text-gray-400">
              Starte kostenlos. Upgrade wenn du mehr brauchst.
            </p>
          </div>

          {/* Mobile: Stacked Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Free */}
            <div className="border border-gray-800 rounded-2xl p-6 sm:p-8 bg-gray-900/30 order-2 md:order-1">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Kostenlos</h3>
              <div className="flex items-baseline gap-1 mb-4 sm:mb-6">
                <span className="text-3xl sm:text-4xl font-bold text-white">0 €</span>
              </div>
              <ul className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8">
                {['3 Dokumente', 'PDF & Word Export', 'Kundenverwaltung'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm sm:text-base text-gray-400">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block">
                <Button variant="outline" className="w-full h-11 sm:h-12">
                  Kostenlos starten
                </Button>
              </Link>
            </div>

            {/* Yearly - Highlighted */}
            <div className="border-2 border-blue-500 rounded-2xl p-6 sm:p-8 relative bg-gray-900 shadow-xl shadow-blue-500/10 order-1 md:order-2">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap">
                Beliebt
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Jahresabo</h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl sm:text-4xl font-bold text-white">30 €</span>
                <span className="text-sm sm:text-base text-gray-400">/ Jahr</span>
              </div>
              <p className="text-xs sm:text-sm text-green-400 mb-4 sm:mb-6">Nur 2,50 € pro Monat</p>
              <ul className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8">
                {['Unbegrenzte Dokumente', 'Mahnwesen inkl.', 'PDF & Word Export', 'Jährlich kündbar'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm sm:text-base text-gray-300">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block">
                <Button className="w-full h-11 sm:h-12 bg-blue-600 hover:bg-blue-700">
                  Jetzt starten
                </Button>
              </Link>
            </div>

            {/* Monthly */}
            <div className="border border-gray-800 rounded-2xl p-6 sm:p-8 bg-gray-900/30 order-3">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Monatsabo</h3>
              <div className="flex items-baseline gap-1 mb-4 sm:mb-6">
                <span className="text-3xl sm:text-4xl font-bold text-white">5 €</span>
                <span className="text-sm sm:text-base text-gray-400">/ Monat</span>
              </div>
              <ul className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8">
                {['Unbegrenzte Dokumente', 'Mahnwesen inkl.', 'Monatlich kündbar'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm sm:text-base text-gray-400">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block">
                <Button variant="outline" className="w-full h-11 sm:h-12">
                  Monatlich starten
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Target Audience */}
      <section className="py-16 sm:py-20 px-4 bg-gray-900/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
              Perfekt für
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { title: 'Freelancer', desc: 'Designer, Entwickler, Texter' },
              { title: 'Nebenberufler', desc: 'Nebeneinkommen dokumentieren' },
              { title: 'Kleinunternehmer', desc: 'Mit §19 UStG Regelung' },
              { title: 'Gründer', desc: 'Schnell starten, günstig bleiben' },
            ].map((item, i) => (
              <div key={i} className="text-center p-4 sm:p-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Check className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
                </div>
                <h3 className="font-semibold text-white text-sm sm:text-base mb-1">{item.title}</h3>
                <p className="text-gray-500 text-xs sm:text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-white mb-10 sm:mb-12">
            Häufige Fragen
          </h2>
          <div className="space-y-3 sm:space-y-4">
            {[
              {
                q: 'Wie funktioniert das Mahnwesen?',
                a: 'Überfällige Rechnungen werden im Dashboard angezeigt mit Popup zum Versenden. Gesetzeskonform: Erst Zahlungserinnerung, dann 1. Mahnung, 2. Mahnung und Letzte Mahnung. Texte sind vorgefertigt und editierbar.',
              },
              {
                q: 'Kann ich Rechnungen nachträglich bearbeiten?',
                a: 'Ja! Solange eine Rechnung nicht als "bezahlt" markiert ist, kannst du sie jederzeit bearbeiten. Bezahlte Rechnungen werden automatisch gesperrt.',
              },
              {
                q: 'Kann ich ein Angebot in eine Rechnung umwandeln?',
                a: 'Ja, mit einem Klick. Alle Daten werden übernommen – Kunde, Positionen, Beträge. Du musst nichts neu eingeben.',
              },
              {
                q: 'Brauche ich ein Logo oder Unterschrift?',
                a: 'Nein, beides ist optional. Du kannst Logo und Unterschrift hochladen und die Größe anpassen. Ohne sehen deine Dokumente trotzdem professionell aus.',
              },
              {
                q: 'Bin ich Kleinunternehmer – was muss ich tun?',
                a: 'Einfach in den Einstellungen den Schalter aktivieren. Der §19-Hinweis erscheint dann automatisch auf allen Dokumenten.',
              },
              {
                q: 'Kann ich kündigen?',
                a: 'Jederzeit mit einem Klick in den Einstellungen. Beim Monatsabo hast du Zugang bis zum Monatsende, beim Jahresabo bis zum Jahresende.',
              },
              {
                q: 'Sind die Rechnungen rechtsgültig?',
                a: 'Ja. Alle Dokumente folgen dem DIN 5008 Briefstandard, enthalten alle Pflichtangaben und sind GoBD-konform.',
              },
              {
                q: 'Ich bin Anfänger – wo fange ich an?',
                a: 'Beim ersten Login siehst du eine Schritt-für-Schritt Anleitung: 1. Firmendaten einrichten, 2. Kunden anlegen, 3. Rechnung erstellen. In den Einstellungen findest du außerdem Hilfe-Panels mit Erklärungen.',
              },
            ].map((faq, i) => (
              <div key={i} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 sm:p-6 hover:border-gray-700 transition-colors">
                <h3 className="font-semibold text-white text-sm sm:text-base mb-2">{faq.q}</h3>
                <p className="text-gray-400 text-sm sm:text-base leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-b from-blue-500/10 to-transparent border border-blue-500/20 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
              Bereit für einfache Rechnungen?
            </h2>
            <p className="text-sm sm:text-base text-gray-400 mb-6 sm:mb-8 max-w-md mx-auto">
              Starte jetzt kostenlos mit 3 Dokumenten. Keine Kreditkarte nötig.
            </p>
            <Link href="/register">
              <Button size="lg" className="text-base sm:text-lg px-8 sm:px-10 h-12 sm:h-14 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25">
                Kostenlos starten
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 sm:py-8 px-4 border-t border-gray-800/50">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-500">
            <Zap className="h-4 w-4" />
            <span className="text-sm">RechnungsBlitz © {new Date().getFullYear()}</span>
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

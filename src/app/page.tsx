'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Zap, Check, ArrowRight, FileText, Users, Download, Shield,
  Sparkles, Menu, X, FileDown, Edit3, Search, CreditCard, AlertTriangle,
  RefreshCw, Mail, ChevronRight, Play, Bell, Send, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 overflow-x-hidden">
      {/* Navigation */}
      <nav className="border-b border-gray-800/50 backdrop-blur-xl sticky top-0 z-50 bg-gray-950/90">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold text-white">RechnungsBlitz</span>
            </Link>

            <div className="hidden sm:flex items-center gap-4">
              <a href="#funktionen" className="text-sm text-gray-400 hover:text-white transition-colors">
                Funktionen
              </a>
              <a href="#so-gehts" className="text-sm text-gray-400 hover:text-white transition-colors">
                So gehts
              </a>
              <a href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors">
                Preise
              </a>
              <div className="w-px h-6 bg-gray-700" />
              <Link href="/login">
                <Button variant="ghost" size="sm">Anmelden</Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Kostenlos starten
                </Button>
              </Link>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 text-gray-400 hover:text-white transition-colors"
              aria-label="Menü"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-gray-800 bg-gray-950 animate-in slide-in-from-top-2 duration-200">
            <div className="px-4 py-4 space-y-3">
              <a href="#funktionen" className="block py-2 text-gray-300" onClick={() => setMobileMenuOpen(false)}>
                Funktionen
              </a>
              <a href="#so-gehts" className="block py-2 text-gray-300" onClick={() => setMobileMenuOpen(false)}>
                So gehts
              </a>
              <a href="#pricing" className="block py-2 text-gray-300" onClick={() => setMobileMenuOpen(false)}>
                Preise
              </a>
              <div className="pt-4 flex flex-col gap-4">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full justify-center bg-blue-600 hover:bg-blue-700">
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
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-32 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-3xl" />

        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm mb-8">
            <Sparkles className="h-4 w-4" />
            <span>Für Freelancer, Kleinunternehmer & Gründer</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
            Rechnungen erstellen
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              ohne Buchhaltungs-Chaos
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            RechnungsBlitz ist die einfachste Lösung für professionelle Rechnungen.
            Keine Einarbeitung nötig – Rechnung erstellen, PDF exportieren, fertig.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 h-14 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25">
                Kostenlos ausprobieren
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href="#so-gehts">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 h-14 gap-2">
                <Play className="h-5 w-5" />
                So funktionierts
              </Button>
            </a>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-green-500" />
              3 Dokumente gratis
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-green-500" />
              Keine Kreditkarte nötig
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-green-500" />
              DSGVO-konform
            </span>
          </div>
        </div>
      </section>

      {/* Was ist RechnungsBlitz? */}
      <section className="py-16 sm:py-20 px-4 bg-gray-900/30 border-y border-gray-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Was ist RechnungsBlitz?
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Eine schlanke Web-App für alle, die schnell professionelle Rechnungen brauchen –
              ohne sich in komplizierte Buchhaltungssoftware einarbeiten zu müssen.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 text-center">
              <div className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FileText className="h-7 w-7 text-blue-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">Rechnungen & Angebote</h3>
              <p className="text-sm text-gray-400">
                Erstelle professionelle Dokumente im DIN 5008 Format – dem deutschen Standard für Geschäftsbriefe.
              </p>
            </div>

            <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 text-center">
              <div className="w-14 h-14 bg-green-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="h-7 w-7 text-green-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">Kundenverwaltung</h3>
              <p className="text-sm text-gray-400">
                Lege Kunden einmal an und wähle sie bei jeder Rechnung aus. Keine doppelte Dateneingabe mehr.
              </p>
            </div>

            <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 text-center">
              <div className="w-14 h-14 bg-orange-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Bell className="h-7 w-7 text-orange-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">Mahnwesen</h3>
              <p className="text-sm text-gray-400">
                Werde automatisch erinnert, wenn Rechnungen überfällig sind. Versende Mahnungen per E-Mail mit einem Klick.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* So geht's - Einfach erklärt */}
      <section className="py-16 sm:py-20 px-4" id="so-gehts">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
              So einfach gehts
            </h2>
            <p className="text-gray-400">
              In drei Schritten zur fertigen Rechnung
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: '1',
                icon: Users,
                title: 'Kunde wählen',
                desc: 'Wähle einen bestehenden Kunden oder lege einen neuen an.',
                color: 'blue',
              },
              {
                step: '2',
                icon: FileText,
                title: 'Rechnung ausfüllen',
                desc: 'Positionen eintragen – MwSt. wird automatisch berechnet.',
                color: 'purple',
              },
              {
                step: '3',
                icon: Download,
                title: 'Exportieren',
                desc: 'Als PDF oder Word herunterladen. Fertig!',
                color: 'green',
              },
            ].map((item, i) => (
              <div key={i} className="relative group">
                <div className="absolute -inset-px bg-gradient-to-b from-blue-500/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative p-6 bg-gray-900/50 border border-gray-800 rounded-2xl h-full hover:border-gray-700 transition-colors">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      item.color === 'blue' ? 'bg-blue-500/10' :
                      item.color === 'purple' ? 'bg-purple-500/10' : 'bg-green-500/10'
                    }`}>
                      <item.icon className={`h-6 w-6 ${
                        item.color === 'blue' ? 'text-blue-400' :
                        item.color === 'purple' ? 'text-purple-400' : 'text-green-400'
                      }`} />
                    </div>
                    <span className="text-4xl font-bold text-gray-800">{item.step}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mahnwesen erklärt */}
      <section className="py-16 sm:py-20 px-4 bg-gradient-to-b from-orange-500/5 to-transparent">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-sm mb-4">
              Mahnwesen
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Nie wieder vergessene Rechnungen
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Das integrierte Mahnwesen erinnert dich automatisch an überfällige Rechnungen
              und hilft dir, professionell zu mahnen.
            </p>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 sm:p-8">
            <h3 className="font-semibold text-white mb-6 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-400" />
              So funktioniert das Mahnwesen:
            </h3>

            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center shrink-0">
                  <Bell className="h-4 w-4 text-yellow-400" />
                </div>
                <div>
                  <p className="font-medium text-white">Automatische Erinnerung</p>
                  <p className="text-sm text-gray-400">
                    Sobald eine Rechnung überfällig ist, siehst du ein Pop-up im Dashboard.
                    Du behältst immer den Überblick.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-cyan-400 text-sm font-bold">1</span>
                </div>
                <div>
                  <p className="font-medium text-white">Zahlungserinnerung</p>
                  <p className="text-sm text-gray-400">
                    Der freundliche erste Schritt. Erinnere deinen Kunden höflich an die offene Rechnung.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-yellow-400 text-sm font-bold">2</span>
                </div>
                <div>
                  <p className="font-medium text-white">1. Mahnung</p>
                  <p className="text-sm text-gray-400">
                    Wenn nach der Erinnerung nichts passiert, wird der Ton etwas förmlicher.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-orange-400 text-sm font-bold">3</span>
                </div>
                <div>
                  <p className="font-medium text-white">2. Mahnung</p>
                  <p className="text-sm text-gray-400">
                    Klare Aufforderung zur Zahlung mit Fristsetzung.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-red-400 text-sm font-bold">4</span>
                </div>
                <div>
                  <p className="font-medium text-white">Letzte Mahnung</p>
                  <p className="text-sm text-gray-400">
                    Letzte Warnung vor rechtlichen Schritten.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-700">
              <div className="flex items-start gap-3">
                <Send className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-400">
                  <strong className="text-white">Per E-Mail versenden:</strong> Jede Mahnstufe kann direkt aus der App
                  per E-Mail an den Kunden gesendet werden – mit PDF-Anhang. Die E-Mail erscheint von deinem Firmennamen.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Alle Features */}
      <section className="py-16 sm:py-20 px-4" id="funktionen">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
              Alles was du brauchst
            </h2>
            <p className="text-gray-400">Fokussiert auf das Wesentliche – keine unnötigen Funktionen</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: FileText,
                title: 'DIN 5008 Format',
                desc: 'Professionelle Dokumente nach deutschem Briefstandard',
                color: 'blue'
              },
              {
                icon: RefreshCw,
                title: 'Angebot → Rechnung',
                desc: 'Mit einem Klick umwandeln, alle Daten übernehmen',
                color: 'green'
              },
              {
                icon: FileDown,
                title: 'PDF & Word Export',
                desc: 'Beide Formate mit einem Klick herunterladen',
                color: 'purple'
              },
              {
                icon: Mail,
                title: 'E-Mail Versand',
                desc: 'Rechnungen & Mahnungen direkt per E-Mail senden',
                color: 'cyan'
              },
              {
                icon: Search,
                title: 'Schnellsuche (⌘K)',
                desc: 'Finde Rechnungen, Kunden und Angebote sofort',
                color: 'yellow'
              },
              {
                icon: Edit3,
                title: 'Logo & Unterschrift',
                desc: 'Eigenes Logo und Unterschrift hochladen',
                color: 'pink'
              },
              {
                icon: Shield,
                title: 'Kleinunternehmer §19',
                desc: 'Ein Schalter aktiviert den Hinweis automatisch',
                color: 'green'
              },
              {
                icon: CreditCard,
                title: 'Bezahlt-Status',
                desc: 'Markieren sperrt das Dokument vor Änderungen',
                color: 'blue'
              },
              {
                icon: Eye,
                title: 'Live-Vorschau',
                desc: 'Sieh die Rechnung wie im PDF während du tippst',
                color: 'orange'
              },
            ].map((feature, i) => {
              const colors: Record<string, string> = {
                blue: 'bg-blue-500/10 text-blue-400',
                green: 'bg-green-500/10 text-green-400',
                purple: 'bg-purple-500/10 text-purple-400',
                cyan: 'bg-cyan-500/10 text-cyan-400',
                yellow: 'bg-yellow-500/10 text-yellow-400',
                pink: 'bg-pink-500/10 text-pink-400',
                orange: 'bg-orange-500/10 text-orange-400',
              };
              return (
                <div
                  key={i}
                  className="p-5 bg-gray-800/30 border border-gray-800 rounded-xl hover:border-gray-700 hover:bg-gray-800/50 transition-all"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colors[feature.color]}`}>
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-400">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 sm:py-20 px-4 bg-gray-900/50" id="pricing">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
              Einfache, faire Preise
            </h2>
            <p className="text-gray-400">
              Starte kostenlos. Upgrade wenn du mehr brauchst.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Free */}
            <div className="border border-gray-800 rounded-2xl p-6 bg-gray-900/30">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-1">Kostenlos</h3>
                <p className="text-sm text-gray-500">Zum Ausprobieren</p>
              </div>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-white">0 €</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['3 Dokumente insgesamt', 'PDF & Word Export', 'Kundenverwaltung', 'DIN 5008 Format'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-400">
                    <Check className="h-4 w-4 text-gray-500 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block">
                <Button variant="outline" className="w-full">
                  Kostenlos starten
                </Button>
              </Link>
            </div>

            {/* Yearly - Highlighted */}
            <div className="border-2 border-blue-500 rounded-2xl p-6 relative bg-gray-900 shadow-xl shadow-blue-500/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                Beliebt
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-1">Jahresabo</h3>
                <p className="text-sm text-gray-500">Für regelmäßige Nutzer</p>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold text-white">30 €</span>
                <span className="text-gray-400">/ Jahr</span>
              </div>
              <p className="text-sm text-green-400 mb-6">Nur 2,50 € pro Monat</p>
              <ul className="space-y-3 mb-8">
                {['Unbegrenzte Dokumente', 'Mahnwesen inklusive', 'E-Mail Versand', 'PDF & Word Export', 'Jährlich kündbar'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                    <Check className="h-4 w-4 text-green-400 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Jetzt starten
                </Button>
              </Link>
            </div>

            {/* Monthly */}
            <div className="border border-gray-800 rounded-2xl p-6 bg-gray-900/30">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-1">Monatsabo</h3>
                <p className="text-sm text-gray-500">Maximale Flexibilität</p>
              </div>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-white">5 €</span>
                <span className="text-gray-400">/ Monat</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Unbegrenzte Dokumente', 'Mahnwesen inklusive', 'E-Mail Versand', 'Monatlich kündbar'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-400">
                    <Check className="h-4 w-4 text-gray-500 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block">
                <Button variant="outline" className="w-full">
                  Monatlich starten
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Häufige Fragen
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'Brauche ich Buchhaltungskenntnisse?',
                a: 'Nein! RechnungsBlitz ist für Einsteiger gemacht. Du gibst einfach deine Daten ein, die App kümmert sich um das Format, die Rechnungsnummer und die Berechnung.',
              },
              {
                q: 'Was passiert nach den 3 kostenlosen Dokumenten?',
                a: 'Du kannst weiterhin alle deine Dokumente ansehen und exportieren. Für neue Dokumente brauchst du ein Abo. Deine Daten bleiben natürlich erhalten.',
              },
              {
                q: 'Sind die Rechnungen rechtsgültig?',
                a: 'Ja. Alle Dokumente enthalten die gesetzlich vorgeschriebenen Pflichtangaben, folgen dem DIN 5008 Standard und sind GoBD-konform.',
              },
              {
                q: 'Kann ich ein Angebot in eine Rechnung umwandeln?',
                a: 'Ja! Mit einem Klick auf "In Rechnung umwandeln" werden alle Daten übernommen – Kunde, Positionen, Beträge. Du sparst dir die doppelte Eingabe.',
              },
              {
                q: 'Wie funktioniert die Kleinunternehmer-Regelung?',
                a: 'In den Einstellungen aktivierst du den Schalter "Kleinunternehmer §19 UStG". Danach erscheint der gesetzlich vorgeschriebene Hinweis automatisch auf allen Dokumenten.',
              },
              {
                q: 'Von welcher E-Mail-Adresse werden Mahnungen gesendet?',
                a: 'E-Mails werden mit deinem Firmennamen als Absender versendet. Antworten gehen an deine hinterlegte E-Mail-Adresse.',
              },
              {
                q: 'Kann ich jederzeit kündigen?',
                a: 'Ja, mit einem Klick in den Einstellungen. Du behältst den Zugang bis zum Ende der bezahlten Laufzeit.',
              },
              {
                q: 'Sind meine Daten sicher?',
                a: 'Ja. Alle Daten werden verschlüsselt übertragen und in Deutschland gespeichert. Wir sind DSGVO-konform.',
              },
            ].map((faq, i) => (
              <div
                key={i}
                className="border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-medium text-white pr-4">{faq.q}</span>
                  <ChevronRight className={`h-5 w-5 text-gray-500 shrink-0 transition-transform ${activeFaq === i ? 'rotate-90' : ''}`} />
                </button>
                {activeFaq === i && (
                  <div className="px-5 pb-5 pt-0">
                    <p className="text-gray-400 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-500/5 border border-blue-500/20 rounded-3xl p-8 sm:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Bereit für einfache Rechnungen?
            </h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Erstelle jetzt deine erste Rechnung – kostenlos und ohne Kreditkarte.
            </p>
            <Link href="/register">
              <Button size="lg" className="text-lg px-10 h-14 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25">
                Kostenlos starten
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-800/50">
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

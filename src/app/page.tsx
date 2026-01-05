import Link from 'next/link';
import { Zap, Check, ArrowRight, FileText, Users, Download, Clock, Shield, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Navigation */}
      <nav className="border-b border-gray-800/50 backdrop-blur-sm sticky top-0 z-50 bg-gray-950/80">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">RechnungsBlitz</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Anmelden</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Kostenlos testen</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm mb-8">
            <Sparkles className="h-4 w-4" />
            <span>Einfach. Schnell. Professionell.</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Rechnungen schreiben
            <br />
            <span className="text-blue-400">in Sekunden</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Keine komplizierte Software. Kein Buchhaltungs-Overkill.
            Einfach Rechnung erstellen, PDF herunterladen, fertig.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8 h-14 bg-blue-600 hover:bg-blue-700">
                Kostenlos starten
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#pricing">
              <Button variant="outline" size="lg" className="text-lg px-8 h-14">
                Preise ansehen
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            3 Dokumente gratis. Keine Kreditkarte erforderlich.
          </p>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-8 px-4 border-y border-gray-800/50">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-8 sm:gap-16 text-center">
          <div>
            <div className="text-2xl font-bold text-white">100%</div>
            <div className="text-sm text-gray-500">DSGVO-konform</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">30 Sek</div>
            <div className="text-sm text-gray-500">bis zur ersten Rechnung</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">GoBD</div>
            <div className="text-sm text-gray-500">konforme PDFs</div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              So einfach geht's
            </h2>
            <p className="text-gray-400">In drei Schritten zur fertigen Rechnung</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
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
                title: 'PDF herunterladen',
                desc: 'Ein Klick und du hast deine professionelle Rechnung',
              },
            ].map((item, i) => (
              <div key={i} className="relative group">
                <div className="absolute -inset-px bg-gradient-to-b from-blue-500/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-8 bg-gray-900/50 border border-gray-800 rounded-2xl h-full">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                      <item.icon className="h-6 w-6 text-blue-400" />
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

      {/* Features */}
      <section className="py-20 px-4 bg-gray-900/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Alles was du brauchst</h2>
            <p className="text-gray-400">Keine Funktionen, die du nie nutzt</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: FileText, title: 'Rechnungen & Angebote', desc: 'Professionelle PDFs mit deinem Branding' },
              { icon: Users, title: 'Kundenverwaltung', desc: 'Einmal anlegen, immer wieder nutzen' },
              { icon: Clock, title: 'Kleinunternehmer §19', desc: 'Ein Klick aktiviert den Hinweistext' },
              { icon: Shield, title: 'GoBD-konform', desc: 'Alle Pflichtangaben automatisch' },
              { icon: Download, title: 'PDF-Export', desc: 'Herunterladen oder direkt per E-Mail' },
              { icon: Zap, title: 'Logo & Unterschrift', desc: 'Optional hochladen, Größe anpassbar' },
            ].map((feature, i) => (
              <div key={i} className="p-6 bg-gray-800/30 border border-gray-800 rounded-xl hover:border-gray-700 transition-colors">
                <feature.icon className="h-8 w-8 text-blue-400 mb-4" />
                <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4" id="pricing">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Einfache Preise</h2>
            <p className="text-gray-400">
              Starte kostenlos mit 3 Dokumenten. Upgrade wenn du mehr brauchst.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Free */}
            <div className="border border-gray-800 rounded-2xl p-8 bg-gray-900/30">
              <h3 className="text-lg font-semibold text-white mb-2">Kostenlos</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-white">0 €</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  '3 Dokumente',
                  'PDF-Export',
                  'Kundenverwaltung',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-400">
                    <Check className="h-5 w-5 text-gray-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button variant="outline" className="w-full">
                  Kostenlos starten
                </Button>
              </Link>
            </div>

            {/* Yearly - Highlighted */}
            <div className="border-2 border-blue-500 rounded-2xl p-8 relative bg-gray-900 shadow-lg shadow-blue-500/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                Beliebt
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Jahresabo</h3>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-bold text-white">30 €</span>
                <span className="text-gray-400">/ Jahr</span>
              </div>
              <p className="text-sm text-green-400 mb-6">Nur 2,50 € pro Monat</p>
              <ul className="space-y-3 mb-8">
                {[
                  'Unbegrenzte Dokumente',
                  'Alle Features',
                  'E-Mail-Versand',
                  'Jährlich kündbar',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-300">
                    <Check className="h-5 w-5 text-green-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Jetzt starten
                </Button>
              </Link>
            </div>

            {/* Monthly */}
            <div className="border border-gray-800 rounded-2xl p-8 bg-gray-900/30">
              <h3 className="text-lg font-semibold text-white mb-2">Monatsabo</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-white">5 €</span>
                <span className="text-gray-400">/ Monat</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Unbegrenzte Dokumente',
                  'Alle Features',
                  'Monatlich kündbar',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-400">
                    <Check className="h-5 w-5 text-gray-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button variant="outline" className="w-full">
                  Monatlich starten
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Target Audience */}
      <section className="py-20 px-4 bg-gray-900/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Perfekt für</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Freelancer', desc: 'Designer, Entwickler, Texter' },
              { title: 'Nebenberufler', desc: 'Nebeneinkommen dokumentieren' },
              { title: 'Kleinunternehmer', desc: 'Mit §19 UStG Regelung' },
              { title: 'Gründer', desc: 'Schnell starten, günstig bleiben' },
            ].map((item, i) => (
              <div key={i} className="text-center p-6">
                <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-6 w-6 text-green-400" />
                </div>
                <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-12">Häufige Fragen</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Brauche ich ein Logo?',
                a: 'Nein. Du kannst ein Logo hochladen, es ist aber komplett optional. Deine Rechnungen sehen auch ohne Logo professionell aus.',
              },
              {
                q: 'Bin ich Kleinunternehmer - was muss ich tun?',
                a: 'Einfach in den Einstellungen den Schalter aktivieren. Der §19-Hinweis erscheint dann automatisch auf allen Dokumenten.',
              },
              {
                q: 'Kann ich kündigen?',
                a: 'Jederzeit. Beim Monatsabo hast du Zugang bis zum Monatsende, beim Jahresabo bis zum Jahresende.',
              },
              {
                q: 'Sind die Rechnungen rechtsgültig?',
                a: 'Ja. Alle PDFs enthalten die gesetzlich vorgeschriebenen Pflichtangaben und sind GoBD-konform.',
              },
            ].map((faq, i) => (
              <div key={i} className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <h3 className="font-semibold text-white mb-2">{faq.q}</h3>
                <p className="text-gray-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-b from-blue-500/10 to-transparent border border-blue-500/20 rounded-3xl p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Bereit für einfache Rechnungen?
            </h2>
            <p className="text-gray-400 mb-8">
              Starte jetzt kostenlos mit 3 Dokumenten. Keine Kreditkarte nötig.
            </p>
            <Link href="/register">
              <Button size="lg" className="text-lg px-10 h-14 bg-blue-600 hover:bg-blue-700">
                Kostenlos starten
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-800/50">
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

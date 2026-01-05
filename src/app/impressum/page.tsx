import Link from 'next/link';
import { Zap, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Impressum | RechnungsBlitz',
};

export default function ImpressumPage() {
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
        <h1 className="text-3xl font-bold text-white mb-8">Impressum</h1>

        <div className="prose prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">EU-Streitschlichtung</h2>
            <p className="text-gray-400">
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
              <a
                href="https://ec.europa.eu/consumers/odr/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                https://ec.europa.eu/consumers/odr/
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Verbraucherstreitbeilegung/Universalschlichtungsstelle</h2>
            <p className="text-gray-400">
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Haftung für Inhalte</h2>
            <p className="text-gray-400">
              Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den
              allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht
              verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen
              zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
            </p>
            <p className="text-gray-400 mt-2">
              Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen
              Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt
              der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden
              Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Haftung für Links</h2>
            <p className="text-gray-400">
              Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben.
              Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der
              verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Urheberrecht</h2>
            <p className="text-gray-400">
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen
              Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der
              Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
              Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

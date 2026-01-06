'use client';

import { Lightbulb, Info, X } from 'lucide-react';
import { useState } from 'react';

interface HelpTip {
  title: string;
  description: string;
  tip?: string;
}

interface HelpPanelProps {
  tips: HelpTip[];
  title?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export function HelpPanel({
  tips,
  title = "Tipps & Hilfe",
  collapsible = true,
  defaultCollapsed = false
}: HelpPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  if (collapsible && isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all hover:scale-105"
      >
        <Lightbulb className="h-4 w-4" />
        <span className="text-sm font-medium">Hilfe anzeigen</span>
      </button>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-800/30 rounded-2xl p-5 relative">
      {collapsible && (
        <button
          onClick={() => setIsCollapsed(true)}
          className="absolute top-3 right-3 p-1 text-gray-500 hover:text-gray-300 transition-colors"
          aria-label="Schließen"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Lightbulb className="h-5 w-5 text-blue-400" />
        </div>
        <h3 className="font-semibold text-white">{title}</h3>
      </div>

      <div className="space-y-4">
        {tips.map((item, index) => (
          <div key={index}>
            <p className="text-sm font-medium text-gray-200">{item.title}</p>
            <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{item.description}</p>
            {item.tip && (
              <div className="mt-2 flex items-start gap-2 p-2 bg-yellow-900/20 border border-yellow-800/30 rounded-lg">
                <Info className="h-3.5 w-3.5 text-yellow-500 mt-0.5 shrink-0" />
                <p className="text-xs text-yellow-400/90">{item.tip}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Pre-defined help content for different sections
export const settingsHelp = {
  company: [
    {
      title: "Logo hochladen",
      description: "Dein Logo erscheint oben links auf allen Dokumenten. Ideal ist ein transparentes PNG.",
      tip: "Die optimale Größe ist 60px Höhe. Du kannst sie mit dem Regler anpassen."
    },
    {
      title: "Unterschrift digitalisieren",
      description: "Unterschreibe auf weißem Papier, fotografiere es und lade das Bild hoch. Die App entfernt automatisch den weißen Hintergrund nicht – nutze ein PNG mit Transparenz.",
      tip: "Ohne Unterschrift wird automatisch Platz für eine handschriftliche Unterschrift gelassen."
    },
    {
      title: "Steuernummer",
      description: "Entweder deine Steuernummer vom Finanzamt oder die USt-IdNr. für EU-Geschäfte.",
    },
  ],
  kleinunternehmer: [
    {
      title: "Kleinunternehmerregelung §19 UStG",
      description: "Wenn dein Jahresumsatz unter 22.000 € liegt, kannst du als Kleinunternehmer keine MwSt. ausweisen.",
      tip: "Bei aktivierter Option erscheint automatisch der gesetzlich vorgeschriebene Hinweis auf allen Dokumenten."
    },
  ],
  bank: [
    {
      title: "Bankverbindung",
      description: "Diese Daten erscheinen in der Fußzeile jeder Rechnung und Mahnung.",
      tip: "Je schneller Kunden deine Bankdaten finden, desto schneller wirst du bezahlt!"
    },
  ],
};

export const dashboardHelp = [
  {
    title: "Schnellstart",
    description: "Mit + Rechnung oder + Angebot in der Kopfzeile erstellst du sofort neue Dokumente.",
  },
  {
    title: "Globale Suche",
    description: "Drücke ⌘K (Mac) oder Strg+K (Windows) um blitzschnell alles zu finden.",
    tip: "Suche nach Rechnungsnummer, Kundenname oder Betrag."
  },
  {
    title: "Mahnwesen",
    description: "Überfällige Rechnungen? Im Menü unter 'Mahnwesen' erstellst du professionelle Mahnungen.",
  },
];

export const invoiceHelp = [
  {
    title: "Positionen",
    description: "Beschreibe deine Leistung kurz und prägnant. Der Betrag ist der Gesamtpreis pro Position.",
  },
  {
    title: "Courtage (optional)",
    description: "Für Makler: Berechne automatisch einen Prozentsatz von einem Basisbetrag.",
    tip: "Öffne 'Courtage-Berechnung' und gib Basisbetrag + Prozentsatz ein."
  },
  {
    title: "Nach dem Erstellen",
    description: "Du kannst die Rechnung als PDF oder Word herunterladen. Word ist ideal zum Nachbearbeiten.",
  },
];

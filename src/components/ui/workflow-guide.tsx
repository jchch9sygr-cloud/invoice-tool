'use client';

import { Settings, Users, FileText, Mail, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

interface WorkflowStep {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}

const workflowSteps: WorkflowStep[] = [
  {
    icon: Settings,
    title: "1. Firmendaten einrichten",
    description: "Logo, Adresse, Bankverbindung",
    color: "blue",
  },
  {
    icon: Users,
    title: "2. Kunden anlegen",
    description: "Name, Adresse, Kontaktdaten",
    color: "purple",
  },
  {
    icon: FileText,
    title: "3. Rechnung erstellen",
    description: "Positionen eintragen, PDF erstellen",
    color: "green",
  },
  {
    icon: Mail,
    title: "4. Versenden",
    description: "Per E-Mail oder Post, Status 'Gesendet'",
    color: "yellow",
  },
  {
    icon: CheckCircle2,
    title: "5. Bezahlung markieren",
    description: "Status auf 'Bezahlt' setzen",
    color: "emerald",
  },
  {
    icon: Clock,
    title: "6. Zahlungserinnerung",
    description: "Freundliche Erinnerung nach Fälligkeit",
    color: "cyan",
  },
  {
    icon: AlertTriangle,
    title: "7. Mahnungen (1-3)",
    description: "Bei weiterem Verzug Mahnstufen",
    color: "orange",
  },
];

const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-800/30" },
  purple: { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-800/30" },
  green: { bg: "bg-green-500/20", text: "text-green-400", border: "border-green-800/30" },
  yellow: { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-800/30" },
  emerald: { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-800/30" },
  cyan: { bg: "bg-cyan-500/20", text: "text-cyan-400", border: "border-cyan-800/30" },
  orange: { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-800/30" },
};

export function WorkflowGuide() {
  return (
    <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-gray-700/50 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg">
          <FileText className="h-5 w-5 text-blue-400" />
        </div>
        <h3 className="font-semibold text-white">So funktionierts</h3>
      </div>

      <div className="space-y-1">
        {workflowSteps.map((step, index) => {
          const colors = colorClasses[step.color];
          const Icon = step.icon;
          const isLast = index === workflowSteps.length - 1;

          return (
            <div key={index}>
              <div className="flex items-start gap-3 group">
                <div className={`p-1.5 rounded-lg ${colors.bg} shrink-0`}>
                  <Icon className={`h-4 w-4 ${colors.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${colors.text}`}>{step.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{step.description}</p>
                </div>
              </div>
              {!isLast && (
                <div className="flex items-center ml-[18px] py-1">
                  <div className="w-px h-3 bg-gray-700"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700/50">
        <p className="text-xs text-gray-500">
          <span className="text-gray-400">Tipp:</span> Angebote können mit einem Klick in Rechnungen umgewandelt werden!
        </p>
      </div>
    </div>
  );
}

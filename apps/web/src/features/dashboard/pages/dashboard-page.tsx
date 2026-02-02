import { Calendar, Users, Clock, AlertTriangle } from "lucide-react";

const stats = [
  {
    title: "Agents Actifs",
    value: "24",
    icon: Users,
    change: "+2 ce mois",
    changeType: "positive" as const,
  },
  {
    title: "Période Actuelle",
    value: "P2",
    icon: Calendar,
    change: "12 Jan - 8 Fév",
    changeType: "neutral" as const,
  },
  {
    title: "Heures Planifiées",
    value: "3,840h",
    icon: Clock,
    change: "160h/agent",
    changeType: "neutral" as const,
  },
  {
    title: "Alertes Quotas",
    value: "3",
    icon: AlertTriangle,
    change: "RH manquants",
    changeType: "negative" as const,
  },
];

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tableau de Bord</h1>
        <p className="text-muted-foreground">
          Vue d'ensemble de la planification
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="bg-card border rounded-lg p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </p>
              <stat.icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="mt-2">
              <p className="text-3xl font-bold">{stat.value}</p>
              <p
                className={`text-xs mt-1 ${
                  stat.changeType === "positive"
                    ? "text-green-600"
                    : stat.changeType === "negative"
                      ? "text-red-600"
                      : "text-muted-foreground"
                }`}
              >
                {stat.change}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Actions Rapides</h3>
          <div className="space-y-2">
            <button className="w-full text-left px-4 py-3 rounded-md hover:bg-accent transition-colors">
              <p className="font-medium">Voir le planning P2</p>
              <p className="text-sm text-muted-foreground">
                12 Janvier - 8 Février 2026
              </p>
            </button>
            <button className="w-full text-left px-4 py-3 rounded-md hover:bg-accent transition-colors">
              <p className="font-medium">Valider les quotas</p>
              <p className="text-sm text-muted-foreground">
                3 agents nécessitent attention
              </p>
            </button>
            <button className="w-full text-left px-4 py-3 rounded-md hover:bg-accent transition-colors">
              <p className="font-medium">Demandes de congés</p>
              <p className="text-sm text-muted-foreground">
                2 demandes en attente
              </p>
            </button>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Alertes Quotas</h3>
          <div className="space-y-3">
            {[
              { agent: "Marie Dupont", issue: "RH: 3/4", severity: "warning" },
              { agent: "Pierre Martin", issue: "CH: 2/4", severity: "warning" },
              { agent: "Sophie Bernard", issue: "CV: 0/1", severity: "error" },
            ].map((alert, i) => (
              <div
                key={i}
                className={`flex items-center justify-between px-4 py-3 rounded-md ${
                  alert.severity === "error"
                    ? "bg-red-50 dark:bg-red-950"
                    : "bg-yellow-50 dark:bg-yellow-950"
                }`}
              >
                <div>
                  <p className="font-medium">{alert.agent}</p>
                  <p className="text-sm text-muted-foreground">{alert.issue}</p>
                </div>
                <AlertTriangle
                  className={`h-5 w-5 ${
                    alert.severity === "error"
                      ? "text-red-500"
                      : "text-yellow-500"
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import { Plus, Search, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockAgents = [
  {
    id: "1",
    name: "Marie Dupont",
    email: "marie.dupont@planningos.local",
    matricule: "AGT001",
    role: "Agent",
    status: "active",
  },
  {
    id: "2",
    name: "Pierre Martin",
    email: "pierre.martin@planningos.local",
    matricule: "AGT002",
    role: "Agent",
    status: "active",
  },
  {
    id: "3",
    name: "Sophie Bernard",
    email: "sophie.bernard@planningos.local",
    matricule: "AGT003",
    role: "Agent",
    status: "active",
  },
  {
    id: "4",
    name: "Jean Planificateur",
    email: "planner@planningos.local",
    matricule: "PLN001",
    role: "Planner",
    status: "active",
  },
];

export function AgentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Agents</h1>
          <p className="text-muted-foreground">
            {mockAgents.length} utilisateurs
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel Agent
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Rechercher un agent..."
          className="w-full pl-10 pr-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Table */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Nom</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                Matricule
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">Rôle</th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                Statut
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {mockAgents.map((agent) => (
              <tr key={agent.id} className="border-t hover:bg-accent/50">
                <td className="px-4 py-3 font-medium">{agent.name}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {agent.email}
                </td>
                <td className="px-4 py-3">
                  <code className="px-2 py-1 bg-muted rounded text-xs">
                    {agent.matricule}
                  </code>
                </td>
                <td className="px-4 py-3">{agent.role}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full text-xs font-medium">
                    Actif
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useState } from "react";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getShiftColor, getContrastColor } from "@/lib/utils";

// Mock data for demonstration
const mockAgents = [
  { id: "1", name: "Marie Dupont", matricule: "AGT001" },
  { id: "2", name: "Pierre Martin", matricule: "AGT002" },
  { id: "3", name: "Sophie Bernard", matricule: "AGT003" },
];

const mockSchedules: Record<string, Record<string, string>> = {
  "1": {
    "2026-01-12": "101",
    "2026-01-13": "102",
    "2026-01-14": "RH",
    "2026-01-15": "CH",
    "2026-01-16": "111",
    "2026-01-17": "RH",
    "2026-01-18": "CH",
  },
  "2": {
    "2026-01-12": "RH",
    "2026-01-13": "CH",
    "2026-01-14": "101",
    "2026-01-15": "102",
    "2026-01-16": "RH",
    "2026-01-17": "121",
    "2026-01-18": "CH",
  },
  "3": {
    "2026-01-12": "111",
    "2026-01-13": "RH",
    "2026-01-14": "CH",
    "2026-01-15": "101",
    "2026-01-16": "102",
    "2026-01-17": "CH",
    "2026-01-18": "RH",
  },
};

// Generate dates for current period view
function generateDates(startDate: Date, days: number): Date[] {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    return date;
  });
}

function formatDateKey(date: Date): string {
  return date.toISOString().split("T")[0]!;
}

function getDayName(date: Date): string {
  return date.toLocaleDateString("fr-FR", { weekday: "short" });
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function PlanningPage() {
  const [startDate] = useState(new Date(2026, 0, 12)); // P1 start
  const dates = generateDates(startDate, 28); // Full period

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Planning</h1>
          <p className="text-muted-foreground">Période P1 - Janvier 2026</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline">Aujourd'hui</Button>
          <Button variant="outline" size="icon">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="ml-4">
            <Filter className="h-4 w-4 mr-2" />
            Filtres
          </Button>
        </div>
      </div>

      {/* Planning Grid */}
      <div className="bg-card border rounded-lg overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted">
              <th className="sticky left-0 z-20 bg-muted px-4 py-2 text-left font-medium border-r w-48">
                Agent
              </th>
              {dates.map((date) => (
                <th
                  key={formatDateKey(date)}
                  className={`px-1 py-2 text-center text-xs font-medium min-w-[40px] ${
                    isWeekend(date) ? "bg-muted-foreground/10" : ""
                  }`}
                >
                  <div>{getDayName(date)}</div>
                  <div className="text-muted-foreground">
                    {date.getDate()}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockAgents.map((agent) => (
              <tr key={agent.id} className="border-t hover:bg-accent/50">
                <td className="sticky left-0 z-10 bg-card px-4 py-2 border-r font-medium">
                  <div>{agent.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {agent.matricule}
                  </div>
                </td>
                {dates.map((date) => {
                  const dateKey = formatDateKey(date);
                  const shiftCode = mockSchedules[agent.id]?.[dateKey];
                  const bgColor = shiftCode
                    ? getShiftColor(shiftCode)
                    : undefined;
                  const textColor = bgColor
                    ? getContrastColor(bgColor)
                    : undefined;

                  return (
                    <td
                      key={dateKey}
                      className={`text-center border cursor-pointer transition-all hover:ring-2 hover:ring-primary ${
                        isWeekend(date) && !shiftCode
                          ? "bg-muted-foreground/10"
                          : ""
                      }`}
                      style={{
                        backgroundColor: bgColor,
                        color: textColor,
                      }}
                    >
                      <div className="px-1 py-2 text-xs font-medium">
                        {shiftCode || ""}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-xs">
        {[
          { code: "101", label: "Standard AM" },
          { code: "102", label: "Standard PM" },
          { code: "111", label: "Inter AM" },
          { code: "121", label: "Nuit" },
          { code: "RH", label: "Repos Hebdo" },
          { code: "CH", label: "Congé Habituel" },
          { code: "CV", label: "Congé Vieillesse" },
          { code: "AG", label: "Grève" },
        ].map((item) => (
          <div key={item.code} className="flex items-center gap-1">
            <div
              className="w-6 h-6 rounded border flex items-center justify-center text-[10px] font-medium"
              style={{
                backgroundColor: getShiftColor(item.code),
                color: getContrastColor(getShiftColor(item.code)),
              }}
            >
              {item.code}
            </div>
            <span className="text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

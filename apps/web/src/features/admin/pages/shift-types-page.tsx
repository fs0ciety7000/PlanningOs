import { Plus, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getShiftColor, getContrastColor } from "@/lib/utils";

const shiftTypes = [
  {
    code: "101",
    description: "Service Standard Matin",
    category: "standard",
    duration: 8,
    night: 2,
  },
  {
    code: "102",
    description: "Service Standard Après-midi",
    category: "standard",
    duration: 8,
    night: 2,
  },
  {
    code: "111",
    description: "Service Intermédiaire Matin",
    category: "intermediate",
    duration: 8,
    night: 2,
  },
  {
    code: "121",
    description: "Service Nuit",
    category: "night",
    duration: 8,
    night: 8,
  },
  {
    code: "AG",
    description: "Grève",
    category: "special",
    duration: 8,
    night: 0,
  },
  {
    code: "RH",
    description: "Repos Hebdomadaire",
    category: "rest",
    duration: 0,
    night: 0,
  },
  {
    code: "CH",
    description: "Congé Habituel",
    category: "rest",
    duration: 0,
    night: 0,
  },
  {
    code: "CV",
    description: "Congé Vieillesse",
    category: "leave",
    duration: 0,
    night: 0,
  },
  {
    code: "CN",
    description: "Congé Normalisé",
    category: "leave",
    duration: 8,
    night: 0,
  },
];

export function ShiftTypesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Types de Service</h1>
          <p className="text-muted-foreground">
            Configuration des codes de prestation et repos
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Type
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {shiftTypes.map((shift) => {
          const bgColor = getShiftColor(shift.code);
          const textColor = getContrastColor(bgColor);

          return (
            <div
              key={shift.code}
              className="bg-card border rounded-lg overflow-hidden"
            >
              <div
                className="px-4 py-3 flex items-center justify-between"
                style={{ backgroundColor: bgColor, color: textColor }}
              >
                <span className="font-bold text-lg">{shift.code}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Edit2 className="h-4 w-4" style={{ color: textColor }} />
                </Button>
              </div>
              <div className="p-4 space-y-2">
                <p className="font-medium">{shift.description}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="capitalize px-2 py-1 bg-muted rounded">
                    {shift.category}
                  </span>
                  <span>{shift.duration}h travail</span>
                  <span>{shift.night}h nuit</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 rounded-lg p-4 text-sm">
        <p className="font-medium text-blue-800 dark:text-blue-200">
          Note sur les codes
        </p>
        <ul className="mt-2 text-blue-700 dark:text-blue-300 space-y-1">
          <li>
            • Codes <strong>7xxx</strong> : Indiquent un travail sur jour férié
            (nécessite RR)
          </li>
          <li>
            • Codes <strong>6xxx</strong> : Variante des codes standards
          </li>
          <li>
            • Le code <strong>AG</strong> (Grève) est affiché en rouge
          </li>
        </ul>
      </div>
    </div>
  );
}

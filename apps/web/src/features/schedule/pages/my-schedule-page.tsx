import { Calendar, Clock, TrendingUp } from "lucide-react";
import { getShiftColor, getContrastColor } from "@/lib/utils";

export function MySchedulePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mon Planning</h1>
        <p className="text-muted-foreground">
          Vue personnelle - Marie Dupont (AGT001)
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Congés CN</p>
              <p className="text-xl font-bold">15 / 20 jours</p>
            </div>
          </div>
        </div>
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Clock className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Heures P1</p>
              <p className="text-xl font-bold">152 / 160h</p>
            </div>
          </div>
        </div>
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Heures Nuit</p>
              <p className="text-xl font-bold">24h</p>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly View */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Cette Semaine</h3>
        <div className="grid grid-cols-7 gap-2">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day, i) => {
            const shifts = ["101", "102", "RH", "CH", "111", "RH", "CH"];
            const shiftCode = shifts[i]!;
            const bgColor = getShiftColor(shiftCode);
            const textColor = getContrastColor(bgColor);

            return (
              <div key={day} className="text-center">
                <p className="text-xs text-muted-foreground mb-1">{day}</p>
                <p className="text-sm mb-1">{12 + i}</p>
                <div
                  className="rounded-lg p-3 font-medium"
                  style={{ backgroundColor: bgColor, color: textColor }}
                >
                  {shiftCode}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Period Quotas */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Quotas Période P1</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "CH", current: 4, required: 4, status: "ok" },
            { label: "RH", current: 4, required: 4, status: "ok" },
            { label: "CV", current: 1, required: 1, status: "ok" },
            { label: "RR", current: 0, required: 0, status: "ok" },
          ].map((quota) => (
            <div
              key={quota.label}
              className={`p-4 rounded-lg border ${
                quota.status === "ok"
                  ? "bg-green-50 dark:bg-green-950 border-green-200"
                  : "bg-red-50 dark:bg-red-950 border-red-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{quota.label}</span>
                <span
                  className={`text-sm ${
                    quota.status === "ok" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {quota.status === "ok" ? "OK" : "!"}
                </span>
              </div>
              <p className="text-2xl font-bold mt-1">
                {quota.current}/{quota.required}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

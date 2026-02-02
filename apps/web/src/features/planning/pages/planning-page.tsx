// Planning Page - Main schedule management view for planners

import { AlertCircle, FileDown, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlanningGrid } from '@/components/planning/planning-grid';
import { useAuthStore } from '@/stores/auth-store';
import { useLeaveRequests } from '@/hooks/use-api';

export function PlanningPage() {
  const { isPlanner, isAdmin } = useAuthStore();
  const canEdit = isPlanner() || isAdmin();

  // Get pending leave requests count
  const { data: pendingRequests = [] } = useLeaveRequests(
    { status: 'pending' },
    { enabled: canEdit }
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tableau de Service</h1>
          <p className="text-muted-foreground">
            Vue globale du planning de tous les agents
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <>
              <Button variant="outline" size="sm">
                <FileUp className="h-4 w-4 mr-2" />
                Importer
              </Button>
              <Button variant="outline" size="sm">
                <FileDown className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Alerts for pending requests */}
      {canEdit && pendingRequests.length > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-lg border bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-200">
              Demandes en attente
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              {pendingRequests.length} demande(s) de congés en attente de validation.{' '}
              <a href="/leave-requests" className="underline font-medium">
                Voir les demandes
              </a>
            </p>
          </div>
        </div>
      )}

      {/* Main Planning Grid */}
      <div className="bg-card rounded-lg border p-4">
        <PlanningGrid editable={canEdit} />
      </div>

      {/* Legend */}
      <div className="bg-card rounded-lg border p-4">
        <h3 className="font-medium mb-3">Légende</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-muted border"></div>
            <span>Weekend</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-rose-100 border"></div>
            <span>Jour férié</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded border"
              style={{ backgroundColor: '#FFD9E6' }}
            ></div>
            <span>Standard (101/102)</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded border"
              style={{ backgroundColor: '#D9E6FF' }}
            ></div>
            <span>Intermédiaire (111/112)</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded border"
              style={{ backgroundColor: '#FFE6CC' }}
            ></div>
            <span>Nuit (121)</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded border"
              style={{ backgroundColor: '#CCCCCC' }}
            ></div>
            <span>Repos (RH/CH)</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded border"
              style={{ backgroundColor: '#FFFFCC' }}
            ></div>
            <span>Congés (CN/JC)</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded border"
              style={{ backgroundColor: '#96D1CC' }}
            ></div>
            <span>CV (Ancienneté)</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded border"
              style={{ backgroundColor: '#FF4444' }}
            ></div>
            <span>Grève (AG)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dashboard Page - Overview with real data from API

import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, Users, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import {
  useDashboardStats,
  usePeriods,
  useUsers,
  useLeaveRequests,
} from '@/hooks/use-api';

export function DashboardPage() {
  const { isPlanner, isAdmin } = useAuthStore();
  const canManage = isPlanner() || isAdmin();

  const currentYear = new Date().getFullYear();

  // Fetch real data
  const { data: dashboardStats, isLoading: statsLoading } = useDashboardStats();
  const { data: periods = [] } = usePeriods(currentYear);
  const { data: users = [] } = useUsers({ enabled: canManage });
  const { data: pendingRequests = [] } = useLeaveRequests(
    { status: 'pending' },
    { enabled: canManage }
  );

  // Find current period
  const today = format(new Date(), 'yyyy-MM-dd');
  const currentPeriod = periods.find((p) => today >= p.startDate && today <= p.endDate);

  // Count active users
  const activeUsers = users.filter((u) => u.isActive);

  // Build stats cards
  const stats = [
    {
      title: 'Agents Actifs',
      value: dashboardStats?.activeAgents ?? activeUsers.length,
      icon: Users,
      change: canManage ? `${users.length} total` : undefined,
      changeType: 'neutral' as const,
    },
    {
      title: 'Période Actuelle',
      value: currentPeriod ? `P${currentPeriod.number}` : 'N/A',
      icon: Calendar,
      change: currentPeriod
        ? `${format(new Date(currentPeriod.startDate), 'dd MMM', { locale: fr })} - ${format(new Date(currentPeriod.endDate), 'dd MMM', { locale: fr })}`
        : undefined,
      changeType: 'neutral' as const,
    },
    {
      title: 'Heures Planifiées',
      value: dashboardStats?.totalPlannedHours
        ? `${Math.round(dashboardStats.totalPlannedHours).toLocaleString()}h`
        : `${activeUsers.length * 160}h`,
      icon: Clock,
      change: '160h/agent',
      changeType: 'neutral' as const,
    },
    {
      title: canManage ? 'Demandes en Attente' : 'Alertes Quotas',
      value: canManage
        ? pendingRequests.length
        : dashboardStats?.quotaAlerts ?? 0,
      icon: AlertTriangle,
      change: canManage
        ? pendingRequests.length > 0
          ? 'À valider'
          : 'Aucune'
        : dashboardStats?.quotaAlerts
          ? 'À vérifier'
          : 'Tous OK',
      changeType:
        (canManage ? pendingRequests.length : dashboardStats?.quotaAlerts ?? 0) > 0
          ? 'negative' as const
          : 'positive' as const,
    },
  ];

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
              <p className="text-3xl font-bold">
                {statsLoading ? '...' : stat.value}
              </p>
              {stat.change && (
                <p
                  className={`text-xs mt-1 ${
                    stat.changeType === 'positive'
                      ? 'text-green-600'
                      : stat.changeType === 'negative'
                        ? 'text-red-600'
                        : 'text-muted-foreground'
                  }`}
                >
                  {stat.change}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Actions Rapides</h3>
          <div className="space-y-2">
            <Link
              to="/planning"
              className="w-full flex items-center justify-between px-4 py-3 rounded-md hover:bg-accent transition-colors"
            >
              <div>
                <p className="font-medium">
                  Voir le planning {currentPeriod ? `P${currentPeriod.number}` : ''}
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentPeriod
                    ? `${format(new Date(currentPeriod.startDate), 'dd MMMM', { locale: fr })} - ${format(new Date(currentPeriod.endDate), 'dd MMMM yyyy', { locale: fr })}`
                    : 'Consulter le planning'}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>

            <Link
              to="/my-schedule"
              className="w-full flex items-center justify-between px-4 py-3 rounded-md hover:bg-accent transition-colors"
            >
              <div>
                <p className="font-medium">Mon planning personnel</p>
                <p className="text-sm text-muted-foreground">
                  Consulter mes services et quotas
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>

            <Link
              to="/leave-requests"
              className="w-full flex items-center justify-between px-4 py-3 rounded-md hover:bg-accent transition-colors"
            >
              <div>
                <p className="font-medium">
                  {canManage ? 'Gérer les demandes de congés' : 'Mes demandes de congés'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {canManage
                    ? `${pendingRequests.length} demande(s) en attente`
                    : 'Consulter et créer des demandes'}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>

            {canManage && (
              <Link
                to="/admin/shift-types"
                className="w-full flex items-center justify-between px-4 py-3 rounded-md hover:bg-accent transition-colors"
              >
                <div>
                  <p className="font-medium">Gérer les types de service</p>
                  <p className="text-sm text-muted-foreground">
                    Configuration des codes et quotas
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            )}
          </div>
        </div>

        {/* Pending Leave Requests for Planners */}
        {canManage && (
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Demandes en Attente</h3>
              <Button variant="outline" size="sm" asChild>
                <Link to="/leave-requests">Tout voir</Link>
              </Button>
            </div>
            {pendingRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Aucune demande en attente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.slice(0, 5).map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between px-4 py-3 rounded-md bg-amber-50 dark:bg-amber-950"
                  >
                    <div>
                      <p className="font-medium">
                        {request.user?.firstName} {request.user?.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {request.leaveType} : {format(new Date(request.startDate), 'dd/MM')} -{' '}
                        {format(new Date(request.endDate), 'dd/MM')}
                      </p>
                    </div>
                    <Clock className="h-5 w-5 text-amber-500" />
                  </div>
                ))}
                {pendingRequests.length > 5 && (
                  <p className="text-sm text-center text-muted-foreground">
                    +{pendingRequests.length - 5} autre(s) demande(s)
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Current Period Info for Agents */}
        {!canManage && currentPeriod && (
          <div className="bg-card border rounded-lg p-6">
            <h3 className="font-semibold mb-4">
              Période P{currentPeriod.number} - {currentYear}
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span>Dates</span>
                <span className="font-medium">
                  {format(new Date(currentPeriod.startDate), 'dd MMM', { locale: fr })} -{' '}
                  {format(new Date(currentPeriod.endDate), 'dd MMM yyyy', { locale: fr })}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span>Quota horaire</span>
                <span className="font-medium">{currentPeriod.hourQuota}h</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span>Quotas repos</span>
                <span className="font-medium">4 CH + 4 RH + 1 CV</span>
              </div>
              <Button asChild className="w-full">
                <Link to="/my-schedule">Voir mon planning</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

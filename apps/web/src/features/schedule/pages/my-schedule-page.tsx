// My Schedule Page - Personal view for agents with their schedule and leave requests

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isToday,
  isSameMonth,
  addMonths,
  subMonths,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Calendar,
  Clock,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getShiftColor, getContrastColor, cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import {
  useSchedules,
  useUserBalance,
  usePeriods,
  useHolidays,
  useLeaveRequests,
  useShiftTypes,
} from '@/hooks/use-api';
import type { ScheduleWithDetails, Holiday } from '@/types/api';

export function MySchedulePage() {
  const { user } = useAuthStore();
  const [currentDate, setCurrentDate] = useState(new Date());

  const currentYear = currentDate.getFullYear();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // Fetch user's schedules for the current month
  const { data: schedules = [], isLoading: schedulesLoading } = useSchedules(
    user?.id
      ? {
          userId: user.id,
          startDate: format(monthStart, 'yyyy-MM-dd'),
          endDate: format(monthEnd, 'yyyy-MM-dd'),
        }
      : undefined,
    { enabled: !!user?.id }
  );

  // Fetch user balance
  const { data: balance } = useUserBalance(user?.id || '', currentYear, {
    enabled: !!user?.id,
  });

  // Fetch periods for current year
  const { data: periods = [] } = usePeriods(currentYear);

  // Fetch holidays
  const { data: holidays = [] } = useHolidays(currentYear);

  // Fetch pending leave requests for current user
  const { data: leaveRequests = [] } = useLeaveRequests(
    user?.id ? { userId: user.id, status: 'pending' } : undefined,
    { enabled: !!user?.id }
  );

  // Fetch shift types for color mapping
  const { data: shiftTypes = [] } = useShiftTypes();

  // Build a map of date -> schedule
  const scheduleMap = useMemo(() => {
    const map = new Map<string, ScheduleWithDetails>();
    schedules.forEach((s) => {
      map.set(s.date, s);
    });
    return map;
  }, [schedules]);

  // Build holiday set
  const holidaySet = useMemo(() => {
    return new Set(holidays.map((h) => h.date));
  }, [holidays]);

  // Find current period
  const currentPeriod = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return periods.find((p) => today >= p.startDate && today <= p.endDate);
  }, [periods]);

  // Calculate stats for current period
  const periodStats = useMemo(() => {
    if (!currentPeriod) return null;

    const periodSchedules = schedules.filter(
      (s) => s.date >= currentPeriod.startDate && s.date <= currentPeriod.endDate
    );

    let totalHours = 0;
    let nightHours = 0;
    let chCount = 0;
    let rhCount = 0;
    let cvCount = 0;

    periodSchedules.forEach((s) => {
      if (s.shiftType) {
        totalHours += s.shiftType.durationMinutes / 60;
        nightHours += s.shiftType.nightMinutes / 60;
        if (s.shiftType.code === 'CH') chCount++;
        if (s.shiftType.code === 'RH') rhCount++;
        if (s.shiftType.code === 'CV') cvCount++;
      }
    });

    return {
      totalHours,
      nightHours,
      chCount,
      rhCount,
      cvCount,
      quota: currentPeriod.hourQuota,
    };
  }, [schedules, currentPeriod]);

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const start = startOfWeek(monthStart, { weekStartsOn: 1 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [monthStart, monthEnd]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((d) => (direction === 'prev' ? subMonths(d, 1) : addMonths(d, 1)));
  };

  const getShiftColorFromTypes = (code: string) => {
    const shiftType = shiftTypes.find((st) => st.code === code);
    return shiftType?.color || getShiftColor(code);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mon Planning</h1>
          <p className="text-muted-foreground">
            Vue personnelle - {user?.firstName} {user?.lastName} ({user?.matricule || 'N/A'})
          </p>
        </div>
        <Button asChild>
          <Link to="/leave-requests">
            <Plus className="h-4 w-4 mr-2" />
            Demander un congé
          </Link>
        </Button>
      </div>

      {/* Pending requests alert */}
      {leaveRequests.length > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-lg border bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-200">
              Demandes en attente
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Vous avez {leaveRequests.length} demande(s) de congés en attente de validation.{' '}
              <Link to="/leave-requests" className="underline font-medium">
                Voir mes demandes
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Congés CN restants</p>
              <p className="text-xl font-bold">
                {balance?.cnRemaining ?? '-'} / {balance?.cnTotal ?? '-'} jours
              </p>
            </div>
          </div>
        </div>
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Clock className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Heures {currentPeriod ? `P${currentPeriod.number}` : 'période'}
              </p>
              <p className="text-xl font-bold">
                {periodStats?.totalHours ?? 0} / {periodStats?.quota ?? 160}h
              </p>
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
              <p className="text-xl font-bold">{periodStats?.nightHours ?? 0}h</p>
            </div>
          </div>
        </div>
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Solde heures</p>
              <p className="text-xl font-bold">
                {balance?.hourBalance !== undefined
                  ? `${balance.hourBalance > 0 ? '+' : ''}${balance.hourBalance}h`
                  : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">
            {format(currentDate, 'MMMM yyyy', { locale: fr })}
          </h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
              Aujourd'hui
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigateMonth('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {schedulesLoading ? (
          <div className="text-center py-8 text-muted-foreground">Chargement...</div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}

            {/* Calendar cells */}
            {calendarDays.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const schedule = scheduleMap.get(dateStr);
              const isHoliday = holidaySet.has(dateStr);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;

              const shiftCode = schedule?.shiftType?.code || '';
              const bgColor = shiftCode ? getShiftColorFromTypes(shiftCode) : undefined;
              const textColor = bgColor ? getContrastColor(bgColor) : undefined;

              return (
                <div
                  key={dateStr}
                  className={cn(
                    'min-h-[80px] p-2 rounded-lg border transition-colors',
                    !isCurrentMonth && 'opacity-40',
                    isToday(day) && 'ring-2 ring-primary',
                    isWeekend && !shiftCode && 'bg-muted/50',
                    isHoliday && !shiftCode && 'bg-rose-100 dark:bg-rose-900'
                  )}
                >
                  <div className="text-sm font-medium mb-1">
                    {format(day, 'd')}
                  </div>
                  {shiftCode && (
                    <div
                      className="rounded p-2 text-center font-bold text-sm"
                      style={{ backgroundColor: bgColor, color: textColor }}
                    >
                      {shiftCode}
                    </div>
                  )}
                  {isHoliday && !shiftCode && (
                    <div className="text-xs text-rose-600 dark:text-rose-400">Férié</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Period Quotas */}
      {currentPeriod && (
        <div className="bg-card border rounded-lg p-6">
          <h3 className="font-semibold mb-4">
            Quotas Période P{currentPeriod.number} ({format(new Date(currentPeriod.startDate), 'dd/MM')} - {format(new Date(currentPeriod.endDate), 'dd/MM')})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              {
                label: 'CH',
                current: periodStats?.chCount ?? 0,
                required: 4,
              },
              {
                label: 'RH',
                current: periodStats?.rhCount ?? 0,
                required: 4,
              },
              {
                label: 'CV',
                current: periodStats?.cvCount ?? 0,
                required: 1,
              },
              {
                label: 'Heures',
                current: periodStats?.totalHours ?? 0,
                required: periodStats?.quota ?? 160,
                unit: 'h',
              },
              {
                label: 'Nuit',
                current: periodStats?.nightHours ?? 0,
                required: null,
                unit: 'h',
              },
            ].map((quota) => {
              const status =
                quota.required === null
                  ? 'neutral'
                  : quota.current >= quota.required
                  ? 'ok'
                  : 'pending';

              return (
                <div
                  key={quota.label}
                  className={cn(
                    'p-4 rounded-lg border',
                    status === 'ok' && 'bg-green-50 dark:bg-green-950 border-green-200',
                    status === 'pending' && 'bg-amber-50 dark:bg-amber-950 border-amber-200',
                    status === 'neutral' && 'bg-muted border-border'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{quota.label}</span>
                    {status !== 'neutral' && (
                      <span
                        className={cn(
                          'text-xs px-1.5 py-0.5 rounded',
                          status === 'ok' && 'bg-green-200 text-green-800',
                          status === 'pending' && 'bg-amber-200 text-amber-800'
                        )}
                      >
                        {status === 'ok' ? 'OK' : 'En cours'}
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold mt-1">
                    {quota.current}
                    {quota.unit || ''}
                    {quota.required !== null && (
                      <span className="text-sm font-normal text-muted-foreground">
                        /{quota.required}{quota.unit || ''}
                      </span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="bg-card border rounded-lg p-4">
        <h3 className="font-medium mb-3">Légende</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          {[
            { code: '101', label: 'Standard' },
            { code: '111', label: 'Intermédiaire' },
            { code: '121', label: 'Nuit' },
            { code: 'RH', label: 'Repos Hebdo' },
            { code: 'CH', label: 'Congé Habituel' },
            { code: 'CN', label: 'Congé Normalisé' },
            { code: 'CV', label: 'Ancienneté' },
          ].map((item) => {
            const color = getShiftColorFromTypes(item.code);
            return (
              <div key={item.code} className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: color }}
                />
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

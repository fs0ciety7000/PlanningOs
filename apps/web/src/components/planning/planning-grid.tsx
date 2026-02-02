// Interactive Planning Grid Component
// Displays schedule matrix with various view modes

import { useState, useMemo, useCallback } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isWeekend,
  addMonths,
  subMonths,
  startOfYear,
  endOfYear,
  getDay,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CalendarDays,
  CalendarRange,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSchedules, useShiftTypes, useHolidays, usePeriods, useUsers } from '@/hooks/use-api';
import { useAuthStore } from '@/stores/auth-store';
import type { ShiftType, Holiday, Period, ScheduleWithDetails, User } from '@/types/api';
import { ShiftCellEditor } from './shift-cell-editor';

// ============================================
// TYPES
// ============================================

type ViewMode = 'month' | 'period' | 'year';

interface PlanningGridProps {
  /** Initial view mode */
  initialView?: ViewMode;
  /** Filter to specific user (for agent view) */
  userId?: string;
  /** Whether editing is allowed */
  editable?: boolean;
  /** Callback when a cell is clicked */
  onCellClick?: (userId: string, date: Date, schedule?: ScheduleWithDetails) => void;
}

interface DayColumn {
  date: Date;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
  isPeriodBoundary?: boolean;
  periodNumber?: number;
}

// ============================================
// HELPERS
// ============================================

function getShiftColor(code: string, shiftTypes: ShiftType[]): string {
  const shift = shiftTypes.find((s) => s.code === code);
  return shift?.color?.replace('#', '') || 'FFFFFF';
}

function getDaysInMonth(date: Date): DayColumn[] {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return eachDayOfInterval({ start, end }).map((d) => ({
    date: d,
    isWeekend: isWeekend(d),
    isHoliday: false,
  }));
}

function getDaysInPeriod(period: Period): DayColumn[] {
  const start = new Date(period.startDate);
  const end = new Date(period.endDate);
  return eachDayOfInterval({ start, end }).map((d) => ({
    date: d,
    isWeekend: isWeekend(d),
    isHoliday: false,
    periodNumber: period.number,
  }));
}

// ============================================
// MAIN COMPONENT
// ============================================

export function PlanningGrid({
  initialView = 'month',
  userId,
  editable = false,
  onCellClick,
}: PlanningGridProps) {
  const { user: currentUser, isPlanner } = useAuthStore();
  const [viewMode, setViewMode] = useState<ViewMode>(initialView);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{
    userId: string;
    date: string;
    schedule?: ScheduleWithDetails;
  } | null>(null);

  // Determine date range based on view mode
  const dateRange = useMemo(() => {
    switch (viewMode) {
      case 'month':
        return {
          start: startOfMonth(currentDate),
          end: endOfMonth(currentDate),
        };
      case 'year':
        return {
          start: startOfYear(currentDate),
          end: endOfYear(currentDate),
        };
      case 'period':
      default:
        return {
          start: startOfMonth(currentDate),
          end: endOfMonth(currentDate),
        };
    }
  }, [viewMode, currentDate]);

  // Fetch data
  const { data: users = [], isLoading: usersLoading } = useUsers({
    enabled: !userId, // Don't fetch if showing single user
  });

  const { data: shiftTypes = [], isLoading: shiftTypesLoading } = useShiftTypes();

  const { data: holidays = [] } = useHolidays(currentDate.getFullYear());

  const { data: periods = [] } = usePeriods(currentDate.getFullYear());

  const { data: schedules = [], isLoading: schedulesLoading } = useSchedules({
    userId: userId,
    startDate: format(dateRange.start, 'yyyy-MM-dd'),
    endDate: format(dateRange.end, 'yyyy-MM-dd'),
  });

  // Build holiday map
  const holidayMap = useMemo(() => {
    const map = new Map<string, Holiday>();
    holidays.forEach((h) => map.set(h.date, h));
    return map;
  }, [holidays]);

  // Build schedule map: userId -> date -> schedule
  const scheduleMap = useMemo(() => {
    const map = new Map<string, Map<string, ScheduleWithDetails>>();
    schedules.forEach((s) => {
      if (!map.has(s.userId)) {
        map.set(s.userId, new Map());
      }
      map.get(s.userId)!.set(s.date, s);
    });
    return map;
  }, [schedules]);

  // Build day columns
  const dayColumns = useMemo((): DayColumn[] => {
    if (viewMode === 'period' && selectedPeriodId) {
      const period = periods.find((p) => p.id === selectedPeriodId);
      if (period) {
        return getDaysInPeriod(period).map((d) => ({
          ...d,
          isHoliday: holidayMap.has(format(d.date, 'yyyy-MM-dd')),
          holidayName: holidayMap.get(format(d.date, 'yyyy-MM-dd'))?.name,
        }));
      }
    }
    return getDaysInMonth(currentDate).map((d) => ({
      ...d,
      isHoliday: holidayMap.has(format(d.date, 'yyyy-MM-dd')),
      holidayName: holidayMap.get(format(d.date, 'yyyy-MM-dd'))?.name,
    }));
  }, [viewMode, currentDate, selectedPeriodId, periods, holidayMap]);

  // Filter users
  const displayUsers = useMemo(() => {
    if (userId) {
      const user = users.find((u) => u.id === userId);
      return user ? [user] : [];
    }
    return users.filter((u) => u.isActive);
  }, [users, userId]);

  // Navigation handlers
  const handlePrevious = useCallback(() => {
    if (viewMode === 'month') {
      setCurrentDate((d) => subMonths(d, 1));
    } else if (viewMode === 'year') {
      setCurrentDate((d) => new Date(d.getFullYear() - 1, 0, 1));
    }
  }, [viewMode]);

  const handleNext = useCallback(() => {
    if (viewMode === 'month') {
      setCurrentDate((d) => addMonths(d, 1));
    } else if (viewMode === 'year') {
      setCurrentDate((d) => new Date(d.getFullYear() + 1, 0, 1));
    }
  }, [viewMode]);

  const handleCellClick = useCallback(
    (user: User, day: DayColumn) => {
      const dateStr = format(day.date, 'yyyy-MM-dd');
      const schedule = scheduleMap.get(user.id)?.get(dateStr);

      if (editable && (isPlanner() || user.id === currentUser?.id)) {
        setEditingCell({ userId: user.id, date: dateStr, schedule });
      }

      onCellClick?.(user.id, day.date, schedule);
    },
    [scheduleMap, editable, isPlanner, currentUser, onCellClick]
  );

  const isLoading = usersLoading || shiftTypesLoading || schedulesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[200px] text-center font-medium">
              {viewMode === 'month' && format(currentDate, 'MMMM yyyy', { locale: fr })}
              {viewMode === 'year' && format(currentDate, 'yyyy')}
              {viewMode === 'period' && selectedPeriodId && (
                <>P{periods.find((p) => p.id === selectedPeriodId)?.number} - {currentDate.getFullYear()}</>
              )}
            </div>
            <Button variant="outline" size="icon" onClick={handleNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              Aujourd'hui
            </Button>
          </div>

          {/* View Mode Selector */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('month')}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Mois
            </Button>
            <Button
              variant={viewMode === 'period' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('period')}
            >
              <CalendarRange className="h-4 w-4 mr-2" />
              Période
            </Button>
            {viewMode === 'period' && (
              <Select
                value={selectedPeriodId || ''}
                onValueChange={setSelectedPeriodId}
              >
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="P?" />
                </SelectTrigger>
                <SelectContent>
                  {periods.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      P{p.number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Grid */}
        <div className="border rounded-lg overflow-auto">
          <table className="w-full border-collapse">
            <thead>
              {/* Day numbers row */}
              <tr className="bg-muted/50">
                <th className="sticky left-0 bg-muted/50 border-r px-3 py-2 text-left min-w-[180px]">
                  Agent
                </th>
                {dayColumns.map((day) => (
                  <th
                    key={day.date.toISOString()}
                    className={cn(
                      'px-1 py-1 text-center min-w-[40px] text-xs font-medium',
                      day.isWeekend && 'bg-muted',
                      day.isHoliday && 'bg-rose-100 dark:bg-rose-900/30'
                    )}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-default">
                          {format(day.date, 'd')}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{format(day.date, 'EEEE d MMMM', { locale: fr })}</p>
                        {day.isHoliday && (
                          <p className="text-rose-500">{day.holidayName}</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </th>
                ))}
              </tr>
              {/* Day names row */}
              <tr className="bg-muted/30">
                <th className="sticky left-0 bg-muted/30 border-r"></th>
                {dayColumns.map((day) => (
                  <th
                    key={`name-${day.date.toISOString()}`}
                    className={cn(
                      'px-1 py-0.5 text-center text-[10px] text-muted-foreground',
                      day.isWeekend && 'bg-muted',
                      day.isHoliday && 'bg-rose-100 dark:bg-rose-900/30'
                    )}
                  >
                    {format(day.date, 'EEE', { locale: fr }).charAt(0).toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayUsers.map((user) => (
                <tr key={user.id} className="border-t hover:bg-muted/20">
                  <td className="sticky left-0 bg-background border-r px-3 py-2">
                    <div className="font-medium text-sm">
                      {user.lastName} {user.firstName}
                    </div>
                    {user.matricule && (
                      <div className="text-xs text-muted-foreground">
                        {user.matricule}
                      </div>
                    )}
                  </td>
                  {dayColumns.map((day) => {
                    const dateStr = format(day.date, 'yyyy-MM-dd');
                    const schedule = scheduleMap.get(user.id)?.get(dateStr);
                    const shiftCode = schedule?.shiftCode;
                    const bgColor = shiftCode
                      ? `#${getShiftColor(shiftCode, shiftTypes)}`
                      : undefined;

                    return (
                      <td
                        key={dateStr}
                        className={cn(
                          'px-0.5 py-0.5 text-center cursor-pointer transition-all',
                          day.isWeekend && !shiftCode && 'bg-muted/50',
                          day.isHoliday && !shiftCode && 'bg-rose-50 dark:bg-rose-900/20',
                          'hover:ring-2 hover:ring-primary/50 hover:z-10'
                        )}
                        style={bgColor ? { backgroundColor: bgColor } : undefined}
                        onClick={() => handleCellClick(user, day)}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                'h-8 flex items-center justify-center text-xs font-medium rounded',
                                shiftCode && 'text-gray-800'
                              )}
                            >
                              {shiftCode || ''}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              <p className="font-medium">
                                {format(day.date, 'EEEE d MMMM', { locale: fr })}
                              </p>
                              {shiftCode && (
                                <>
                                  <p>Code: {shiftCode}</p>
                                  <p>
                                    {shiftTypes.find((s) => s.code === shiftCode)?.description}
                                  </p>
                                </>
                              )}
                              {day.isHoliday && (
                                <p className="text-rose-500">Férié: {day.holidayName}</p>
                              )}
                              {schedule?.notes && (
                                <p className="text-muted-foreground italic">
                                  {schedule.notes}
                                </p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cell Editor Modal */}
        {editingCell && (
          <ShiftCellEditor
            userId={editingCell.userId}
            date={editingCell.date}
            schedule={editingCell.schedule}
            shiftTypes={shiftTypes}
            onClose={() => setEditingCell(null)}
          />
        )}
      </div>
    </TooltipProvider>
  );
}

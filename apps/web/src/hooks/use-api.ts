// React Query hooks for API data fetching

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type {
  ApiError,
  ApproveLeaveRequest,
  BulkScheduleRequest,
  CreateHolidayRequest,
  CreateLeaveRequest,
  CreateScheduleRequest,
  CreateShiftTypeRequest,
  DashboardStats,
  Holiday,
  LeaveRequest,
  LeaveRequestQuery,
  Period,
  PeriodBalance,
  PeriodStats,
  PlanningMatrixQuery,
  PlanningMatrixRow,
  Schedule,
  ScheduleQuery,
  ScheduleWithDetails,
  ShiftType,
  UpdateShiftTypeRequest,
  User,
  UserBalance,
  UUID,
} from '@/types/api';

// ============================================
// QUERY KEYS
// ============================================

export const queryKeys = {
  // Users
  users: ['users'] as const,
  user: (id: UUID) => ['users', id] as const,
  userBalance: (id: UUID, year?: number) => ['users', id, 'balance', year] as const,
  me: ['me'] as const,

  // Shift Types
  shiftTypes: ['shiftTypes'] as const,
  shiftType: (id: UUID) => ['shiftTypes', id] as const,

  // Periods
  periods: (year?: number) => ['periods', year] as const,
  period: (id: UUID) => ['periods', 'detail', id] as const,
  periodBalances: (id: UUID) => ['periods', id, 'balances'] as const,

  // Schedules
  schedules: (query?: ScheduleQuery) => ['schedules', query] as const,
  schedule: (id: UUID) => ['schedules', 'detail', id] as const,
  planningMatrix: (query: PlanningMatrixQuery) => ['planningMatrix', query] as const,

  // Leave Requests
  leaveRequests: (query?: LeaveRequestQuery) => ['leaveRequests', query] as const,

  // Holidays
  holidays: (year?: number) => ['holidays', year] as const,

  // Statistics
  dashboard: ['statistics', 'dashboard'] as const,
  periodStats: (id: UUID) => ['statistics', 'period', id] as const,
  userStats: (id: UUID) => ['statistics', 'user', id] as const,

  // Notifications
  notifications: ['notifications'] as const,
};

// ============================================
// USER HOOKS
// ============================================

export function useUsers(options?: Partial<UseQueryOptions<User[], ApiError>>) {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: () => api.getUsers(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

export function useUser(id: UUID, options?: Partial<UseQueryOptions<User, ApiError>>) {
  return useQuery({
    queryKey: queryKeys.user(id),
    queryFn: () => api.getUser(id),
    enabled: !!id,
    ...options,
  });
}

export function useUserBalance(
  id: UUID,
  year?: number,
  options?: Partial<UseQueryOptions<UserBalance, ApiError>>
) {
  return useQuery({
    queryKey: queryKeys.userBalance(id, year),
    queryFn: () => api.getUserBalance(id, year),
    enabled: !!id,
    ...options,
  });
}

export function useMe(options?: Partial<UseQueryOptions<User, ApiError>>) {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () => api.getMe(),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useCreateUser(
  options?: UseMutationOptions<User, ApiError, Partial<User>>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
    },
    ...options,
  });
}

export function useUpdateUser(
  options?: UseMutationOptions<User, ApiError, { id: UUID; data: Partial<User> }>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.updateUser(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      queryClient.invalidateQueries({ queryKey: queryKeys.user(id) });
    },
    ...options,
  });
}

export function useDeleteUser(options?: UseMutationOptions<void, ApiError, UUID>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
    },
    ...options,
  });
}

// ============================================
// SHIFT TYPE HOOKS
// ============================================

export function useShiftTypes(options?: Partial<UseQueryOptions<ShiftType[], ApiError>>) {
  return useQuery({
    queryKey: queryKeys.shiftTypes,
    queryFn: () => api.getShiftTypes(),
    staleTime: 10 * 60 * 1000, // 10 minutes (rarely changes)
    ...options,
  });
}

export function useShiftType(id: UUID, options?: Partial<UseQueryOptions<ShiftType, ApiError>>) {
  return useQuery({
    queryKey: queryKeys.shiftType(id),
    queryFn: () => api.getShiftType(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateShiftType(
  options?: UseMutationOptions<ShiftType, ApiError, CreateShiftTypeRequest>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.createShiftType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shiftTypes });
    },
    ...options,
  });
}

export function useUpdateShiftType(
  options?: UseMutationOptions<ShiftType, ApiError, { id: UUID; data: UpdateShiftTypeRequest }>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.updateShiftType(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shiftTypes });
      queryClient.invalidateQueries({ queryKey: queryKeys.shiftType(id) });
    },
    ...options,
  });
}

export function useDeleteShiftType(options?: UseMutationOptions<void, ApiError, UUID>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.deleteShiftType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shiftTypes });
    },
    ...options,
  });
}

// ============================================
// PERIOD HOOKS
// ============================================

export function usePeriods(year?: number, options?: Partial<UseQueryOptions<Period[], ApiError>>) {
  return useQuery({
    queryKey: queryKeys.periods(year),
    queryFn: () => api.getPeriods(year),
    staleTime: 30 * 60 * 1000, // 30 minutes (very stable)
    ...options,
  });
}

export function usePeriod(id: UUID, options?: Partial<UseQueryOptions<Period, ApiError>>) {
  return useQuery({
    queryKey: queryKeys.period(id),
    queryFn: () => api.getPeriod(id),
    enabled: !!id,
    ...options,
  });
}

export function usePeriodBalances(
  id: UUID,
  options?: Partial<UseQueryOptions<PeriodBalance[], ApiError>>
) {
  return useQuery({
    queryKey: queryKeys.periodBalances(id),
    queryFn: () => api.getPeriodBalances(id),
    enabled: !!id,
    ...options,
  });
}

// ============================================
// SCHEDULE HOOKS
// ============================================

export function useSchedules(
  query?: ScheduleQuery,
  options?: Partial<UseQueryOptions<ScheduleWithDetails[], ApiError>>
) {
  return useQuery({
    queryKey: queryKeys.schedules(query),
    queryFn: () => api.getSchedules(query),
    ...options,
  });
}

export function usePlanningMatrix(
  query: PlanningMatrixQuery,
  options?: Partial<UseQueryOptions<PlanningMatrixRow[], ApiError>>
) {
  return useQuery({
    queryKey: queryKeys.planningMatrix(query),
    queryFn: () => api.getPlanningMatrix(query),
    enabled: !!query.startDate && !!query.endDate,
    ...options,
  });
}

export function useCreateSchedule(
  options?: UseMutationOptions<Schedule, ApiError, CreateScheduleRequest>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.createSchedule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['planningMatrix'] });
    },
    ...options,
  });
}

export function useUpdateSchedule(
  options?: UseMutationOptions<
    Schedule,
    ApiError,
    { id: UUID; data: Partial<CreateScheduleRequest> }
  >
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.updateSchedule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['planningMatrix'] });
    },
    ...options,
  });
}

export function useBulkUpdateSchedules(
  options?: UseMutationOptions<Schedule[], ApiError, BulkScheduleRequest>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.bulkUpdateSchedules(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['planningMatrix'] });
    },
    ...options,
  });
}

export function useDeleteSchedule(options?: UseMutationOptions<void, ApiError, UUID>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.deleteSchedule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['planningMatrix'] });
    },
    ...options,
  });
}

// ============================================
// LEAVE REQUEST HOOKS
// ============================================

export function useLeaveRequests(
  query?: LeaveRequestQuery,
  options?: Partial<UseQueryOptions<LeaveRequest[], ApiError>>
) {
  return useQuery({
    queryKey: queryKeys.leaveRequests(query),
    queryFn: () => api.getLeaveRequests(query),
    ...options,
  });
}

export function useCreateLeaveRequest(
  options?: UseMutationOptions<LeaveRequest, ApiError, CreateLeaveRequest>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.createLeaveRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
    },
    ...options,
  });
}

export function useApproveLeaveRequest(
  options?: UseMutationOptions<LeaveRequest, ApiError, { id: UUID; data: ApproveLeaveRequest }>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.approveLeaveRequest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
    ...options,
  });
}

// ============================================
// HOLIDAY HOOKS
// ============================================

export function useHolidays(
  year?: number,
  options?: Partial<UseQueryOptions<Holiday[], ApiError>>
) {
  return useQuery({
    queryKey: queryKeys.holidays(year),
    queryFn: () => api.getHolidays(year),
    staleTime: 60 * 60 * 1000, // 1 hour
    ...options,
  });
}

export function useCreateHoliday(
  options?: UseMutationOptions<Holiday, ApiError, CreateHolidayRequest>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.createHoliday(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
    },
    ...options,
  });
}

// ============================================
// STATISTICS HOOKS
// ============================================

export function useDashboardStats(
  options?: Partial<UseQueryOptions<DashboardStats, ApiError>>
) {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => api.getDashboardStats(),
    staleTime: 60 * 1000, // 1 minute
    ...options,
  });
}

export function usePeriodStats(
  id: UUID,
  options?: Partial<UseQueryOptions<PeriodStats, ApiError>>
) {
  return useQuery({
    queryKey: queryKeys.periodStats(id),
    queryFn: () => api.getPeriodStats(id),
    enabled: !!id,
    ...options,
  });
}

export function useUserStats(
  id: UUID,
  options?: Partial<UseQueryOptions<UserBalance, ApiError>>
) {
  return useQuery({
    queryKey: queryKeys.userStats(id),
    queryFn: () => api.getUserStats(id),
    enabled: !!id,
    ...options,
  });
}

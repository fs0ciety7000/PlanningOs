// API Types - mirrors backend DTOs
// Based on packages/api/src/api/dto/

export type UUID = string;

// ============================================
// ENUMS
// ============================================

export type UserRole = 'admin' | 'planner' | 'agent';

export type ShiftCategory =
  | 'standard'
  | 'intermediate'
  | 'night'
  | 'partial'
  | 'special'
  | 'rest'
  | 'leave';

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export type NotificationType = 'info' | 'warning' | 'error' | 'success';

// ============================================
// USER & AUTH
// ============================================

export interface User {
  id: UUID;
  organizationId: UUID;
  roleId: UUID;
  email: string;
  firstName: string;
  lastName: string;
  matricule: string;
  avatarUrl?: string;
  phone?: string;
  cnEntitlement: number;
  jcEntitlement: number;
  cnCarryover: number;
  jcCarryover: number;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  // Computed from backend join
  role: UserRole;
  passwordHash?: string; // Only for create/update
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  expiresIn: number;
}

export interface TokenPayload {
  sub: UUID;
  email: string;
  role: UserRole;
  orgId: UUID;
  exp: number;
  iat: number;
}

// ============================================
// SHIFT TYPES
// ============================================

export interface ShiftType {
  id: UUID;
  organizationId: UUID;
  code: string;
  description: string;
  category: ShiftCategory;
  color: string; // Hex color like #FFD9E6
  durationMinutes: number;
  nightMinutes: number;
  countsTowardsQuota: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShiftTypeRequest {
  code: string;
  description: string;
  category: ShiftCategory;
  color: string;
  durationMinutes: number;
  nightMinutes: number;
  countsTowardsQuota?: boolean;
}

export interface UpdateShiftTypeRequest {
  description?: string;
  category?: ShiftCategory;
  color?: string;
  durationMinutes?: number;
  nightMinutes?: number;
  countsTowardsQuota?: boolean;
}

// ============================================
// PERIODS
// ============================================

export interface Period {
  id: UUID;
  organizationId: UUID;
  year: number;
  number: number; // 1-13
  startDate: string; // ISO date
  endDate: string;
  hourQuota: number;
  createdAt: string;
}

export interface PeriodBalance {
  id: UUID;
  periodId: UUID;
  userId: UUID;
  totalHours: number;
  nightHours: number;
  chCount: number;
  rhCount: number;
  cvCount: number;
  rrCount: number;
  cnCount: number;
  jcCount: number;
  holidaysWorked: number;
  isValid: boolean;
  validationErrors: string[];
  calculatedAt: string;
}

// ============================================
// SCHEDULES
// ============================================

export interface Schedule {
  id: UUID;
  organizationId: UUID;
  userId: UUID;
  shiftTypeId?: UUID;
  periodId?: UUID;
  date: string; // ISO date
  isHoliday: boolean;
  notes?: string;
  createdBy?: UUID;
  updatedBy?: UUID;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleWithDetails extends Schedule {
  shiftCode?: string;
  shiftDescription?: string;
  shiftColor?: string;
  durationMinutes?: number;
  nightMinutes?: number;
  periodNumber?: number;
  shiftType?: ShiftType;
}

export interface CreateScheduleRequest {
  userId: UUID;
  shiftTypeId?: UUID;
  date: string;
  notes?: string;
}

export interface BulkScheduleRequest {
  schedules: CreateScheduleRequest[];
}

// Planning Matrix
export interface PlanningMatrixRow {
  userId: UUID;
  firstName: string;
  lastName: string;
  matricule?: string;
  schedules: Record<string, ScheduleCell>; // date -> cell
}

export interface ScheduleCell {
  scheduleId?: UUID;
  shiftCode?: string;
  colorHex?: string;
  isHoliday: boolean;
  isWeekend: boolean;
}

// ============================================
// HOLIDAYS
// ============================================

export interface Holiday {
  id: UUID;
  organizationId: UUID;
  date: string;
  name: string;
  isMoveable: boolean;
  createdAt: string;
}

export interface CreateHolidayRequest {
  date: string;
  name: string;
  isMoveable?: boolean;
}

// ============================================
// LEAVE REQUESTS
// ============================================

export type LeaveType = 'CN' | 'JC' | 'CV' | 'AM' | 'AT' | 'MP' | 'CE';

export interface LeaveRequest {
  id: UUID;
  organizationId: UUID;
  userId: UUID;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  daysCount: number;
  status: LeaveStatus;
  reason?: string;
  approvedBy?: UUID;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  // Expanded
  user?: User;
  approver?: User;
}

export interface CreateLeaveRequest {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface ApproveLeaveRequest {
  approved: boolean;
  rejectionReason?: string;
}

// ============================================
// STATISTICS
// ============================================

export interface DashboardStats {
  totalAgents: number;
  activeAgents: number;
  pendingLeaveRequests: number;
  currentPeriod: Period;
  complianceRate: number;
  alertsCount: number;
}

export interface PeriodStats {
  periodNumber: number;
  totalAgents: number;
  compliantAgents: number;
  complianceRate: number;
  totalHours: number;
  totalNightHours: number;
  shiftDistribution: ShiftCount[];
  validationIssues: ValidationIssue[];
}

export interface ShiftCount {
  code: string;
  description?: string;
  count: number;
  hours: number;
  nightHours: number;
}

export interface ValidationIssue {
  userId: UUID;
  userName: string;
  errors: string[];
  warnings: string[];
}

export interface UserBalance {
  userId: UUID;
  year: number;
  cn: LeaveBalance;
  jc: LeaveBalance;
  periods: PeriodSummary[];
}

export interface LeaveBalance {
  entitlement: number;
  carryover: number;
  total: number;
  used: number;
  remaining: number;
}

export interface PeriodSummary {
  periodId: UUID;
  periodNumber: number;
  totalHours: number;
  nightHours: number;
  chCount: number;
  rhCount: number;
  cvCount: number;
  isValid: boolean;
}

// ============================================
// NOTIFICATIONS
// ============================================

export interface Notification {
  id: UUID;
  userId: UUID;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
}

// ============================================
// API RESPONSES
// ============================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

// ============================================
// QUERY PARAMS
// ============================================

export interface ScheduleQuery {
  userId?: UUID;
  startDate?: string;
  endDate?: string;
  periodId?: UUID;
}

export interface PlanningMatrixQuery {
  startDate: string;
  endDate: string;
  userIds?: UUID[];
}

export interface LeaveRequestQuery {
  userId?: UUID;
  status?: LeaveStatus;
  startDate?: string;
  endDate?: string;
}

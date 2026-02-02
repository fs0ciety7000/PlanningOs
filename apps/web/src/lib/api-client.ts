// API Client - handles all HTTP requests to backend

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
  LoginRequest,
  LoginResponse,
  Notification,
  PaginatedResponse,
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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ============================================
// HTTP CLIENT
// ============================================

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // Load token from localStorage on init
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken');
    }
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let error: ApiError;
      try {
        error = await response.json();
      } catch {
        error = {
          code: 'UNKNOWN_ERROR',
          message: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
      throw error;
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  private get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  private post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  private patch<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  private delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // ============================================
  // AUTH
  // ============================================

  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await this.post<LoginResponse>('/api/v1/auth/login', data);
    this.setAccessToken(response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.post('/api/v1/auth/logout');
    } finally {
      this.setAccessToken(null);
      localStorage.removeItem('refreshToken');
    }
  }

  async refreshToken(): Promise<LoginResponse> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token');
    }
    const response = await this.post<LoginResponse>('/api/v1/auth/refresh', {
      refreshToken,
    });
    this.setAccessToken(response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    return response;
  }

  async getMe(): Promise<User> {
    return this.get<User>('/api/v1/auth/me');
  }

  // ============================================
  // USERS
  // ============================================

  async getUsers(): Promise<User[]> {
    return this.get<User[]>('/api/v1/users');
  }

  async getUser(id: UUID): Promise<User> {
    return this.get<User>(`/api/v1/users/${id}`);
  }

  async getUserBalance(id: UUID, year?: number): Promise<UserBalance> {
    const params = year ? `?year=${year}` : '';
    return this.get<UserBalance>(`/api/v1/users/${id}/balance${params}`);
  }

  async createUser(data: Partial<User>): Promise<User> {
    return this.post<User>('/api/v1/users', data);
  }

  async updateUser(id: UUID, data: Partial<User>): Promise<User> {
    return this.patch<User>(`/api/v1/users/${id}`, data);
  }

  async deleteUser(id: UUID): Promise<void> {
    return this.delete(`/api/v1/users/${id}`);
  }

  // ============================================
  // SHIFT TYPES
  // ============================================

  async getShiftTypes(): Promise<ShiftType[]> {
    return this.get<ShiftType[]>('/api/v1/shift-types');
  }

  async getShiftType(id: UUID): Promise<ShiftType> {
    return this.get<ShiftType>(`/api/v1/shift-types/${id}`);
  }

  async createShiftType(data: CreateShiftTypeRequest): Promise<ShiftType> {
    return this.post<ShiftType>('/api/v1/shift-types', data);
  }

  async updateShiftType(id: UUID, data: UpdateShiftTypeRequest): Promise<ShiftType> {
    return this.patch<ShiftType>(`/api/v1/shift-types/${id}`, data);
  }

  async deleteShiftType(id: UUID): Promise<void> {
    return this.delete(`/api/v1/shift-types/${id}`);
  }

  // ============================================
  // PERIODS
  // ============================================

  async getPeriods(year?: number): Promise<Period[]> {
    const params = year ? `?year=${year}` : '';
    return this.get<Period[]>(`/api/v1/periods${params}`);
  }

  async getPeriod(id: UUID): Promise<Period> {
    return this.get<Period>(`/api/v1/periods/${id}`);
  }

  async getPeriodBalances(id: UUID): Promise<PeriodBalance[]> {
    return this.get<PeriodBalance[]>(`/api/v1/periods/${id}/balances`);
  }

  async generatePeriods(year: number): Promise<Period[]> {
    return this.post<Period[]>('/api/v1/periods/generate', { year });
  }

  // ============================================
  // SCHEDULES
  // ============================================

  async getSchedules(query?: ScheduleQuery): Promise<ScheduleWithDetails[]> {
    const params = new URLSearchParams();
    if (query?.userId) params.append('userId', query.userId);
    if (query?.startDate) params.append('startDate', query.startDate);
    if (query?.endDate) params.append('endDate', query.endDate);
    if (query?.periodId) params.append('periodId', query.periodId);
    const qs = params.toString();
    return this.get<ScheduleWithDetails[]>(`/api/v1/schedules${qs ? `?${qs}` : ''}`);
  }

  async getSchedule(id: UUID): Promise<ScheduleWithDetails> {
    return this.get<ScheduleWithDetails>(`/api/v1/schedules/${id}`);
  }

  async getPlanningMatrix(query: PlanningMatrixQuery): Promise<PlanningMatrixRow[]> {
    const params = new URLSearchParams({
      startDate: query.startDate,
      endDate: query.endDate,
    });
    if (query.userIds?.length) {
      query.userIds.forEach((id) => params.append('userIds', id));
    }
    return this.get<PlanningMatrixRow[]>(`/api/v1/schedules/matrix?${params}`);
  }

  async createSchedule(data: CreateScheduleRequest): Promise<Schedule> {
    return this.post<Schedule>('/api/v1/schedules', data);
  }

  async updateSchedule(id: UUID, data: Partial<CreateScheduleRequest>): Promise<Schedule> {
    return this.patch<Schedule>(`/api/v1/schedules/${id}`, data);
  }

  async bulkUpdateSchedules(data: BulkScheduleRequest): Promise<Schedule[]> {
    return this.post<Schedule[]>('/api/v1/schedules/bulk', data);
  }

  async deleteSchedule(id: UUID): Promise<void> {
    return this.delete(`/api/v1/schedules/${id}`);
  }

  // ============================================
  // LEAVE REQUESTS
  // ============================================

  async getLeaveRequests(query?: LeaveRequestQuery): Promise<LeaveRequest[]> {
    const params = new URLSearchParams();
    if (query?.userId) params.append('userId', query.userId);
    if (query?.status) params.append('status', query.status);
    if (query?.startDate) params.append('startDate', query.startDate);
    if (query?.endDate) params.append('endDate', query.endDate);
    const qs = params.toString();
    return this.get<LeaveRequest[]>(`/api/v1/leave-requests${qs ? `?${qs}` : ''}`);
  }

  async createLeaveRequest(data: CreateLeaveRequest): Promise<LeaveRequest> {
    return this.post<LeaveRequest>('/api/v1/leave-requests', data);
  }

  async approveLeaveRequest(id: UUID, data: ApproveLeaveRequest): Promise<LeaveRequest> {
    return this.post<LeaveRequest>(`/api/v1/leave-requests/${id}/approve`, data);
  }

  // ============================================
  // HOLIDAYS
  // ============================================

  async getHolidays(year?: number): Promise<Holiday[]> {
    const params = year ? `?year=${year}` : '';
    return this.get<Holiday[]>(`/api/v1/holidays${params}`);
  }

  async createHoliday(data: CreateHolidayRequest): Promise<Holiday> {
    return this.post<Holiday>('/api/v1/holidays', data);
  }

  async deleteHoliday(id: UUID): Promise<void> {
    return this.delete(`/api/v1/holidays/${id}`);
  }

  async generateHolidays(year: number): Promise<Holiday[]> {
    return this.post<Holiday[]>('/api/v1/holidays/generate', { year });
  }

  // ============================================
  // STATISTICS
  // ============================================

  async getDashboardStats(): Promise<DashboardStats> {
    return this.get<DashboardStats>('/api/v1/statistics/dashboard');
  }

  async getPeriodStats(id: UUID): Promise<PeriodStats> {
    return this.get<PeriodStats>(`/api/v1/statistics/period/${id}`);
  }

  async getUserStats(id: UUID): Promise<UserBalance> {
    return this.get<UserBalance>(`/api/v1/statistics/user/${id}`);
  }

  // ============================================
  // NOTIFICATIONS
  // ============================================

  async getNotifications(): Promise<Notification[]> {
    return this.get<Notification[]>('/api/v1/notifications');
  }

  async markNotificationRead(id: UUID): Promise<void> {
    return this.patch(`/api/v1/notifications/${id}`, { isRead: true });
  }

  // ============================================
  // HEALTH CHECK
  // ============================================

  async healthCheck(): Promise<{ status: string; version: string }> {
    return this.get('/health');
  }
}

// Singleton instance
export const api = new ApiClient(API_BASE_URL);

export default api;

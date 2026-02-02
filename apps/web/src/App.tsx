import { Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

// Layouts
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AuthLayout } from "@/components/layout/auth-layout";

// Pages
import { LoginPage } from "@/features/auth/pages/login-page";
import { RegisterPage } from "@/features/auth/pages/register-page";
import { DashboardPage } from "@/features/dashboard/pages/dashboard-page";
import { PlanningPage } from "@/features/planning/pages/planning-page";
import { AgentsPage } from "@/features/admin/pages/agents-page";
import { ShiftTypesPage } from "@/features/admin/pages/shift-types-page";
import { MySchedulePage } from "@/features/schedule/pages/my-schedule-page";
import { LeaveRequestsPage } from "@/features/leave/pages/leave-requests-page";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="planningos-theme">
        <Routes>
          {/* Auth routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Protected routes */}
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/planning" element={<PlanningPage />} />
            <Route path="/my-schedule" element={<MySchedulePage />} />
            <Route path="/leave-requests" element={<LeaveRequestsPage />} />
            <Route path="/admin/agents" element={<AgentsPage />} />
            <Route path="/admin/shift-types" element={<ShiftTypesPage />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

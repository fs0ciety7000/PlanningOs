import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

// Layouts
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AuthLayout } from "@/components/layout/auth-layout";

// Pages
import { LoginPage } from "@/features/auth/pages/login-page";
import { DashboardPage } from "@/features/dashboard/pages/dashboard-page";
import { PlanningPage } from "@/features/planning/pages/planning-page";
import { AgentsPage } from "@/features/admin/pages/agents-page";
import { ShiftTypesPage } from "@/features/admin/pages/shift-types-page";
import { MySchedulePage } from "@/features/schedule/pages/my-schedule-page";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="planningos-theme">
      <Routes>
        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* Protected routes */}
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/planning" element={<PlanningPage />} />
          <Route path="/my-schedule" element={<MySchedulePage />} />
          <Route path="/admin/agents" element={<AgentsPage />} />
          <Route path="/admin/shift-types" element={<ShiftTypesPage />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster />
    </ThemeProvider>
  );
}

export default App;

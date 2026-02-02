import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5">
      <div className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary">PlanningOS</h1>
          <p className="text-muted-foreground mt-2">
            Plateforme de gestion des plannings
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}

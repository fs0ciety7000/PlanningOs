// Sidebar navigation with role-based visibility

import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  FileText,
  UserCircle,
  CalendarCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

const navItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Planning',
    href: '/planning',
    icon: Calendar,
  },
  {
    title: 'Mon Planning',
    href: '/my-schedule',
    icon: UserCircle,
  },
  {
    title: 'Congés',
    href: '/leave-requests',
    icon: CalendarCheck,
  },
];

const adminItems = [
  {
    title: 'Agents',
    href: '/admin/agents',
    icon: Users,
  },
  {
    title: 'Types de Service',
    href: '/admin/shift-types',
    icon: FileText,
  },
  {
    title: 'Paramètres',
    href: '/admin/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const { user, isAdmin, isPlanner } = useAuthStore();
  const canManage = isPlanner() || isAdmin();

  return (
    <aside className="w-64 border-r bg-card flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b">
        <span className="text-xl font-bold text-primary">PlanningOS</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.title}
          </NavLink>
        ))}

        {/* Admin Section - only visible for planners and admins */}
        {canManage && (
          <div className="pt-4">
            <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Administration
            </p>
            {adminItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                {item.title}
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      {/* Footer with user info */}
      <div className="p-4 border-t">
        {user && (
          <div className="text-xs text-muted-foreground mb-2">
            <p className="font-medium text-foreground">{user.firstName} {user.lastName}</p>
            <p className="capitalize">{user.role}</p>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          PlanningOS v0.1.0
        </p>
      </div>
    </aside>
  );
}

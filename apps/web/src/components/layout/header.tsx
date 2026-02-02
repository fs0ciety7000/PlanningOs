// Header component with real user data from auth store

import { useNavigate } from 'react-router-dom';
import { Bell, Moon, Sun, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/theme-provider';
import { useAuthStore } from '@/stores/auth-store';
import { useLeaveRequests } from '@/hooks/use-api';

export function Header() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { user, logout, isPlanner, isAdmin } = useAuthStore();

  // Fetch pending leave requests count for planners
  const canManage = isPlanner() || isAdmin();
  const { data: pendingRequests = [] } = useLeaveRequests(
    { status: 'pending' },
    { enabled: canManage }
  );

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const notificationCount = canManage ? pendingRequests.length : 0;

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6">
      {/* Left side - breadcrumb/title could go here */}
      <div />

      {/* Right side - actions */}
      <div className="flex items-center gap-2">
        {/* Notifications - only for planners/admins */}
        {canManage && (
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => navigate('/leave-requests')}
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </Button>
        )}

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>

        {/* User menu */}
        <div className="flex items-center gap-3 ml-4 pl-4 border-l">
          {user ? (
            <>
              <div className="text-right">
                <p className="text-sm font-medium">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Déconnexion">
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
              <User className="h-4 w-4 mr-2" />
              Connexion
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

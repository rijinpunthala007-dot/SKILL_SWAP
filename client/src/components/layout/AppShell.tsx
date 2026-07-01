import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Users,
  MessageSquare,
  Bell,
  User,
  LogOut,
  Zap,
  ChevronRight,
  Trophy,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { requestsApi } from '../../services/api.service';
import clsx from 'clsx';

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Dashboard' },
  { to: '/discover', icon: Users, label: 'Discover' },
  { to: '/requests', icon: Bell, label: 'Requests' },
  { to: '/chats', icon: MessageSquare, label: 'Messages' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/profile', icon: User, label: 'Profile' },
];

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const { data: incomingData } = useQuery({
    queryKey: ['requests', 'incoming'],
    queryFn: () => requestsApi.getIncoming(),
    refetchInterval: 30000,
  });

  const pendingCount =
    incomingData?.data?.data?.filter((r) => r.status === 'pending').length ?? 0;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-surface-border bg-surface-card/50 backdrop-blur-xl">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-surface-border">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-gradient">SkillSwap</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to || location.pathname.startsWith(to + '/');
            return (
              <Link
                key={to}
                to={to}
                className={clsx(isActive ? 'nav-link-active' : 'nav-link', 'relative')}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {label === 'Requests' && pendingCount > 0 && (
                  <span className="ml-auto w-5 h-5 rounded-full bg-brand-500 text-white text-xs flex items-center justify-center font-bold">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3 h-3 text-brand-400 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div className="px-3 py-4 border-t border-surface-border">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-8 h-8 avatar" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center text-sm font-bold">
                {user?.name?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-white/40 truncate">{user?.email}</p>
            </div>
          </div>

          <button onClick={logout} className="nav-link w-full mt-1 text-red-400 hover:text-red-300 hover:bg-red-900/20">
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden flex border-t border-surface-border bg-surface-card/90 backdrop-blur-xl">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={clsx(
                'flex-1 flex flex-col items-center py-3 gap-1 text-xs transition-colors duration-200',
                isActive ? 'text-brand-400' : 'text-white/40'
              )}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          );
        })}
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {children}
        </div>
      </main>
    </div>
  );
}

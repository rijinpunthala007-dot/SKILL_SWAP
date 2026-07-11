import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logoImg from '../../assets/logo.svg';
import {
  Home,
  Users,
  MessageSquare,
  Bell,
  User,
  LogOut,
  ChevronRight,
  Trophy,
  BarChart3,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { requestsApi } from '../../services/api.service';
import clsx from 'clsx';

const navItems = [
  { to: '/dashboard',   icon: Home,         label: 'Dashboard'    },
  { to: '/discover',    icon: Users,        label: 'Discover'     },
  { to: '/requests',    icon: Bell,         label: 'Requests'     },
  { to: '/chats',       icon: MessageSquare,label: 'Messages'     },
  { to: '/leaderboard', icon: Trophy,       label: 'Leaderboard'  },
  { to: '/analytics',   icon: BarChart3,    label: 'Analytics'    },
  { to: '/profile',     icon: User,         label: 'Profile'      },
];

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: incomingData } = useQuery({
    queryKey: ['requests', 'incoming'],
    queryFn: () => requestsApi.getIncoming(),
    refetchInterval: 30000,
  });

  const pendingCount =
    incomingData?.data?.data?.filter((r) => r.status === 'pending').length ?? 0;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">

      {/* ── Mobile Top Header ────────────────────────── */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 fixed top-0 left-0 right-0 z-40 bg-slate-950/80 border-b border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <img src={logoImg} alt="SkillSwap" className="w-8 h-8 object-contain" />
          <span className="text-base font-bold text-gradient">SkillSwap</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex items-center gap-2 px-2 py-1 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all"
        >
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full object-cover" />
          ) : (
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br from-indigo-500 to-purple-600">
              {user?.name?.[0]?.toUpperCase()}
            </div>
          )}
          <span className="text-xs text-white/70 pr-1">{user?.name?.split(' ')[0]}</span>
        </button>
      </header>

      {/* ── Mobile Dropdown / Slide-out Menu ─────────── */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          {/* Menu Panel */}
          <div className="relative w-64 h-full bg-slate-900 border-l border-white/10 p-5 flex flex-col justify-between animate-fade-in shadow-2xl">
            <div>
              <div className="flex items-center justify-between mb-8">
                <span className="text-sm font-semibold text-white/50">Navigation</span>
                <button onClick={() => setMobileMenuOpen(false)} className="text-white/40 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="space-y-1">
                {navItems.map(({ to, icon: Icon, label }) => {
                  const isActive = location.pathname === to || location.pathname.startsWith(to + '/');
                  return (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={clsx(
                        isActive ? 'bg-indigo-600/15 text-indigo-400 border-r-2 border-indigo-500 font-semibold' : 'text-white/60 hover:bg-white/5',
                        'flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                      {label === 'Requests' && pendingCount > 0 && (
                        <span className="ml-auto w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold bg-indigo-500">
                          {pendingCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Desktop Sidebar ──────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 flex-shrink-0"
        style={{
          background: 'rgba(7, 7, 20, 0.95)',
          borderRight: '1px solid rgba(99,102,241,0.1)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5"
          style={{ borderBottom: '1px solid rgba(99,102,241,0.08)' }}
        >
          <img src={logoImg} alt="SkillSwap" className="w-9 h-9 object-contain" />
          <span className="text-base font-bold text-gradient">SkillSwap</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto scrollbar-hide">
          <p className="section-label px-3 mb-3">Menu</p>
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to || location.pathname.startsWith(to + '/');
            return (
              <Link
                key={to}
                to={to}
                className={clsx(isActive ? 'nav-link-active' : 'nav-link', 'relative group')}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-sm">{label}</span>

                {label === 'Requests' && pendingCount > 0 && (
                  <span className="w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #7c3aed)' }}
                  >
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}

                {isActive && (
                  <ChevronRight className="w-3 h-3 text-brand-400 flex-shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(99,102,241,0.08)' }}>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-8 h-8 avatar flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #6366f1, #7c3aed)' }}
              >
                {user?.name?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs text-white/30 truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="nav-link w-full text-red-400/70 hover:text-red-300 mt-0.5"
            style={{ fontSize: '13px' }}
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom nav ─────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden flex"
        style={{
          background: 'rgba(7, 7, 20, 0.95)',
          borderTop: '1px solid rgba(99,102,241,0.12)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {navItems.slice(0, 4).map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to || (location.pathname.startsWith(to + '/') && to !== '/dashboard');
          return (
            <Link
              key={to}
              to={to}
              className="flex-1 flex flex-col items-center py-2.5 gap-1 transition-colors duration-200"
              style={{ color: isActive ? '#818cf8' : 'rgba(255,255,255,0.3)' }}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
        {/* Mobile Menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex-1 flex flex-col items-center py-2.5 gap-1 transition-colors duration-200"
          style={{ color: mobileMenuOpen ? '#818cf8' : 'rgba(255,255,255,0.3)' }}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </div>

      {/* ── Main content ──────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto pt-14 pb-16 md:pt-0 md:pb-0">
          {children}
        </div>
      </main>
    </div>
  );
}

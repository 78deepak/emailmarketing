import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Layers,
  Settings,
  ExternalLink,
  LogOut,
  ShieldCheck,
  Activity,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Super-admin shell.
 *
 * Professional platform control plane layout with distinct dark/glass navigation,
 * real-time server health pill, quick links to customer app, and authenticated admin status.
 */
export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground antialiased">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card/95 backdrop-blur transition-transform duration-200 md:static md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="flex h-16 items-center justify-between border-b border-border/80 px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm tracking-tight text-foreground">
                  Platform Admin
                </span>
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  ROOT
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">Control Plane</p>
            </div>
          </div>
          <button
            type="button"
            className="md:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* System Health Status Badge */}
        <div className="mx-3 my-3 rounded-lg border border-border/60 bg-muted/40 p-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-medium">Status</span>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                Operational
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-2 text-sm font-medium">
          <AdminNavLink to="/admin" end onClick={() => setMobileOpen(false)}>
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </AdminNavLink>

          <AdminNavLink to="/admin/customers" onClick={() => setMobileOpen(false)}>
            <Building2 className="h-4 w-4" />
            <span>Customers & Tenants</span>
          </AdminNavLink>

          <AdminNavLink to="/admin/plans" onClick={() => setMobileOpen(false)}>
            <Layers className="h-4 w-4" />
            <span>Plans & Billing</span>
          </AdminNavLink>

          <AdminNavLink to="/admin/settings" onClick={() => setMobileOpen(false)}>
            <Settings className="h-4 w-4" />
            <span>Platform Settings</span>
          </AdminNavLink>
        </nav>

        {/* Bottom Actions */}
        <div className="border-t border-border/80 p-3 space-y-1">
          <NavLink
            to="/app"
            className="flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Go to Customer App</span>
          </NavLink>

          <div className="pt-2">
            <div className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 p-2">
              <div className="truncate">
                <p className="truncate text-xs font-medium">{user?.email || 'admin@platform.com'}</p>
                <p className="text-[10px] text-muted-foreground">Super Administrator</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={handleSignOut}
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-card/60 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="md:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-[11px] font-medium uppercase tracking-wider">
                Platform Console
              </Badge>
              <span className="hidden text-xs text-muted-foreground sm:inline">
                Global multi-tenant governance
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <Activity className="h-3.5 w-3.5 text-emerald-500" />
              <span>Multi-Tenant Engine v1.0</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="text-xs h-8 gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </Button>
          </div>
        </header>

        {/* Page View */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function AdminNavLink({
  to,
  end,
  children,
  onClick,
}: {
  to: string;
  end?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-2.5 rounded-lg px-3 py-2 transition-all ${
          isActive
            ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`
      }
    >
      {children}
    </NavLink>
  );
}

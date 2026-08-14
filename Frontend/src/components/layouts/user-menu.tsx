import { Link, useNavigate } from 'react-router-dom';
import { CreditCard, LogOut, Settings, User } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/stores/auth.store';
import { getDisplayName, getUserInitials } from '@/lib/user-display';

/**
 * User menu — the "avatar + click for dropdown" in the top-right of the
 * app shell.
 *
 * Trigger renders the avatar (initials fallback since we don't collect
 * profile photos yet), name + email inline for wider screens, initials
 * only on narrow. Menu items point at routes that mostly don't exist
 * yet — clicking Settings/Billing today falls through to /app via the
 * catch-all route, which is fine as a placeholder.
 *
 * Logout: clears the auth store (which flips `isAuthenticated`), then
 * the router's guard immediately bounces us to /auth/login.
 */
export function UserMenu() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  if (!user) return null;

  const initials = getUserInitials(user);
  const displayName = getDisplayName(user);

  const handleLogout = () => {
    logout();
    // Explicit navigate as belt-and-suspenders. Guard would redirect on
    // next render anyway, but the immediate nav feels snappier.
    navigate('/auth/login', { replace: true });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-auto items-center gap-2 py-1.5 pl-1.5 pr-2 hover:bg-accent"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          {/* Hide name text on narrow screens — avatar alone is enough. */}
          <div className="hidden text-left sm:block">
            <div className="text-sm font-medium leading-tight">{displayName}</div>
            <div className="text-xs leading-tight text-muted-foreground">
              {user.email}
            </div>
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="text-sm font-medium">{displayName}</div>
          <div className="text-xs text-muted-foreground">{user.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link to="/app/settings/profile">
            <User />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/app/settings">
            <Settings />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/app/billing">
            <CreditCard />
            <span>Billing</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onSelect={handleLogout}>
          <LogOut />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

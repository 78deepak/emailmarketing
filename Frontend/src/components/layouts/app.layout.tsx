import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layouts/sidebar';
import { UserMenu } from '@/components/layouts/user-menu';
import { CommandPalette } from '@/components/layouts/command-palette';
import { TrialBanner } from '@/features/billing/trial-banner';

/**
 * Customer app shell — polished version.
 *
 * Structure:
 *   +--------+----------------------------------------+
 *   |        | trial banner (conditional, thin strip) |
 *   |  side  +----------------------------------------+
 *   |  bar   | topbar: [⌘K search]        [user menu] |
 *   |        +----------------------------------------+
 *   |        | <Outlet /> — page content              |
 *   |        |                                        |
 *   +--------+----------------------------------------+
 *
 * Sidebar hides on <md; on mobile we'll add a hamburger later. For now
 * users on small screens see the top bar + content only — good enough
 * for Chunk 5's dashboard verification.
 */
export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        {/* Banner sits ABOVE the top bar — it's global context, not per-page */}
        <TrialBanner />

        <header className="flex h-14 items-center justify-between gap-4 border-b border-border bg-card px-4">
          <CommandPalette />
          <UserMenu />
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

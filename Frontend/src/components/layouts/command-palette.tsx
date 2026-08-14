import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Send,
  Zap,
  FileText,
  Users,
  List,
  Tag,
  PenLine,
  Globe,
  Mail,
  ShieldAlert,
  CreditCard,
  Settings,
  User,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command';

/**
 * Command palette — ⌘K / Ctrl+K opens a searchable nav modal.
 *
 * v1 lists nav items only. Later chunks add "actions" (Create campaign,
 * Add contact, Import CSV) and "results" (search contacts by email, jump
 * to a specific campaign). The Command / CommandGroup structure is ready
 * for those additions — just add more <CommandGroup> blocks.
 *
 * Trigger is the pill button rendered by the caller (top bar); this
 * component owns the open/close state + keyboard listener.
 */

interface NavShortcut {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords?: string[]; // extra fuzzy-match tokens
}

const NAV: NavShortcut[] = [
  { label: 'Home', to: '/app', icon: LayoutDashboard, keywords: ['dashboard'] },
  { label: 'Email Campaigns', to: '/app/campaigns', icon: Send },
  { label: 'Automations', to: '/app/automations', icon: Zap, keywords: ['workflow'] },
  { label: 'Templates', to: '/app/templates', icon: FileText },
  { label: 'Contacts', to: '/app/contacts', icon: Users, keywords: ['subscribers', 'people'] },
  { label: 'Lists', to: '/app/lists', icon: List },
  { label: 'Tags', to: '/app/tags', icon: Tag },
  { label: 'Forms', to: '/app/forms', icon: PenLine },
  { label: 'Sending Domains', to: '/app/sending/domains', icon: Globe, keywords: ['dns'] },
  { label: 'Signatures', to: '/app/sending/signatures', icon: Mail },
  { label: 'Blacklist', to: '/app/sending/blacklist', icon: ShieldAlert },
];

const SETTINGS: NavShortcut[] = [
  { label: 'Profile', to: '/app/settings/profile', icon: User },
  { label: 'Settings', to: '/app/settings', icon: Settings },
  { label: 'Billing', to: '/app/billing', icon: CreditCard, keywords: ['plan', 'subscription'] },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Global ⌘K / Ctrl+K listener. Toggles the palette from anywhere in
  // the app. Runs once on mount.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  return (
    <>
      {/* Trigger — a subtle pill that also communicates the shortcut. */}
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-9 gap-2 text-muted-foreground hover:text-foreground"
      >
        <span className="hidden text-sm sm:inline">Search…</span>
        <span className="sm:hidden">Search</span>
        <kbd className="hidden items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Navigate or search…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Navigation">
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.to}
                  value={`${item.label} ${item.keywords?.join(' ') ?? ''}`}
                  onSelect={() => go(item.to)}
                >
                  <Icon />
                  <span>{item.label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>

          <CommandGroup heading="Account">
            {SETTINGS.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.to}
                  value={`${item.label} ${item.keywords?.join(' ') ?? ''}`}
                  onSelect={() => go(item.to)}
                >
                  <Icon />
                  <span>{item.label}</span>
                  {item.to === '/app/billing' && (
                    <CommandShortcut>Plan</CommandShortcut>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}

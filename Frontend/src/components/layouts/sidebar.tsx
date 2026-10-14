import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Send,
  Zap,
  FileText,
  Users,
  List,
  Tag,
  Layers,
  Mail,
  Globe,
  ShieldAlert,
  PenLine,
  CreditCard,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Sidebar — customer app navigation.
 *
 * Sections mirror the Acelle screenshot: a HOME item, then CAMPAIGNS,
 * AUDIENCE, SENDING groups with lucide icons. Active state gets a green
 * background + green text (via our design tokens).
 */

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  heading: string | null; // null = no heading (used for the Home item)
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    heading: null,
    items: [{ label: 'Home', to: '/app', icon: LayoutDashboard }],
  },
  {
    heading: 'Campaigns',
    items: [
      { label: 'Email', to: '/app/campaigns', icon: Send },
      { label: 'Automation', to: '/app/automations', icon: Zap },
      { label: 'Templates', to: '/app/templates', icon: FileText },
    ],
  },
  {
    heading: 'Audience',
    items: [
      { label: 'Contacts', to: '/app/contacts', icon: Users },
      { label: 'Lists', to: '/app/lists', icon: List },
      { label: 'Segments', to: '/app/segments', icon: Layers },
      { label: 'Tags', to: '/app/tags', icon: Tag },
      { label: 'Forms', to: '/app/forms', icon: PenLine },
    ],
  },
  {
    heading: 'Sending',
    items: [
      { label: 'Sending Domains', to: '/app/sending/domains', icon: Globe },
      { label: 'Signatures', to: '/app/sending/signatures', icon: Mail },
      { label: 'Blacklist', to: '/app/sending/blacklist', icon: ShieldAlert },
    ],
  },
  {
    heading: 'Workspace',
    items: [
      { label: 'Billing & Plans', to: '/app/billing', icon: CreditCard },
      { label: 'Settings', to: '/app/settings', icon: Settings },
    ],
  },
];

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card md:flex">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <div className="h-6 w-6 rounded-md bg-primary" />
        <span className="text-sm font-semibold">Email Marketing</span>
      </div>

      {/* Nav — scrollable in case sections grow */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {SECTIONS.map((section, i) => (
          <div key={i} className={cn(i > 0 && 'mt-6')}>
            {section.heading && (
              <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.heading}
              </div>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.to}>
                  <SidebarLink item={item} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}

function SidebarLink({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      // `end` only on the /app root — otherwise "Home" would stay active
      // on every /app/* subroute since they all start with /app.
      end={item.to === '/app'}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground',
        )
      }
    >
      <Icon className="h-4 w-4" />
      {item.label}
    </NavLink>
  );
}

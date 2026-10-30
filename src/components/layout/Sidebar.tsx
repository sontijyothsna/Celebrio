import { CalendarDays, LayoutDashboard, ListChecks, Settings, Sparkles, Users, Wallet, X, type LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/planner', label: 'AI Event Planner', icon: Sparkles },
  { to: '/events', label: 'My Events', icon: CalendarDays },
  { to: '/budget', label: 'Budget Manager', icon: Wallet },
  { to: '/guests', label: 'Guest Management', icon: Users },
  { to: '/tasks', label: 'Task Checklist', icon: ListChecks },
  { to: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-ink-900/40 transition-opacity lg:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-ink-200 bg-white transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Main navigation"
      >
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </div>
            <span className="text-lg font-semibold text-ink-900">Celebrio</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-ink-500 hover:bg-ink-100 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-ink-100 hover:text-ink-900'
                }`
              }
            >
              <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-ink-200 px-6 py-4 text-xs text-ink-500">Plan every celebration in one place.</div>
      </aside>
    </>
  );
}

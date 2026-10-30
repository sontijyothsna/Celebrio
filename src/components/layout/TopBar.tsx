import { Bell, Menu } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAsync } from '../../hooks/useAsync';
import { getTaskStatus, isUrgentTask, sortTasksByUrgency } from '../../lib/tasks';
import { formatDateOnly, todayDateOnly } from '../../lib/format';
import { useSettings } from '../../context/SettingsContext';
import { listTasks } from '../../services/tasksService';

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { profileName } = useSettings();
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-ink-200 bg-white/90 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-md p-2 text-ink-700 hover:bg-ink-100 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <span className="text-sm font-medium text-ink-500 lg:hidden">Celebrio</span>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <NotificationsMenu />
        <div className="flex items-center gap-3 border-l border-ink-200 pl-3 sm:pl-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-100 text-sm font-semibold text-gold-700" aria-hidden="true">
            {profileName.charAt(0).toUpperCase()}
          </div>
          <span className="hidden text-sm font-medium text-ink-900 sm:block">{profileName}</span>
        </div>
      </div>
    </header>
  );
}

function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: tasks, error, loading, reload } = useAsync(listTasks, []);

  useEffect(() => {
    if (!open) return;
    const handlePointer = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handlePointer);
    return () => document.removeEventListener('mousedown', handlePointer);
  }, [open]);

  const today = todayDateOnly();
  const urgent = sortTasksByUrgency(
    (tasks ?? []).filter((task) => isUrgentTask(getTaskStatus(task, today))),
    today,
  );

  const toggle = () => {
    if (!open) reload();
    setOpen((value) => !value);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={toggle}
        className="relative rounded-lg p-2 text-ink-700 hover:bg-ink-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        aria-label={urgent.length > 0 ? `Notifications, ${urgent.length} urgent tasks` : 'Notifications'}
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {urgent.length > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-600 px-1 text-[10px] font-semibold text-white">
            {urgent.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] animate-fade-in rounded-xl border border-ink-200 bg-white p-2 shadow-pop">
          <p className="px-3 py-2 text-sm font-semibold text-ink-900">Tasks needing attention</p>
          {loading && <p className="px-3 py-4 text-sm text-ink-500">Checking your tasks...</p>}
          {error && <p className="px-3 py-4 text-sm text-danger-700">Notifications could not be loaded.</p>}
          {!loading && !error && urgent.length === 0 && (
            <p className="px-3 py-4 text-sm text-ink-500">You are all caught up. No urgent or overdue tasks.</p>
          )}
          {!loading && !error && urgent.slice(0, 6).map((task) => {
            const status = getTaskStatus(task, today);
            return (
              <Link
                key={task.id}
                to="/tasks"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 hover:bg-ink-100"
              >
                <p className="text-sm font-medium text-ink-900">{task.title}</p>
                <p className={`text-xs ${status === 'overdue' ? 'text-danger-700' : 'text-warning-700'}`}>
                  {status === 'overdue' ? 'Overdue' : status === 'due_today' ? 'Due today' : 'Due soon'}
                  {task.due_date ? ` - ${formatDateOnly(task.due_date)}` : ''}
                  {task.events?.name ? ` - ${task.events.name}` : ''}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

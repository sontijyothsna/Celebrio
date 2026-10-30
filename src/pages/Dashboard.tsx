import { CalendarClock, CalendarDays, ListChecks, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAsync } from '../hooks/useAsync';
import { useSelectedEvent } from '../context/SelectedEventContext';
import { useSettings } from '../context/SettingsContext';
import { formatDateOnly, formatRelativeDays, daysBetween, todayDateOnly } from '../lib/format';
import { getTaskStatus } from '../lib/tasks';
import { EVENT_TYPE_LABELS, type EventRow } from '../types/database';
import { listRecentActivity } from '../services/activityService';
import { listTasks } from '../services/tasksService';
import { Badge, Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States';
import { PageHeader, StatCard } from '../components/ui/PageParts';

const UPCOMING_LIMIT = 4;

export function Dashboard() {
  const { events, eventsLoading, eventsError, reloadEvents, selectEvent } = useSelectedEvent();
  const { formatMoney } = useSettings();
  const tasks = useAsync(listTasks, []);
  const activity = useAsync(listRecentActivity, []);
  const today = todayDateOnly();

  if (eventsLoading && events.length === 0) {
    return (
      <>
        <PageHeader title="Dashboard" description="An overview of your celebrations." />
        <LoadingState label="Loading your dashboard..." />
      </>
    );
  }

  if (eventsError) {
    return (
      <>
        <PageHeader title="Dashboard" description="An overview of your celebrations." />
        <ErrorState message={eventsError} onRetry={reloadEvents} />
      </>
    );
  }

  const upcoming = events
    .filter((event) => daysBetween(today, event.event_date) >= 0)
    .sort((a, b) => a.event_date.localeCompare(b.event_date));
  const totalBudget = events.reduce((sum, event) => sum + event.total_budget, 0);
  const pendingTasks = (tasks.data ?? []).filter((task) => getTaskStatus(task, today) !== 'completed').length;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="An overview of your celebrations, budgets and what needs doing next."
        actions={
          <Link to="/planner">
            <Button>Plan a new event</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total events" value={String(events.length)} icon={<CalendarDays className="h-5 w-5" aria-hidden="true" />} />
        <StatCard label="Upcoming events" value={String(upcoming.length)} icon={<CalendarClock className="h-5 w-5" aria-hidden="true" />} />
        <StatCard
          label="Planned budget"
          value={formatMoney(totalBudget)}
          icon={<Wallet className="h-5 w-5" aria-hidden="true" />}
          hint="Sum of each event's total budget"
        />
        <StatCard
          label="Pending tasks"
          value={tasks.error ? '-' : String(pendingTasks)}
          icon={<ListChecks className="h-5 w-5" aria-hidden="true" />}
          hint={tasks.error ? 'Could not load tasks' : 'Across all events'}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2" aria-labelledby="upcoming-heading">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="upcoming-heading" className="text-base font-semibold text-ink-900">Upcoming events</h2>
            <Link to="/events" className="text-sm font-medium text-brand-700 hover:text-brand-800">
              View all
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="h-6 w-6" aria-hidden="true" />}
              title="No upcoming events"
              description="Use the AI Event Planner to create your next celebration. Dates must be today or later."
              action={
                <Link to="/planner">
                  <Button>Open AI Event Planner</Button>
                </Link>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {upcoming.slice(0, UPCOMING_LIMIT).map((event) => (
                <EventCard key={event.id} event={event} today={today} onOpen={() => selectEvent(event.id)} />
              ))}
            </div>
          )}
        </section>

        <Card>
          <CardHeader title="Recent activity" />
          {activity.loading && <LoadingState label="Loading activity..." />}
          {activity.error && <ErrorState message={activity.error} onRetry={activity.reload} />}
          {!activity.loading && !activity.error && (activity.data ?? []).length === 0 && (
            <p className="text-sm text-ink-500">Changes to your events will appear here.</p>
          )}
          {!activity.loading && !activity.error && (
            <ul className="space-y-4">
              {(activity.data ?? []).map((item) => (
                <li key={item.id} className="border-l-2 border-brand-200 pl-3">
                  <p className="text-sm text-ink-900">{item.message}</p>
                  <p className="text-xs text-ink-500">{new Date(item.created_at).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {tasks.error && <p className="mt-6 text-sm text-danger-700">Pending task count could not be loaded: {tasks.error}</p>}
    </>
  );
}

function EventCard({ event, today, onOpen }: { event: EventRow; today: string; onOpen: () => void }) {
  const days = daysBetween(today, event.event_date);
  const { formatMoney } = useSettings();
  return (
    <Card className="flex flex-col transition-shadow hover:shadow-pop">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-ink-900">{event.name}</p>
          <p className="text-sm text-ink-500">{EVENT_TYPE_LABELS[event.event_type]}</p>
        </div>
        <Badge tone={days <= 7 ? 'gold' : 'brand'}>{formatRelativeDays(days)}</Badge>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-ink-500">Date</dt>
          <dd className="font-medium text-ink-900">{formatDateOnly(event.event_date)}</dd>
        </div>
        <div>
          <dt className="text-ink-500">Guests</dt>
          <dd className="font-medium text-ink-900">{event.guest_count}</dd>
        </div>
        <div>
          <dt className="text-ink-500">Budget</dt>
          <dd className="font-medium text-ink-900">{formatMoney(event.total_budget)}</dd>
        </div>
      </dl>
      <div className="mt-5 flex justify-end">
        <Link to="/events" onClick={onOpen} className="text-sm font-medium text-brand-700 hover:text-brand-800">
          Manage event
        </Link>
      </div>
    </Card>
  );
}

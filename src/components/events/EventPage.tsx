import { CalendarDays } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { formatDateOnly } from '../../lib/format';
import { useSelectedEvent } from '../../context/SelectedEventContext';
import type { EventRow } from '../../types/database';
import { Button } from '../ui/Button';
import { EmptyState, ErrorState, LoadingState } from '../ui/States';
import { PageHeader } from '../ui/PageParts';

export function EventSwitcher() {
  const { events, selectedEvent, selectEvent } = useSelectedEvent();
  if (events.length === 0) return null;
  return (
    <div className="flex w-full items-center gap-2 sm:w-auto">
      <label htmlFor="active-event" className="text-sm text-ink-500">
        Event
      </label>
      <select
        id="active-event"
        value={selectedEvent?.id ?? ''}
        onChange={(event) => selectEvent(event.target.value)}
        className="h-10 min-w-0 flex-1 rounded-lg border border-ink-300 bg-white px-3 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 sm:w-64 sm:flex-none"
      >
        {events.map((event) => (
          <option key={event.id} value={event.id}>
            {event.name} ({formatDateOnly(event.event_date)})
          </option>
        ))}
      </select>
    </div>
  );
}

interface EventPageProps {
  title: string;
  description: string;
  children: (event: EventRow) => ReactNode;
}

export function EventPage({ title, description, children }: EventPageProps) {
  const { events, eventsLoading, eventsError, reloadEvents, selectedEvent } = useSelectedEvent();

  if (eventsLoading && events.length === 0) {
    return (
      <>
        <PageHeader title={title} description={description} />
        <LoadingState label="Loading your events..." />
      </>
    );
  }

  if (eventsError) {
    return (
      <>
        <PageHeader title={title} description={description} />
        <ErrorState message={eventsError} onRetry={reloadEvents} />
      </>
    );
  }

  if (!selectedEvent) {
    return (
      <>
        <PageHeader title={title} description={description} />
        <EmptyState
          icon={<CalendarDays className="h-6 w-6" aria-hidden="true" />}
          title="No event selected yet"
          description="Create your first celebration with the AI Event Planner, then come back here to manage it."
          action={
            <Link to="/planner">
              <Button>Plan an event</Button>
            </Link>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader title={title} description={description} actions={<EventSwitcher />} />
      {children(selectedEvent)}
    </>
  );
}

import { CalendarDays, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { EventFormFields } from '../components/events/EventFormFields';
import { Badge, Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States';
import { PageHeader } from '../components/ui/PageParts';
import { useSelectedEvent } from '../context/SelectedEventContext';
import { useSettings } from '../context/SettingsContext';
import { getErrorMessage } from '../lib/errors';
import { formatDateOnly, todayDateOnly } from '../lib/format';
import {
  formValuesFromPlanInput,
  toPlanInput,
  validatePlanInput,
  type EventFormValues,
  type PlanInputErrors,
} from '../lib/planner/planInput';
import { deleteEvent, updateEvent } from '../services/eventsService';
import { EVENT_TYPE_LABELS, type EventRow } from '../types/database';

export function MyEvents() {
  const { events, eventsLoading, eventsError, reloadEvents, selectedEvent, selectEvent } = useSelectedEvent();
  const { formatMoney } = useSettings();
  const [editing, setEditing] = useState<EventRow | null>(null);
  const [deleting, setDeleting] = useState<EventRow | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  return (
    <>
      <PageHeader
        title="My Events"
        description="All of your celebrations. Choose one to work on in Budget, Guests and Tasks."
        actions={
          <Link to="/planner">
            <Button icon={<Plus className="h-4 w-4" aria-hidden="true" />}>New event</Button>
          </Link>
        }
      />

      {actionError && (
        <p className="mb-4 rounded-lg border border-danger-50 bg-danger-50 px-4 py-3 text-sm text-danger-700" role="alert">
          {actionError}
        </p>
      )}

      {eventsLoading && events.length === 0 && <LoadingState label="Loading events..." />}
      {eventsError && <ErrorState message={eventsError} onRetry={reloadEvents} />}
      {!eventsLoading && !eventsError && events.length === 0 && (
        <EmptyState
          icon={<CalendarDays className="h-6 w-6" aria-hidden="true" />}
          title="No events yet"
          description="Create your first celebration with the AI Event Planner. It will be saved here."
          action={
            <Link to="/planner">
              <Button>Plan an event</Button>
            </Link>
          }
        />
      )}

      {!eventsError && events.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => {
            const isActive = selectedEvent?.id === event.id;
            return (
              <Card key={event.id} className={`flex flex-col ${isActive ? 'ring-2 ring-brand-500' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold text-ink-900">{event.name}</h2>
                    <p className="text-sm text-ink-500">{EVENT_TYPE_LABELS[event.event_type]}</p>
                  </div>
                  {isActive ? <Badge tone="brand">Active</Badge> : null}
                </div>
                <dl className="mt-4 space-y-2 text-sm">
                  <Row label="Date" value={formatDateOnly(event.event_date)} />
                  <Row label="Location" value={event.location || 'Not set'} />
                  <Row label="Guests" value={String(event.guest_count)} />
                  <Row label="Budget" value={formatMoney(event.total_budget)} />
                  <Row label="Plan" value={event.plan_source === 'ai' ? 'AI-generated' : event.plan_source === 'rule_based' ? 'Rule-based' : 'None'} />
                </dl>
                <div className="mt-5 flex flex-wrap gap-2 border-t border-ink-200 pt-4">
                  {!isActive && (
                    <Button variant="secondary" size="sm" onClick={() => selectEvent(event.id)}>
                      Make active
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" icon={<Pencil className="h-4 w-4" aria-hidden="true" />} onClick={() => setEditing(event)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-danger-600 hover:bg-danger-50"
                    icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
                    onClick={() => setDeleting(event)}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {editing && (
        <EditEventDialog
          key={editing.id}
          event={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await reloadEvents();
          }}
        />
      )}

      <DeleteEventDialog
        event={deleting}
        onClose={() => setDeleting(null)}
        onDeleted={async (id) => {
          setDeleting(null);
          setActionError(null);
          if (selectedEvent?.id === id) selectEvent('');
          await reloadEvents();
        }}
        onError={setActionError}
      />
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-500">{label}</dt>
      <dd className="truncate text-right font-medium text-ink-900">{value}</dd>
    </div>
  );
}

function EditEventDialog({ event, onClose, onSaved }: { event: EventRow; onClose: () => void; onSaved: () => Promise<void> }) {
  const [values, setValues] = useState<EventFormValues>(() =>
    formValuesFromPlanInput({
      eventName: event.name,
      eventType: event.event_type,
      eventDate: event.event_date,
      location: event.location,
      guestCount: event.guest_count,
      totalBudget: event.total_budget,
      theme: event.theme,
      preferences: event.preferences,
    }),
  );
  const [errors, setErrors] = useState<PlanInputErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSubmit = async (submitEvent: FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();
    const input = toPlanInput(values);
    const validation = validatePlanInput(input, event.event_date < todayDateOnly() ? event.event_date : todayDateOnly());
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;
    setSaving(true);
    setSaveError(null);
    try {
      await updateEvent(event.id, input);
      await onSaved();
    } catch (err) {
      setSaveError(getErrorMessage(err, 'The changes could not be saved. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      title="Edit event"
      description="Changing the budget or guest count does not rewrite your existing plan or budget lines."
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" form="edit-event-form" loading={saving}>Save changes</Button>
        </>
      }
    >
      <form id="edit-event-form" onSubmit={handleSubmit} noValidate>
        <EventFormFields values={values} errors={errors} onChange={(patch) => { setValues((prev) => ({ ...prev, ...patch })); setErrors({}); }} today={todayDateOnly()} />
        {saveError && <p className="mt-4 text-sm text-danger-700" role="alert">{saveError}</p>}
      </form>
    </Modal>
  );
}

function DeleteEventDialog({
  event,
  onClose,
  onDeleted,
  onError,
}: {
  event: EventRow | null;
  onClose: () => void;
  onDeleted: (id: string) => Promise<void>;
  onError: (message: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!event) return;
    setDeleting(true);
    try {
      await deleteEvent(event.id);
      await onDeleted(event.id);
    } catch (err) {
      onError(getErrorMessage(err, 'The event could not be deleted. Please try again.'));
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal
      open={event !== null}
      title="Delete this event?"
      description={event ? `"${event.name}" and its guests, tasks and budget lines will be permanently removed.` : undefined}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={deleting}>Keep event</Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting}>Delete event</Button>
        </>
      }
    >
      <p className="text-sm text-ink-700">This cannot be undone. Use this only if you no longer need this celebration.</p>
    </Modal>
  );
}

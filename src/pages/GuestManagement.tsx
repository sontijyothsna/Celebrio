import { Mail, Pencil, Phone, Trash2, UserPlus, Users } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { EventPage } from '../components/events/EventPage';
import { Badge, Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { SelectField, TextAreaField, TextField } from '../components/ui/FormFields';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States';
import { StatCard } from '../components/ui/PageParts';
import { useAsync } from '../hooks/useAsync';
import { getErrorMessage } from '../lib/errors';
import { summarizeGuests } from '../lib/guests';
import { createGuest, deleteGuest, listGuests, updateGuest, type GuestInput } from '../services/guestsService';
import { RSVP_STATUSES, type EventRow, type GuestRow, type RsvpStatus } from '../types/database';

const RSVP_LABELS: Record<RsvpStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  declined: 'Declined',
};
const RSVP_OPTIONS = RSVP_STATUSES.map((status) => ({ value: status, label: RSVP_LABELS[status] }));
const RSVP_TONE: Record<RsvpStatus, 'warning' | 'success' | 'danger'> = {
  pending: 'warning',
  accepted: 'success',
  declined: 'danger',
};
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function GuestManagement() {
  return (
    <EventPage title="Guest Management" description="Keep track of who is invited and who is coming.">
      {(event) => <GuestContent event={event} />}
    </EventPage>
  );
}

function GuestContent({ event }: { event: EventRow }) {
  const { data: guests, error, loading, reload } = useAsync(() => listGuests(event.id), [event.id]);
  const [dialog, setDialog] = useState<{ mode: 'create' } | { mode: 'edit'; guest: GuestRow } | null>(null);
  const [deleting, setDeleting] = useState<GuestRow | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const stats = useMemo(() => (guests ? summarizeGuests(guests) : null), [guests]);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!guests) return [];
    if (!query) return guests;
    return guests.filter((guest) => guest.name.toLowerCase().includes(query) || guest.email.toLowerCase().includes(query));
  }, [guests, search]);

  if (loading && !guests) return <LoadingState label="Loading guests..." />;
  if (error && !guests) return <ErrorState message={error} onRetry={reload} />;

  const handleRsvpChange = async (guest: GuestRow, status: RsvpStatus) => {
    setActionError(null);
    try {
      await updateGuest(event.id, guest.id, toGuestInput({ ...guest, rsvp_status: status }));
      await reload();
    } catch (err) {
      setActionError(getErrorMessage(err, 'The RSVP could not be updated. Please try again.'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-500">Guests invited to <span className="font-medium text-ink-900">{event.name}</span></p>
        <Button icon={<UserPlus className="h-4 w-4" aria-hidden="true" />} onClick={() => setDialog({ mode: 'create' })}>
          Add guest
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Invited" value={String(stats.invited)} icon={<Users className="h-5 w-5" aria-hidden="true" />} />
          <StatCard label="Accepted" value={String(stats.accepted)} icon={<Users className="h-5 w-5" aria-hidden="true" />} hint={`${stats.declined} declined`} />
          <StatCard label="Awaiting reply" value={String(stats.pending)} icon={<Users className="h-5 w-5" aria-hidden="true" />} />
          <StatCard
            label="Expected headcount"
            value={String(stats.expectedHeadcount)}
            icon={<Users className="h-5 w-5" aria-hidden="true" />}
            hint={`${Math.round(stats.responseRate * 100)}% responded. Target: ${event.guest_count} guests`}
          />
        </div>
      )}

      {actionError && <p className="rounded-lg border border-danger-50 bg-danger-50 px-4 py-3 text-sm text-danger-700" role="alert">{actionError}</p>}

      <Card padded={false}>
        <div className="flex flex-col gap-3 border-b border-ink-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-ink-900">Guest list</h2>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or email"
            aria-label="Search guests"
            className="h-9 w-full rounded-lg border border-ink-300 bg-white px-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 sm:w-64"
          />
        </div>

        {(guests ?? []).length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<Users className="h-6 w-6" aria-hidden="true" />}
              title="No guests added yet"
              description="Add the people you are inviting. You can record their RSVP status as replies come in."
              action={<Button onClick={() => setDialog({ mode: 'create' })}>Add your first guest</Button>}
            />
          </div>
        ) : filtered.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-ink-500">No guests match "{search}".</p>
        ) : (
          <ul className="divide-y divide-ink-200">
            {filtered.map((guest) => (
              <li key={guest.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-ink-900">{guest.name}</p>
                    {guest.plus_ones > 0 && <Badge>+{guest.plus_ones}</Badge>}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
                    {guest.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" aria-hidden="true" />{guest.email}</span>}
                    {guest.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" aria-hidden="true" />{guest.phone}</span>}
                    {!guest.email && !guest.phone && <span>No contact details</span>}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="sr-only" htmlFor={`rsvp-${guest.id}`}>RSVP for {guest.name}</label>
                  <select
                    id={`rsvp-${guest.id}`}
                    value={guest.rsvp_status}
                    onChange={(event) => handleRsvpChange(guest, event.target.value as RsvpStatus)}
                    className="h-8 rounded-lg border border-ink-300 bg-white px-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  >
                    {RSVP_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <Badge tone={RSVP_TONE[guest.rsvp_status]}>{RSVP_LABELS[guest.rsvp_status]}</Badge>
                  <Button variant="ghost" size="sm" onClick={() => setDialog({ mode: 'edit', guest })} aria-label={`Edit ${guest.name}`}>
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-danger-600 hover:bg-danger-50" onClick={() => setDeleting(guest)} aria-label={`Remove ${guest.name}`}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <GuestDialog
        eventId={event.id}
        mode={dialog?.mode ?? 'create'}
        guest={dialog?.mode === 'edit' ? dialog.guest : null}
        open={dialog !== null}
        onClose={() => setDialog(null)}
        onSaved={async () => {
          setDialog(null);
          await reload();
        }}
      />

      <Modal
        open={deleting !== null}
        title="Remove this guest?"
        description={deleting ? `${deleting.name} will be removed from the guest list.` : undefined}
        onClose={() => setDeleting(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>Keep guest</Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (!deleting) return;
                try {
                  await deleteGuest(event.id, deleting.id, deleting.name);
                  setDeleting(null);
                  await reload();
                } catch (err) {
                  setActionError(getErrorMessage(err, 'The guest could not be removed. Please try again.'));
                  setDeleting(null);
                }
              }}
            >
              Remove guest
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-700">Their RSVP status will be lost. This cannot be undone.</p>
      </Modal>
    </div>
  );
}

function toGuestInput(guest: GuestRow): GuestInput {
  return {
    name: guest.name,
    email: guest.email,
    phone: guest.phone,
    rsvp_status: guest.rsvp_status,
    plus_ones: guest.plus_ones,
    notes: guest.notes,
  };
}

interface GuestDialogProps {
  eventId: string;
  mode: 'create' | 'edit';
  guest: GuestRow | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

function GuestDialog(props: GuestDialogProps) {
  return (
    <Modal open={props.open} title={props.mode === 'edit' ? 'Edit guest' : 'Add guest'} onClose={props.onClose}>
      <GuestForm key={props.guest?.id ?? 'new'} {...props} />
    </Modal>
  );
}

interface GuestFormValues {
  name: string;
  email: string;
  phone: string;
  rsvp_status: RsvpStatus;
  plus_ones: string;
  notes: string;
}

interface GuestFormErrors {
  name?: string;
  email?: string;
  phone?: string;
  plus_ones?: string;
  notes?: string;
}

function GuestForm({ eventId, mode, guest, onClose, onSaved }: GuestDialogProps) {
  const [values, setValues] = useState<GuestFormValues>(() => ({
    name: guest?.name ?? '',
    email: guest?.email ?? '',
    phone: guest?.phone ?? '',
    rsvp_status: guest?.rsvp_status ?? 'pending',
    plus_ones: String(guest?.plus_ones ?? 0),
    notes: guest?.notes ?? '',
  }));
  const [errors, setErrors] = useState<GuestFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const update = (patch: Partial<GuestFormValues>) => {
    setValues((previous) => ({ ...previous, ...patch }));
    setErrors({});
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateGuest(values);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    const input: GuestInput = {
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      rsvp_status: values.rsvp_status,
      plus_ones: Number(values.plus_ones),
      notes: values.notes.trim(),
    };

    setSaving(true);
    setSaveError(null);
    try {
      if (guest) await updateGuest(eventId, guest.id, input);
      else await createGuest(eventId, input);
      await onSaved();
    } catch (err) {
      setSaveError(getErrorMessage(err, 'The guest could not be saved. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <TextField label="Full name" value={values.name} onChange={(event) => update({ name: event.target.value })} error={errors.name} maxLength={120} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Email" type="email" value={values.email} onChange={(event) => update({ email: event.target.value })} error={errors.email} maxLength={200} />
        <TextField label="Phone" type="tel" value={values.phone} onChange={(event) => update({ phone: event.target.value })} error={errors.phone} maxLength={40} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField label="RSVP status" options={RSVP_OPTIONS} value={values.rsvp_status} onChange={(event) => update({ rsvp_status: event.target.value as RsvpStatus })} />
        <TextField label="Additional guests" type="number" min={0} max={20} inputMode="numeric" value={values.plus_ones} onChange={(event) => update({ plus_ones: event.target.value })} error={errors.plus_ones} hint="Plus-ones they are bringing" />
      </div>
      <TextAreaField label="Notes" value={values.notes} onChange={(event) => update({ notes: event.target.value })} error={errors.notes} rows={2} maxLength={1000} placeholder="Dietary needs, accessibility, seating preferences" />
      {saveError && <p className="text-sm text-danger-700" role="alert">{saveError}</p>}
      <div className="flex justify-end gap-3 border-t border-ink-200 pt-5">
        <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button type="submit" loading={saving}>{mode === 'edit' ? 'Save changes' : 'Add guest'}</Button>
      </div>
    </form>
  );
}

function validateGuest(values: GuestFormValues): GuestFormErrors {
  const errors: GuestFormErrors = {};
  const name = values.name.trim();
  if (name.length === 0) errors.name = 'Enter the guest\'s name.';
  else if (name.length > 120) errors.name = 'Keep the name under 120 characters.';

  const email = values.email.trim();
  if (email && (email.length > 200 || !EMAIL_PATTERN.test(email))) errors.email = 'Enter a valid email address.';

  const phone = values.phone.trim();
  if (phone && !/^[+\d\s()-]{5,40}$/.test(phone)) errors.phone = 'Enter a valid phone number.';

  const plusOnes = Number(values.plus_ones);
  if (values.plus_ones.trim() === '' || !Number.isInteger(plusOnes) || plusOnes < 0 || plusOnes > 20) {
    errors.plus_ones = 'Enter a whole number from 0 to 20.';
  }

  if (values.notes.trim().length > 1000) errors.notes = 'Keep notes under 1000 characters.';
  return errors;
}

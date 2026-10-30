import { EVENT_TYPE_LABELS, EVENT_TYPES } from '../../types/database';
import type { EventFormValues, PlanInputErrors } from '../../lib/planner/planInput';
import { SelectField, TextAreaField, TextField } from '../ui/FormFields';

interface EventFormFieldsProps {
  values: EventFormValues;
  errors: PlanInputErrors;
  onChange: (patch: Partial<EventFormValues>) => void;
  today: string;
}

const EVENT_TYPE_OPTIONS = EVENT_TYPES.map((type) => ({ value: type, label: EVENT_TYPE_LABELS[type] }));

export function EventFormFields({ values, errors, onChange, today }: EventFormFieldsProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <TextField
          label="Celebration name"
          value={values.eventName}
          onChange={(event) => onChange({ eventName: event.target.value })}
          error={errors.eventName}
          placeholder="e.g. Maya's 30th birthday"
          maxLength={120}
        />
      </div>
      <SelectField
        label="Event type"
        value={values.eventType}
        onChange={(event) => onChange({ eventType: event.target.value as EventFormValues['eventType'] })}
        options={EVENT_TYPE_OPTIONS}
        error={errors.eventType}
      />
      <TextField
        label="Event date"
        type="date"
        min={today}
        value={values.eventDate}
        onChange={(event) => onChange({ eventDate: event.target.value })}
        error={errors.eventDate}
      />
      <TextField
        label="Location"
        value={values.location}
        onChange={(event) => onChange({ location: event.target.value })}
        error={errors.location}
        placeholder="City, venue or 'At home'"
        hint="Optional. Venue availability is not checked automatically."
        maxLength={200}
      />
      <TextField
        label="Number of guests"
        type="number"
        inputMode="numeric"
        min={1}
        value={values.guestCount}
        onChange={(event) => onChange({ guestCount: event.target.value })}
        error={errors.guestCount}
      />
      <TextField
        label="Total budget"
        type="number"
        inputMode="decimal"
        min={0}
        step="any"
        value={values.totalBudget}
        onChange={(event) => onChange({ totalBudget: event.target.value })}
        error={errors.totalBudget}
        hint="Use the currency set in Settings."
      />
      <TextField
        label="Preferred theme"
        value={values.theme}
        onChange={(event) => onChange({ theme: event.target.value })}
        error={errors.theme}
        placeholder="e.g. Tropical sunset"
        maxLength={200}
      />
      <div className="sm:col-span-2">
        <TextAreaField
          label="Additional preferences"
          value={values.preferences}
          onChange={(event) => onChange({ preferences: event.target.value })}
          error={errors.preferences}
          placeholder="Dietary needs, music style, outdoor or indoor, accessibility, must-haves..."
          rows={3}
          maxLength={2000}
        />
      </div>
    </div>
  );
}

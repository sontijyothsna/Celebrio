import { EVENT_TYPES, type EventType } from '../../types/database';
import type { PlanInput } from '../../types/plan';

export type PlanInputErrors = Partial<Record<keyof PlanInput, string>>;

export interface EventFormValues {
  eventName: string;
  eventType: EventType;
  eventDate: string;
  location: string;
  guestCount: string;
  totalBudget: string;
  theme: string;
  preferences: string;
}

export const MAX_GUESTS = 10000;
export const MAX_BUDGET = 10_000_000;

export function createEmptyFormValues(defaultDate: string): EventFormValues {
  return {
    eventName: '',
    eventType: 'birthday',
    eventDate: defaultDate,
    location: '',
    guestCount: '',
    totalBudget: '',
    theme: '',
    preferences: '',
  };
}

export function formValuesFromPlanInput(input: PlanInput): EventFormValues {
  return {
    eventName: input.eventName,
    eventType: input.eventType,
    eventDate: input.eventDate,
    location: input.location,
    guestCount: String(input.guestCount),
    totalBudget: String(input.totalBudget),
    theme: input.theme,
    preferences: input.preferences,
  };
}

export function toPlanInput(values: EventFormValues): PlanInput {
  return {
    eventName: values.eventName,
    eventType: values.eventType,
    eventDate: values.eventDate,
    location: values.location,
    guestCount: parseNumber(values.guestCount),
    totalBudget: parseNumber(values.totalBudget),
    theme: values.theme,
    preferences: values.preferences,
  };
}

export function validatePlanInput(input: PlanInput, today: string): PlanInputErrors {
  const errors: PlanInputErrors = {};

  const name = input.eventName.trim();
  if (name.length === 0) errors.eventName = 'Give your celebration a name.';
  else if (name.length > 120) errors.eventName = 'Keep the name under 120 characters.';

  if (!EVENT_TYPES.includes(input.eventType)) errors.eventType = 'Choose an event type.';

  if (!input.eventDate) {
    errors.eventDate = 'Pick a date for the event.';
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(input.eventDate)) {
    errors.eventDate = 'Enter a valid date.';
  } else if (input.eventDate < today) {
    errors.eventDate = 'The event date cannot be in the past.';
  }

  if (input.location.trim().length > 200) errors.location = 'Keep the location under 200 characters.';

  if (!Number.isInteger(input.guestCount) || input.guestCount < 1) {
    errors.guestCount = 'Enter a whole number of at least 1 guest.';
  } else if (input.guestCount > MAX_GUESTS) {
    errors.guestCount = `Enter no more than ${MAX_GUESTS.toLocaleString()} guests.`;
  }

  if (!Number.isFinite(input.totalBudget) || input.totalBudget < 0) {
    errors.totalBudget = 'Enter a budget of 0 or more.';
  } else if (input.totalBudget > MAX_BUDGET) {
    errors.totalBudget = `Enter a budget under ${MAX_BUDGET.toLocaleString()}.`;
  }

  if (input.theme.trim().length > 200) errors.theme = 'Keep the theme under 200 characters.';
  if (input.preferences.trim().length > 2000) errors.preferences = 'Keep preferences under 2000 characters.';

  return errors;
}

function parseNumber(value: string): number {
  const trimmed = value.trim();
  if (trimmed === '') return Number.NaN;
  return Number(trimmed);
}

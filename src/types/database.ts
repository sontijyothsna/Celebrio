import type { EventPlan } from './plan';

export const EVENT_TYPES = [
  'birthday',
  'wedding',
  'anniversary',
  'graduation',
  'baby_shower',
  'corporate',
  'other',
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  birthday: 'Birthday',
  wedding: 'Wedding',
  anniversary: 'Anniversary',
  graduation: 'Graduation party',
  baby_shower: 'Baby shower',
  corporate: 'Corporate event',
  other: 'Other celebration',
};

export const BUDGET_CATEGORIES = [
  'venue',
  'food',
  'decoration',
  'entertainment',
  'miscellaneous',
] as const;
export type BudgetCategory = (typeof BUDGET_CATEGORIES)[number];

export const BUDGET_CATEGORY_LABELS: Record<BudgetCategory, string> = {
  venue: 'Venue',
  food: 'Food & catering',
  decoration: 'Decoration',
  entertainment: 'Entertainment',
  miscellaneous: 'Miscellaneous',
};

export const RSVP_STATUSES = ['pending', 'accepted', 'declined'] as const;
export type RsvpStatus = (typeof RSVP_STATUSES)[number];

export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export interface EventRow {
  id: string;
  name: string;
  event_type: EventType;
  event_date: string;
  location: string;
  guest_count: number;
  total_budget: number;
  theme: string;
  preferences: string;
  plan: EventPlan | null;
  plan_source: 'ai' | 'rule_based' | null;
  created_at: string;
  updated_at: string;
}

export interface GuestRow {
  id: string;
  event_id: string;
  name: string;
  email: string;
  phone: string;
  rsvp_status: RsvpStatus;
  plus_ones: number;
  notes: string;
  created_at: string;
}

export interface TaskRow {
  id: string;
  event_id: string;
  title: string;
  category: string;
  due_date: string | null;
  priority: TaskPriority;
  completed: boolean;
  completed_at: string | null;
  source: 'generated' | 'custom';
  created_at: string;
}

export interface TaskWithEvent extends TaskRow {
  events: { name: string } | null;
}

export interface BudgetItemRow {
  id: string;
  event_id: string;
  category: BudgetCategory;
  description: string;
  estimated_cost: number;
  actual_cost: number | null;
  created_at: string;
}

export interface ActivityRow {
  id: string;
  event_id: string | null;
  message: string;
  kind: string;
  created_at: string;
}

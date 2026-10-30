import { supabase } from '../lib/supabase';
import { taskDueDate } from '../lib/tasks';
import { logActivity } from './activityService';
import { BUDGET_CATEGORIES, BUDGET_CATEGORY_LABELS, type EventRow } from '../types/database';
import type { EventPlan, PlanInput } from '../types/plan';

export async function listEvents(): Promise<EventRow[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true });
  if (error) throw error;
  return (data ?? []) as EventRow[];
}

function toEventColumns(input: PlanInput) {
  return {
    name: input.eventName.trim(),
    event_type: input.eventType,
    event_date: input.eventDate,
    location: input.location.trim(),
    guest_count: input.guestCount,
    total_budget: input.totalBudget,
    theme: input.theme.trim(),
    preferences: input.preferences.trim(),
  };
}

export async function createEventWithPlan(input: PlanInput, plan: EventPlan, today: string): Promise<string> {
  const budgetLines = BUDGET_CATEGORIES.map((category) => ({
    category,
    description: `${BUDGET_CATEGORY_LABELS[category]} (planned target)`,
    estimated_cost: plan.budgetAllocation[category],
  }));
  const tasks = plan.tasks.map((task) => ({
    title: task.title,
    category: task.category,
    due_date: taskDueDate(input.eventDate, task.daysBeforeEvent, today),
    priority: task.priority,
  }));

  const { data, error } = await supabase.rpc('save_event_with_plan', {
    p_event: {
      ...toEventColumns(input),
      plan,
      plan_source: plan.source,
    },
    p_budget: budgetLines,
    p_tasks: tasks,
  });
  if (error) throw error;
  if (typeof data !== 'string') throw new Error('The event was not saved. Please try again.');
  return data;
}

export async function updateEvent(id: string, input: PlanInput): Promise<void> {
  const columns = toEventColumns(input);
  const { error } = await supabase
    .from('events')
    .update({ ...columns, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
  await logActivity(id, `Updated event details for "${columns.name}"`, 'event_updated');
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw error;
}

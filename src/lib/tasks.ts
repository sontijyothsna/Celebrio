import type { TaskRow } from '../types/database';
import { addDaysDateOnly, daysBetween } from './format';

export function taskDueDate(eventDate: string, daysBeforeEvent: number, today: string): string {
  const due = addDaysDateOnly(eventDate, -daysBeforeEvent);
  return due < today ? today : due;
}

export type TaskStatus = 'completed' | 'overdue' | 'due_today' | 'due_soon' | 'upcoming' | 'no_date';

export const DUE_SOON_DAYS = 3;

export function getTaskStatus(task: Pick<TaskRow, 'completed' | 'due_date'>, today: string): TaskStatus {
  if (task.completed) return 'completed';
  if (!task.due_date) return 'no_date';
  const days = daysBetween(today, task.due_date);
  if (days < 0) return 'overdue';
  if (days === 0) return 'due_today';
  if (days <= DUE_SOON_DAYS) return 'due_soon';
  return 'upcoming';
}

export function isUrgentTask(status: TaskStatus): boolean {
  return status === 'overdue' || status === 'due_today' || status === 'due_soon';
}

const STATUS_RANK: Record<TaskStatus, number> = {
  overdue: 0,
  due_today: 1,
  due_soon: 2,
  upcoming: 3,
  no_date: 4,
  completed: 5,
};

export function sortTasksByUrgency<T extends TaskRow>(tasks: T[], today: string): T[] {
  return [...tasks].sort((a, b) => {
    const rankDiff = STATUS_RANK[getTaskStatus(a, today)] - STATUS_RANK[getTaskStatus(b, today)];
    if (rankDiff !== 0) return rankDiff;
    if (a.due_date && b.due_date && a.due_date !== b.due_date) return a.due_date < b.due_date ? -1 : 1;
    return a.created_at.localeCompare(b.created_at);
  });
}

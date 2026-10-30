import { supabase } from '../lib/supabase';
import { logActivity } from './activityService';
import type { TaskPriority, TaskWithEvent } from '../types/database';

export interface TaskInput {
  title: string;
  category: string;
  due_date: string | null;
  priority: TaskPriority;
}

export async function listTasks(eventId?: string): Promise<TaskWithEvent[]> {
  let query = supabase.from('tasks').select('*, events(name)');
  if (eventId) query = query.eq('event_id', eventId);
  const { data, error } = await query.order('due_date', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as TaskWithEvent[];
}

export async function createTask(eventId: string, input: TaskInput): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .insert({ ...input, event_id: eventId, source: 'custom' });
  if (error) throw error;
  await logActivity(eventId, `Added task "${input.title}"`, 'task_added');
}

export async function setTaskCompleted(eventId: string, taskId: string, title: string, completed: boolean): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ completed, completed_at: completed ? new Date().toISOString() : null })
    .eq('id', taskId);
  if (error) throw error;
  await logActivity(eventId, `${completed ? 'Completed' : 'Reopened'} task "${title}"`, completed ? 'task_completed' : 'task_reopened');
}

export async function deleteTask(eventId: string, taskId: string, title: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId);
  if (error) throw error;
  await logActivity(eventId, `Removed task "${title}"`, 'task_removed');
}

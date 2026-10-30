import { supabase } from '../lib/supabase';
import { logActivity } from './activityService';
import type { BudgetCategory, BudgetItemRow } from '../types/database';

export interface BudgetItemInput {
  category: BudgetCategory;
  description: string;
  estimated_cost: number;
  actual_cost: number | null;
}

export async function listBudgetItems(eventId: string): Promise<BudgetItemRow[]> {
  const { data, error } = await supabase
    .from('budget_items')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as BudgetItemRow[];
}

export async function createBudgetItem(eventId: string, input: BudgetItemInput): Promise<void> {
  const { error } = await supabase.from('budget_items').insert({ ...input, event_id: eventId });
  if (error) throw error;
  await logActivity(eventId, `Added budget line "${input.description}"`, 'budget_added');
}

export async function updateBudgetItem(eventId: string, itemId: string, input: BudgetItemInput): Promise<void> {
  const { error } = await supabase.from('budget_items').update(input).eq('id', itemId);
  if (error) throw error;
  await logActivity(eventId, `Updated budget line "${input.description}"`, 'budget_updated');
}

export async function deleteBudgetItem(eventId: string, itemId: string, description: string): Promise<void> {
  const { error } = await supabase.from('budget_items').delete().eq('id', itemId);
  if (error) throw error;
  await logActivity(eventId, `Removed budget line "${description}"`, 'budget_removed');
}

import { supabase } from '../lib/supabase';
import type { ActivityRow } from '../types/database';

export async function listRecentActivity(limit = 8): Promise<ActivityRow[]> {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as ActivityRow[];
}

export async function logActivity(eventId: string | null, message: string, kind: string): Promise<void> {
  const { error } = await supabase.from('activity_log').insert({ event_id: eventId, message, kind });
  if (error) throw error;
}

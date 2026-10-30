import { supabase } from '../lib/supabase';
import { logActivity } from './activityService';
import type { GuestRow, RsvpStatus } from '../types/database';

export interface GuestInput {
  name: string;
  email: string;
  phone: string;
  rsvp_status: RsvpStatus;
  plus_ones: number;
  notes: string;
}

export async function listGuests(eventId: string): Promise<GuestRow[]> {
  const { data, error } = await supabase
    .from('guests')
    .select('*')
    .eq('event_id', eventId)
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []) as GuestRow[];
}

export async function createGuest(eventId: string, input: GuestInput): Promise<void> {
  const { error } = await supabase.from('guests').insert({ ...input, event_id: eventId });
  if (error) throw error;
  await logActivity(eventId, `Added guest ${input.name}`, 'guest_added');
}

export async function updateGuest(eventId: string, guestId: string, input: GuestInput): Promise<void> {
  const { error } = await supabase.from('guests').update(input).eq('id', guestId);
  if (error) throw error;
  await logActivity(eventId, `Updated guest ${input.name}`, 'guest_updated');
}

export async function deleteGuest(eventId: string, guestId: string, name: string): Promise<void> {
  const { error } = await supabase.from('guests').delete().eq('id', guestId);
  if (error) throw error;
  await logActivity(eventId, `Removed guest ${name}`, 'guest_removed');
}

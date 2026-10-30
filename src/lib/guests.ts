import type { GuestRow } from '../types/database';

export interface GuestStats {
  invited: number;
  accepted: number;
  declined: number;
  pending: number;
  expectedHeadcount: number;
  responseRate: number;
}

export function summarizeGuests(guests: GuestRow[]): GuestStats {
  const accepted = guests.filter((guest) => guest.rsvp_status === 'accepted');
  const declined = guests.filter((guest) => guest.rsvp_status === 'declined').length;
  const pending = guests.filter((guest) => guest.rsvp_status === 'pending').length;
  const expectedHeadcount = accepted.reduce((sum, guest) => sum + 1 + guest.plus_ones, 0);
  const responded = guests.length - pending;
  return {
    invited: guests.length,
    accepted: accepted.length,
    declined,
    pending,
    expectedHeadcount,
    responseRate: guests.length > 0 ? responded / guests.length : 0,
  };
}

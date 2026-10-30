import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAsync } from '../hooks/useAsync';
import { listEvents } from '../services/eventsService';
import type { EventRow } from '../types/database';

const STORAGE_KEY = 'celebrio.selectedEventId';

interface SelectedEventContextValue {
  events: EventRow[];
  eventsLoading: boolean;
  eventsError: string | null;
  reloadEvents: () => void;
  selectedEvent: EventRow | null;
  selectEvent: (id: string) => void;
}

const SelectedEventContext = createContext<SelectedEventContextValue | null>(null);

function readStoredId(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function SelectedEventProvider({ children }: { children: ReactNode }) {
  const { data, error, loading, reload } = useAsync(listEvents, []);
  const events = useMemo(() => data ?? [], [data]);
  const [selectedId, setSelectedId] = useState<string | null>(readStoredId);

  useEffect(() => {
    if (events.length === 0) return;
    const stillExists = events.some((event) => event.id === selectedId);
    if (!stillExists) setSelectedId(events[0].id);
  }, [events, selectedId]);

  useEffect(() => {
    try {
      if (selectedId) window.localStorage.setItem(STORAGE_KEY, selectedId);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage can be unavailable in private browsing; selection then lasts for the session only.
    }
  }, [selectedId]);

  const selectEvent = useCallback((id: string) => setSelectedId(id), []);

  const value = useMemo<SelectedEventContextValue>(
    () => ({
      events,
      eventsLoading: loading,
      eventsError: error,
      reloadEvents: reload,
      selectedEvent: events.find((event) => event.id === selectedId) ?? null,
      selectEvent,
    }),
    [events, loading, error, reload, selectedId, selectEvent],
  );

  return <SelectedEventContext.Provider value={value}>{children}</SelectedEventContext.Provider>;
}

export function useSelectedEvent(): SelectedEventContextValue {
  const context = useContext(SelectedEventContext);
  if (!context) throw new Error('useSelectedEvent must be used inside SelectedEventProvider');
  return context;
}

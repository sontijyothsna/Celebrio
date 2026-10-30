import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { formatCurrency } from '../lib/format';

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'JPY'] as const;
export type Currency = (typeof CURRENCIES)[number];

interface Settings {
  profileName: string;
  currency: Currency;
}

const STORAGE_KEY = 'celebrio.settings';
const DEFAULT_SETTINGS: Settings = { profileName: 'Event Host', currency: 'USD' };

interface SettingsContextValue extends Settings {
  updateSettings: (patch: Partial<Settings>) => void;
  formatMoney: (amount: number) => string;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function readSettings(): Settings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    const currency = CURRENCIES.includes(parsed.currency as Currency) ? (parsed.currency as Currency) : DEFAULT_SETTINGS.currency;
    const profileName = typeof parsed.profileName === 'string' && parsed.profileName.trim()
      ? parsed.profileName.trim().slice(0, 60)
      : DEFAULT_SETTINGS.profileName;
    return { profileName, currency };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(readSettings);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Preferences fall back to defaults on the next visit when storage is unavailable.
    }
  }, [settings]);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((previous) => ({ ...previous, ...patch }));
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({
      ...settings,
      updateSettings,
      formatMoney: (amount: number) => formatCurrency(amount, settings.currency),
    }),
    [settings, updateSettings],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used inside SettingsProvider');
  return context;
}

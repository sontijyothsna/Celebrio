import { useState, type FormEvent } from 'react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { SelectField, TextField } from '../components/ui/FormFields';
import { PageHeader } from '../components/ui/PageParts';
import { CURRENCIES, useSettings, type Currency } from '../context/SettingsContext';

const CURRENCY_OPTIONS = CURRENCIES.map((code) => ({ value: code, label: code }));

export function Settings() {
  const { profileName, currency, updateSettings } = useSettings();
  const [name, setName] = useState(profileName);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currency);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setError('Enter a display name.');
      return;
    }
    if (trimmed.length > 60) {
      setError('Keep the display name under 60 characters.');
      return;
    }
    setError(null);
    updateSettings({ profileName: trimmed, currency: selectedCurrency });
    setSaved(true);
  };

  return (
    <>
      <PageHeader title="Settings" description="Personalise how Celebrio shows your name and money." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Profile and currency" description="Stored in this browser only." />
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <TextField
              label="Display name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setSaved(false);
              }}
              error={error ?? undefined}
              maxLength={60}
            />
            <SelectField
              label="Currency"
              options={CURRENCY_OPTIONS}
              value={selectedCurrency}
              onChange={(event) => {
                setSelectedCurrency(event.target.value as Currency);
                setSaved(false);
              }}
              hint="Used for all budget amounts. Your existing amounts are not converted."
            />
            <div className="flex items-center justify-end gap-3 pt-2">
              {saved && <span className="text-sm text-success-700" role="status">Saved</span>}
              <Button type="submit">Save settings</Button>
            </div>
          </form>
        </Card>

        <Card>
          <CardHeader title="About your numbers" />
          <div className="space-y-3 text-sm text-ink-700">
            <p>Budget shares, timings and checklists are planning guidelines. Venue availability and supplier prices are not checked by Celebrio.</p>
          </div>
        </Card>
      </div>
    </>
  );
}

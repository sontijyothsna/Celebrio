const DATE_FORMAT: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDateOnly(value: string): string {
  return parseDateOnly(value).toLocaleDateString(undefined, DATE_FORMAT);
}

export function todayDateOnly(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDaysDateOnly(value: string, days: number): string {
  const date = parseDateOnly(value);
  date.setDate(date.getDate() + days);
  return todayDateOnly(date);
}

export function daysBetween(fromDateOnly: string, toDateOnly: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const from = parseDateOnly(fromDateOnly).getTime();
  const to = parseDateOnly(toDateOnly).getTime();
  return Math.round((to - from) / msPerDay);
}

export function formatRelativeDays(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  if (days > 1) return `In ${days} days`;
  return `${Math.abs(days)} days ago`;
}

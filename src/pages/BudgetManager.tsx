import { AlertTriangle, CheckCircle2, Lightbulb, Pencil, Plus, Trash2, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EventPage } from '../components/events/EventPage';
import { BudgetItemDialog } from '../components/budget/BudgetItemDialog';
import { Badge, Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States';
import { ProgressBar, StatCard } from '../components/ui/PageParts';
import { useAsync } from '../hooks/useAsync';
import { useSettings } from '../context/SettingsContext';
import { getErrorMessage } from '../lib/errors';
import { getCostSavingSuggestions, summarizeBudget, type BudgetSummary } from '../lib/budget';
import { deleteBudgetItem, listBudgetItems } from '../services/budgetService';
import { BUDGET_CATEGORY_LABELS, type BudgetItemRow, type EventRow } from '../types/database';

export function BudgetManager() {
  return <EventPage title="Budget Manager" description="Track estimated and actual spending for the selected event.">{(event) => <BudgetContent event={event} />}</EventPage>;
}

function BudgetContent({ event }: { event: EventRow }) {
  const { formatMoney } = useSettings();
  const { data: items, error, loading, reload } = useAsync(() => listBudgetItems(event.id), [event.id]);
  const [editing, setEditing] = useState<BudgetItemRow | 'new' | null>(null);
  const [deleting, setDeleting] = useState<BudgetItemRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const summary = useMemo<BudgetSummary | null>(
    () => (items ? summarizeBudget(event.total_budget, items) : null),
    [items, event.total_budget],
  );

  if (loading && !items) return <LoadingState label="Loading budget..." />;
  if (error && !items) return <ErrorState message={error} onRetry={reload} />;
  if (!summary || !items) return null;

  const suggestions = getCostSavingSuggestions(summary, formatMoney);
  const committedPercent = summary.total > 0 ? (summary.committed / summary.total) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-500">Total budget: <span className="font-semibold text-ink-900">{formatMoney(event.total_budget)}</span></p>
        <Button icon={<Plus className="h-4 w-4" aria-hidden="true" />} onClick={() => setEditing('new')}>
          Add budget line
        </Button>
      </div>

      {summary.overBudget && (
        <div className="flex items-start gap-3 rounded-xl border border-danger-50 bg-danger-50 p-4 text-sm text-danger-700" role="alert">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Planned spending is {formatMoney(summary.committed - summary.total)} over your budget. Review the suggestions below.
          </span>
        </div>
      )}

      {error && <p className="text-sm text-danger-700" role="alert">{error}</p>}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total budget" value={formatMoney(summary.total)} icon={<Wallet className="h-5 w-5" aria-hidden="true" />} />
        <StatCard label="Estimated spend" value={formatMoney(summary.estimated)} icon={<Wallet className="h-5 w-5" aria-hidden="true" />} hint="Planned estimates" />
        <StatCard label="Actual spend" value={formatMoney(summary.actual)} icon={<Wallet className="h-5 w-5" aria-hidden="true" />} hint="Recorded actual costs" />
        <StatCard
          label={summary.overBudget ? 'Over budget' : 'Remaining'}
          value={formatMoney(Math.abs(summary.remaining))}
          icon={<Wallet className="h-5 w-5" aria-hidden="true" />}
          hint={summary.overBudget ? 'Committed spend exceeds budget' : 'Budget minus actual or estimated costs'}
        />
      </div>

      <Card>
        <CardHeader title="Spending by category" description={`${committedPercent.toFixed(0)}% of budget committed (actual where recorded, otherwise estimated).`} />
        <div className="space-y-4">
          {summary.categories.map((category) => (
            <div key={category.category}>
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium text-ink-900">{category.label}</span>
                <span className="text-ink-700">
                  {formatMoney(category.committed)}
                  <span className="text-ink-500"> of {formatMoney(category.estimated)} estimated</span>
                </span>
              </div>
              <ProgressBar
                value={category.committed}
                max={Math.max(summary.total, 1)}
                tone={summary.overBudget ? 'danger' : 'brand'}
              />
            </div>
          ))}
        </div>
      </Card>

      {suggestions.length > 0 && (
        <Card>
          <CardHeader title="Cost-saving alternatives" description="Suggestions based on your largest budget lines." />
          <ul className="space-y-3 text-sm text-ink-700">
            {suggestions.map((tip) => (
              <li key={tip} className="flex gap-3">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" aria-hidden="true" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card padded={false}>
        <div className="flex items-center justify-between px-6 pb-3 pt-6">
          <h2 className="text-base font-semibold text-ink-900">Budget lines</h2>
          {summary.overBudget ? <Badge tone="danger">Over budget</Badge> : <Badge tone="success"><CheckCircle2 className="mr-1 h-3 w-3" aria-hidden="true" />Within budget</Badge>}
        </div>
        {items.length === 0 ? (
          <div className="px-6 pb-6">
            <EmptyState
              icon={<Wallet className="h-6 w-6" aria-hidden="true" />}
              title="No budget lines yet"
              description="Add a line for each expense, such as the venue deposit or catering."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-y border-ink-200 bg-ink-100/60 text-xs uppercase tracking-wide text-ink-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 text-right font-medium">Estimated</th>
                  <th className="px-4 py-3 text-right font-medium">Actual</th>
                  <th className="px-6 py-3 text-right font-medium"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-ink-100/40">
                    <td className="px-6 py-3 font-medium text-ink-900">{item.description}</td>
                    <td className="px-4 py-3 text-ink-700">{BUDGET_CATEGORY_LABELS[item.category]}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-ink-700">{formatMoney(item.estimated_cost)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-ink-700">{item.actual_cost === null ? <span className="text-ink-400">Not yet</span> : formatMoney(item.actual_cost)}</td>
                    <td className="px-6 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditing(item)} aria-label={`Edit ${item.description}`}>
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-danger-600 hover:bg-danger-50" onClick={() => setDeleting(item)} aria-label={`Delete ${item.description}`}>
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <BudgetItemDialog
        eventId={event.id}
        item={editing === 'new' || editing === null ? null : editing}
        open={editing !== null}
        onClose={() => setEditing(null)}
        onSaved={async () => {
          setEditing(null);
          await reload();
        }}
      />

      <Modal
        open={deleting !== null}
        title="Remove this budget line?"
        description={deleting ? `"${deleting.description}" will be removed from the budget.` : undefined}
        onClose={() => setDeleting(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>Keep line</Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (!deleting) return;
                try {
                  await deleteBudgetItem(event.id, deleting.id, deleting.description);
                  setDeleting(null);
                  setDeleteError(null);
                  await reload();
                } catch (err) {
                  setDeleteError(getErrorMessage(err, 'The line could not be removed. Please try again.'));
                }
              }}
            >
              Remove line
            </Button>
          </>
        }
      >
        {deleteError ? <p className="text-sm text-danger-700" role="alert">{deleteError}</p> : <p className="text-sm text-ink-700">This cannot be undone.</p>}
      </Modal>
    </div>
  );
}

import { AlertTriangle, CheckCircle2, Info, Lightbulb } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { taskDueDate } from '../../lib/tasks';
import { formatDateOnly, todayDateOnly } from '../../lib/format';
import { BUDGET_CATEGORIES, BUDGET_CATEGORY_LABELS } from '../../types/database';
import type { EventPlan, FeasibilityStatus } from '../../types/plan';
import { Badge, Card, CardHeader } from '../ui/Card';
import { ProgressBar } from '../ui/PageParts';

interface PlanViewProps {
  plan: EventPlan;
  eventDate?: string;
}

const FEASIBILITY_META: Record<FeasibilityStatus, { label: string; tone: 'success' | 'warning' | 'danger'; icon: typeof CheckCircle2 }> = {
  comfortable: { label: 'Comfortable budget', tone: 'success', icon: CheckCircle2 },
  tight: { label: 'Tight budget', tone: 'warning', icon: Info },
  unrealistic: { label: 'Needs adjusting', tone: 'danger', icon: AlertTriangle },
};

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm text-ink-700">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function PlanView({ plan, eventDate }: PlanViewProps) {
  const { formatMoney } = useSettings();
  const feasibility = FEASIBILITY_META[plan.feasibility.status];
  const FeasibilityIcon = feasibility.icon;
  const allocationTotal = BUDGET_CATEGORIES.reduce((sum, category) => sum + plan.budgetAllocation[category], 0);
  const today = todayDateOnly();
  const sourceLabel = plan.source === 'ai' ? 'AI-generated plan' : 'Rule-based guidelines';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone={plan.source === 'ai' ? 'brand' : 'neutral'}>{sourceLabel}</Badge>
        <Badge tone={feasibility.tone}>
          <FeasibilityIcon className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
          {feasibility.label}
        </Badge>
      </div>

      <div className="rounded-xl border border-ink-200 bg-ink-100/60 p-4 text-sm text-ink-700">
        <p>{plan.feasibility.summary}</p>
        <p className="mt-2 text-xs text-ink-500">{plan.disclaimer}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Recommended theme" description={plan.theme.name} />
          <p className="text-sm text-ink-700">{plan.theme.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {plan.theme.palette.map((colour) => (
              <Badge key={colour}>{colour}</Badge>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Venue requirements" description={plan.venue.sizingNote} />
          <BulletList items={plan.venue.requirements} />
        </Card>

        <Card>
          <CardHeader title="Decoration suggestions" />
          <BulletList items={plan.decorations} />
        </Card>

        <Card>
          <CardHeader title="Food and catering" />
          <BulletList items={plan.food} />
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Entertainment" />
          <BulletList items={plan.entertainment} />
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Budget allocation"
          description="Target shares of your total budget. These are planning targets, not supplier prices."
        />
        <div className="space-y-4">
          {BUDGET_CATEGORIES.map((category) => {
            const amount = plan.budgetAllocation[category];
            const share = allocationTotal > 0 ? (amount / allocationTotal) * 100 : 0;
            return (
              <div key={category}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-ink-900">{BUDGET_CATEGORY_LABELS[category]}</span>
                  <span className="text-ink-700">
                    {formatMoney(amount)} <span className="text-ink-500">({Math.round(share)}%)</span>
                  </span>
                </div>
                <ProgressBar value={share} max={100} />
              </div>
            );
          })}
        </div>
        <div className="mt-6 space-y-2 border-t border-ink-200 pt-4">
          <p className="text-sm font-medium text-ink-900">Why this split</p>
          <BulletList items={plan.budgetExplanation} />
        </div>
      </Card>

      <Card>
        <CardHeader title="Cost-saving alternatives" />
        <BulletList items={plan.costSavingAlternatives} />
      </Card>

      <Card>
        <CardHeader title="Preparation checklist" description="Tasks ordered by how far ahead they should be finished." />
        <ul className="divide-y divide-ink-200">
          {[...plan.tasks]
            .sort((a, b) => b.daysBeforeEvent - a.daysBeforeEvent)
            .map((task) => (
              <li key={`${task.title}-${task.daysBeforeEvent}`} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="flex items-start gap-3">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-ink-900">{task.title}</p>
                    <p className="text-xs capitalize text-ink-500">{task.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'neutral'}>
                    {task.priority}
                  </Badge>
                  <span className="text-xs text-ink-500">
                    {eventDate
                      ? `Finish by ${formatDateOnly(taskDueDate(eventDate, task.daysBeforeEvent, today))}`
                      : `${task.daysBeforeEvent} days before`}
                  </span>
                </div>
              </li>
            ))}
        </ul>
      </Card>
    </div>
  );
}

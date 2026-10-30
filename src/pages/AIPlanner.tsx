import { CheckCircle2, Loader2, Sparkles, TriangleAlert } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { EventFormFields } from '../components/events/EventFormFields';
import { PlanView } from '../components/planner/PlanView';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageParts';
import { useSelectedEvent } from '../context/SelectedEventContext';
import { getErrorMessage } from '../lib/errors';
import { todayDateOnly } from '../lib/format';
import {
  createEmptyFormValues,
  toPlanInput,
  validatePlanInput,
  type EventFormValues,
  type PlanInputErrors,
} from '../lib/planner/planInput';
import { generateEventPlan } from '../services/aiPlanService';
import { createEventWithPlan } from '../services/eventsService';
import { EVENT_TYPE_LABELS } from '../types/database';
import type { EventPlan, PlanInput } from '../types/plan';

interface Generation {
  input: PlanInput;
  plan: EventPlan;
  fallbackReason: string | null;
}

export function AIPlanner() {
  const [values, setValues] = useState<EventFormValues>(() => createEmptyFormValues(todayDateOnly()));
  const [errors, setErrors] = useState<PlanInputErrors>({});
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generation, setGeneration] = useState<Generation | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedEventId, setSavedEventId] = useState<string | null>(null);
  const { selectEvent, reloadEvents } = useSelectedEvent();

  const updateValues = (patch: Partial<EventFormValues>) => {
    setValues((previous) => ({ ...previous, ...patch }));
    setErrors({});
  };

  const resetResults = () => {
    setGeneration(null);
    setGenerateError(null);
    setSaveError(null);
    setSavedEventId(null);
  };

  const handleGenerate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = toPlanInput(values);
    const validation = validatePlanInput(input, todayDateOnly());
    setErrors(validation);
    resetResults();
    if (Object.keys(validation).length > 0) return;

    setGenerating(true);
    try {
      const result = await generateEventPlan(input);
      setGeneration({ input, ...result });
    } catch (err) {
      setGenerateError(getErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generation) return;
    setSaving(true);
    setSaveError(null);
    try {
      const id = await createEventWithPlan(generation.input, generation.plan, todayDateOnly());
      setSavedEventId(id);
      selectEvent(id);
      await reloadEvents();
    } catch (err) {
      setSaveError(getErrorMessage(err, 'The event could not be saved. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setValues(createEmptyFormValues(todayDateOnly()));
    setErrors({});
    resetResults();
  };

  return (
    <>
      <PageHeader
        title="AI Event Planner"
        description="Tell us about your celebration. We will suggest a theme, venue needs, budget split and a preparation checklist."
      />

      <div className="space-y-6">
        <Card>
          <CardHeader
            title="Event details"
            description="Costs are planning targets. Venue availability and supplier prices are not checked automatically."
          />
          <form onSubmit={handleGenerate} noValidate>
            <EventFormFields values={values} errors={errors} onChange={updateValues} today={todayDateOnly()} />
            <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-ink-200 pt-5">
              <Button type="button" variant="ghost" onClick={handleReset} disabled={generating}>
                Clear form
              </Button>
              <Button type="submit" loading={generating} icon={<Sparkles className="h-4 w-4" aria-hidden="true" />}>
                {generating ? 'Building your plan...' : 'Generate plan'}
              </Button>
            </div>
          </form>
        </Card>

        {generating && (
          <Card>
            <div className="flex items-center gap-3 text-sm text-ink-700" role="status">
              <Loader2 className="h-5 w-5 animate-spin text-brand-600" aria-hidden="true" />
              Working out a theme, budget split and checklist for your event...
            </div>
          </Card>
        )}

        {generateError && (
          <div className="flex items-start gap-3 rounded-xl border border-danger-50 bg-danger-50 p-4 text-sm text-danger-700" role="alert">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {generateError}
          </div>
        )}

        {generation && (
          <section aria-labelledby="plan-heading" className="space-y-6">
            {generation.fallbackReason && (
              <div className="flex items-start gap-3 rounded-xl border border-warning-50 bg-warning-50 p-4 text-sm text-warning-700" role="status">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{generation.fallbackReason}</span>
              </div>
            )}
            <div className="flex flex-col gap-4 rounded-xl border border-ink-200 bg-white p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 id="plan-heading" className="text-lg font-semibold text-ink-900">
                  Plan for {generation.input.eventName}
                </h2>
                <p className="text-sm text-ink-500">
                  {EVENT_TYPE_LABELS[generation.input.eventType]} for {generation.input.guestCount} guests
                </p>
              </div>
              {savedEventId ? (
                <div className="flex flex-col gap-3 sm:items-end">
                  <p className="flex items-center gap-2 text-sm font-medium text-success-700">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    Saved to My Events
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Link to="/tasks">
                      <Button variant="secondary" size="sm">View tasks</Button>
                    </Link>
                    <Link to="/budget">
                      <Button variant="secondary" size="sm">Open budget</Button>
                    </Link>
                    <Link to="/events">
                      <Button variant="secondary" size="sm">My Events</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2 sm:items-end">
                  <Button onClick={handleSave} loading={saving}>
                    Save event and plan
                  </Button>
                  {saveError && <p className="text-xs text-danger-700" role="alert">{saveError}</p>}
                </div>
              )}
            </div>
            <PlanView plan={generation.plan} eventDate={generation.input.eventDate} />
            {savedEventId && (
              <div className="flex justify-end">
                <Button variant="ghost" onClick={handleReset}>Plan another event</Button>
              </div>
            )}
          </section>
        )}
      </div>
    </>
  );
}

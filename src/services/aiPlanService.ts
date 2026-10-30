import { supabase } from '../lib/supabase';
import { getErrorMessage } from '../lib/errors';
import { parseAiPlan } from '../lib/planner/planSchema';
import { generateRulePlan } from '../lib/planner/ruleEngine';
import type { EventPlan, PlanInput } from '../types/plan';

export interface GeneratedPlan {
  plan: EventPlan;
  fallbackReason: string | null;
}

const FALLBACK_REASON = 'The AI planner is unavailable right now, so this plan was built with rule-based guidelines instead.';

export async function generateEventPlan(input: PlanInput): Promise<GeneratedPlan> {
  try {
    const { data, error } = await supabase.functions.invoke<{ plan?: unknown; error?: string }>('event-plan', {
      body: input,
    });
    if (error) throw error;
    const plan = parseAiPlan(data?.plan, input.totalBudget);
    if (!plan) throw new Error('The AI response was incomplete.');
    return { plan, fallbackReason: null };
  } catch (err) {
    console.warn('AI plan unavailable:', getErrorMessage(err));
    return { plan: generateRulePlan(input), fallbackReason: FALLBACK_REASON };
  }
}

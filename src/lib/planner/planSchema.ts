import { BUDGET_CATEGORIES, TASK_PRIORITIES, type BudgetCategory, type TaskPriority } from '../../types/database';
import type { EventPlan, FeasibilityStatus, PlanTask } from '../../types/plan';

const MAX_LIST_ITEMS = 20;
const MAX_TEXT = 1000;
const FEASIBILITY_STATUSES: FeasibilityStatus[] = ['comfortable', 'tight', 'unrealistic'];

type Unknown = Record<string, unknown>;

function isRecord(value: unknown): value is Unknown {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readText(value: unknown, maxLength = MAX_TEXT): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  return trimmed.slice(0, maxLength);
}

function readTextList(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const items = value
    .map((item) => readText(item))
    .filter((item): item is string => item !== null)
    .slice(0, MAX_LIST_ITEMS);
  return items;
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}

function readEnum<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

function readTask(value: unknown): PlanTask | null {
  if (!isRecord(value)) return null;
  const title = readText(value.title, 200);
  const category = readText(value.category, 60) ?? 'general';
  const daysBeforeEvent = readNumber(value.daysBeforeEvent);
  const priority = readEnum<TaskPriority>(value.priority, TASK_PRIORITIES) ?? 'medium';
  if (!title || daysBeforeEvent === null) return null;
  return { title, category, daysBeforeEvent: Math.round(daysBeforeEvent), priority };
}

function readAllocation(value: unknown, totalBudget: number): Record<BudgetCategory, number> | null {
  if (!isRecord(value)) return null;
  const raw = {} as Record<BudgetCategory, number>;
  for (const category of BUDGET_CATEGORIES) {
    const amount = readNumber(value[category]);
    if (amount === null) return null;
    raw[category] = amount;
  }
  const sum = BUDGET_CATEGORIES.reduce((total, category) => total + raw[category], 0);
  if (sum <= 0) return null;
  const scale = totalBudget / sum;
  const result = {} as Record<BudgetCategory, number>;
  let allocated = 0;
  for (const category of BUDGET_CATEGORIES.slice(0, -1)) {
    result[category] = Math.round(raw[category] * scale * 100) / 100;
    allocated += result[category];
  }
  result.miscellaneous = Math.round((totalBudget - allocated) * 100) / 100;
  return result;
}

/**
 * Validates an untrusted plan returned by the AI service. Returns null when the shape is wrong,
 * so the caller can fall back to the rule-based plan instead of rendering partial data.
 */
export function parseAiPlan(value: unknown, totalBudget: number): EventPlan | null {
  if (!isRecord(value)) return null;

  const theme = isRecord(value.theme) ? value.theme : null;
  const feasibility = isRecord(value.feasibility) ? value.feasibility : null;
  const venue = isRecord(value.venue) ? value.venue : null;
  if (!theme || !feasibility || !venue) return null;

  const themeName = readText(theme.name, 120);
  const themeDescription = readText(theme.description);
  const palette = readTextList(theme.palette);
  const status = readEnum<FeasibilityStatus>(feasibility.status, FEASIBILITY_STATUSES);
  const feasibilitySummary = readText(feasibility.summary);
  const venueRequirements = readTextList(venue.requirements);
  const sizingNote = readText(venue.sizingNote);
  const decorations = readTextList(value.decorations);
  const food = readTextList(value.food);
  const entertainment = readTextList(value.entertainment);
  const budgetAllocation = readAllocation(value.budgetAllocation, totalBudget);
  const budgetExplanation = readTextList(value.budgetExplanation);
  const costSavingAlternatives = readTextList(value.costSavingAlternatives);
  const tasks = Array.isArray(value.tasks)
    ? value.tasks.map(readTask).filter((task): task is PlanTask => task !== null).slice(0, 60)
    : null;

  if (
    !themeName || !themeDescription || !palette || !status || !feasibilitySummary ||
    !venueRequirements || !sizingNote || !decorations || !food || !entertainment ||
    !budgetAllocation || !budgetExplanation || !costSavingAlternatives || !tasks || tasks.length === 0
  ) {
    return null;
  }

  return {
    source: 'ai',
    generatedAt: new Date().toISOString(),
    theme: { name: themeName, description: themeDescription, palette },
    feasibility: { status, summary: feasibilitySummary },
    venue: { requirements: venueRequirements, sizingNote },
    decorations,
    food,
    entertainment,
    budgetAllocation,
    budgetExplanation,
    costSavingAlternatives,
    tasks,
    disclaimer: readText(value.disclaimer) ?? 'AI-generated plan. Venue availability and supplier prices are not verified and must be confirmed with providers.',
  };
}

import type { BudgetCategory, BudgetItemRow } from '../types/database';
import { BUDGET_CATEGORIES, BUDGET_CATEGORY_LABELS } from '../types/database';

export interface CategorySummary {
  category: BudgetCategory;
  label: string;
  estimated: number;
  actual: number;
  committed: number;
  share: number;
}

export interface BudgetSummary {
  total: number;
  estimated: number;
  actual: number;
  committed: number;
  remaining: number;
  overBudget: boolean;
  categories: CategorySummary[];
}

export function summarizeBudget(total: number, items: BudgetItemRow[]): BudgetSummary {
  const categories: CategorySummary[] = BUDGET_CATEGORIES.map((category) => {
    const rows = items.filter((item) => item.category === category);
    const estimated = rows.reduce((sum, item) => sum + item.estimated_cost, 0);
    const actual = rows.reduce((sum, item) => sum + (item.actual_cost ?? 0), 0);
    const committed = rows.reduce((sum, item) => sum + (item.actual_cost ?? item.estimated_cost), 0);
    return {
      category,
      label: BUDGET_CATEGORY_LABELS[category],
      estimated,
      actual,
      committed,
      share: 0,
    };
  });

  const estimated = categories.reduce((sum, item) => sum + item.estimated, 0);
  const actual = categories.reduce((sum, item) => sum + item.actual, 0);
  const committed = categories.reduce((sum, item) => sum + item.committed, 0);
  for (const category of categories) {
    category.share = committed > 0 ? category.committed / committed : 0;
  }

  return {
    total,
    estimated,
    actual,
    committed,
    remaining: total - committed,
    overBudget: committed > total,
    categories,
  };
}

const SAVING_TIPS: Record<BudgetCategory, string> = {
  venue: 'Consider a home, community hall or a venue offering off-peak dates. Venue cost is often the largest driver.',
  food: 'Choose a buffet or family-style service instead of plated meals, and limit the number of courses.',
  decoration: 'Reuse or borrow existing decor, or focus decoration on a single focal point.',
  entertainment: 'Use a curated playlist or a friend hosting games instead of a paid performer.',
  miscellaneous: 'Send digital invitations instead of printed ones, and avoid one-off extras.',
};

export function getCostSavingSuggestions(summary: BudgetSummary, formatAmount: (amount: number) => string): string[] {
  if (!summary.overBudget || summary.committed === 0) return [];
  const overBy = summary.committed - summary.total;
  const largest = [...summary.categories]
    .filter((category) => category.committed > 0)
    .sort((a, b) => b.committed - a.committed)
    .slice(0, 3);
  const tips = largest.map((category) => `${category.label}: ${SAVING_TIPS[category.category]}`);
  return [
    `Planned spending is over the budget by ${formatAmount(overBy)}. Reducing the lines below will close the gap.`,
    ...tips,
  ];
}

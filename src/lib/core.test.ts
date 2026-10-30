import { describe, expect, it } from 'vitest';
import { summarizeBudget, getCostSavingSuggestions } from './budget';
import { summarizeGuests } from './guests';
import { parseAiPlan } from './planner/planSchema';
import { allocateBudget, generateRulePlan } from './planner/ruleEngine';
import { toPlanInput, validatePlanInput, type EventFormValues } from './planner/planInput';
import { getTaskStatus, sortTasksByUrgency } from './tasks';
import type { BudgetItemRow, GuestRow, TaskRow } from '../types/database';
import type { PlanInput } from '../types/plan';

const TODAY = '2026-10-30';

function basePlanInput(overrides: Partial<PlanInput> = {}): PlanInput {
  return {
    eventName: 'Launch party',
    eventType: 'corporate',
    eventDate: '2027-03-01',
    location: 'Downtown',
    guestCount: 60,
    totalBudget: 9000,
    theme: '',
    preferences: '',
    ...overrides,
  };
}

describe('validatePlanInput', () => {
  it('accepts a complete, future-dated event', () => {
    expect(validatePlanInput(basePlanInput(), TODAY)).toEqual({});
  });

  it('rejects past dates, missing names and non-positive guest counts', () => {
    const errors = validatePlanInput(basePlanInput({ eventName: '  ', eventDate: '2020-01-01', guestCount: 0 }), TODAY);
    expect(errors.eventName).toBeDefined();
    expect(errors.eventDate).toBeDefined();
    expect(errors.guestCount).toBeDefined();
  });

  it('rejects negative budgets and non-integer guest counts', () => {
    const errors = validatePlanInput(basePlanInput({ totalBudget: -1, guestCount: 2.5 }), TODAY);
    expect(errors.totalBudget).toBeDefined();
    expect(errors.guestCount).toBeDefined();
  });

  it('converts blank numeric form fields to NaN so they fail validation', () => {
    const values: EventFormValues = {
      eventName: 'x',
      eventType: 'birthday',
      eventDate: '2027-01-01',
      location: '',
      guestCount: '',
      totalBudget: '',
      theme: '',
      preferences: '',
    };
    const errors = validatePlanInput(toPlanInput(values), TODAY);
    expect(errors.guestCount).toBeDefined();
    expect(errors.totalBudget).toBeDefined();
  });
});

describe('allocateBudget', () => {
  it('always sums exactly to the total budget', () => {
    for (const total of [0, 1, 999, 1234.56, 50000]) {
      const allocation = allocateBudget(total, { venue: 33, food: 33, decoration: 11, entertainment: 11, miscellaneous: 12 });
      const sum = Object.values(allocation).reduce((a, b) => a + b, 0);
      expect(Math.round(sum * 100) / 100).toBe(total);
    }
  });
});

describe('generateRulePlan', () => {
  it('flags an unrealistically small budget and offers alternatives', () => {
    const plan = generateRulePlan(basePlanInput({ eventType: 'wedding', guestCount: 200, totalBudget: 2000 }));
    expect(plan.source).toBe('rule_based');
    expect(plan.feasibility.status).toBe('unrealistic');
    expect(plan.costSavingAlternatives[0]).toMatch(/guest count/i);
  });

  it('keeps the allocation equal to the budget and produces dated-ready tasks', () => {
    const plan = generateRulePlan(basePlanInput({ totalBudget: 15000 }));
    const sum = Object.values(plan.budgetAllocation).reduce((a, b) => a + b, 0);
    expect(Math.round(sum)).toBe(15000);
    expect(plan.tasks.length).toBeGreaterThan(5);
    expect(plan.tasks.every((task) => task.daysBeforeEvent >= 1)).toBe(true);
  });
});

describe('parseAiPlan', () => {
  it('rejects responses with a missing section instead of rendering partial data', () => {
    expect(parseAiPlan({ theme: { name: 'x' } }, 1000)).toBeNull();
    expect(parseAiPlan('not json object', 1000)).toBeNull();
  });

  it('accepts a complete response and rescales the budget to the user total', () => {
    const plan = parseAiPlan(
      {
        theme: { name: 'Garden', description: 'Soft florals', palette: ['Ivory'] },
        feasibility: { status: 'tight', summary: 'Workable.' },
        venue: { requirements: ['Seats 60'], sizingNote: 'Room for 60.' },
        decorations: ['Centrepieces'],
        food: ['Buffet'],
        entertainment: ['Playlist'],
        budgetAllocation: { venue: 40, food: 30, decoration: 10, entertainment: 10, miscellaneous: 10 },
        budgetExplanation: ['Venue is largest.'],
        costSavingAlternatives: ['Host at home.'],
        tasks: [{ title: 'Book venue', category: 'venue', daysBeforeEvent: 60, priority: 'high' }],
        disclaimer: 'Check prices.',
      },
      5000,
    );
    expect(plan).not.toBeNull();
    expect(plan?.source).toBe('ai');
    const total = plan ? Object.values(plan.budgetAllocation).reduce((a, b) => a + b, 0) : 0;
    expect(Math.round(total * 100) / 100).toBe(5000);
  });
});

function item(overrides: Partial<BudgetItemRow>): BudgetItemRow {
  return {
    id: 'i',
    event_id: 'e',
    category: 'venue',
    description: 'Deposit',
    estimated_cost: 0,
    actual_cost: null,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('summarizeBudget', () => {
  it('uses actual cost once recorded and flags overspend', () => {
    const summary = summarizeBudget(1000, [
      item({ estimated_cost: 400 }),
      item({ category: 'food', estimated_cost: 300, actual_cost: 700 }),
    ]);
    expect(summary.committed).toBe(1100);
    expect(summary.overBudget).toBe(true);
    expect(summary.remaining).toBe(-100);
    expect(getCostSavingSuggestions(summary, (amount) => `$${amount}`)[0]).toContain('$100');
  });

  it('reports remaining budget when within limit and suggests nothing', () => {
    const summary = summarizeBudget(1000, [item({ estimated_cost: 250 })]);
    expect(summary.remaining).toBe(750);
    expect(getCostSavingSuggestions(summary, String)).toEqual([]);
  });
});

function task(overrides: Partial<TaskRow>): TaskRow {
  return {
    id: 't',
    event_id: 'e',
    title: 'Task',
    category: 'general',
    due_date: null,
    priority: 'medium',
    completed: false,
    completed_at: null,
    source: 'generated',
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('task urgency', () => {
  it('classifies overdue, due-today, due-soon and upcoming tasks', () => {
    expect(getTaskStatus(task({ due_date: '2026-10-29' }), TODAY)).toBe('overdue');
    expect(getTaskStatus(task({ due_date: TODAY }), TODAY)).toBe('due_today');
    expect(getTaskStatus(task({ due_date: '2026-11-01' }), TODAY)).toBe('due_soon');
    expect(getTaskStatus(task({ due_date: '2026-12-01' }), TODAY)).toBe('upcoming');
    expect(getTaskStatus(task({ completed: true, due_date: '2026-10-01' }), TODAY)).toBe('completed');
  });

  it('puts overdue tasks first and completed tasks last', () => {
    const sorted = sortTasksByUrgency(
      [
        task({ id: 'done', completed: true, due_date: '2026-10-01' }),
        task({ id: 'later', due_date: '2026-12-01' }),
        task({ id: 'late', due_date: '2026-10-20' }),
      ],
      TODAY,
    );
    expect(sorted.map((t) => t.id)).toEqual(['late', 'later', 'done']);
  });
});

describe('summarizeGuests', () => {
  it('counts RSVPs and expected headcount including plus-ones', () => {
    const guests: GuestRow[] = [
      { id: '1', event_id: 'e', name: 'A', email: '', phone: '', rsvp_status: 'accepted', plus_ones: 2, notes: '', created_at: '' },
      { id: '2', event_id: 'e', name: 'B', email: '', phone: '', rsvp_status: 'declined', plus_ones: 0, notes: '', created_at: '' },
      { id: '3', event_id: 'e', name: 'C', email: '', phone: '', rsvp_status: 'pending', plus_ones: 0, notes: '', created_at: '' },
    ];
    const stats = summarizeGuests(guests);
    expect(stats).toMatchObject({ invited: 3, accepted: 1, declined: 1, pending: 1, expectedHeadcount: 3 });
    expect(stats.responseRate).toBeCloseTo(2 / 3);
  });
});

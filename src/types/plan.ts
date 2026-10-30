import type { BudgetCategory, EventType, TaskPriority } from './database';

export type FeasibilityStatus = 'comfortable' | 'tight' | 'unrealistic';

export interface PlanTask {
  title: string;
  category: string;
  daysBeforeEvent: number;
  priority: TaskPriority;
}

export interface EventPlan {
  source: 'ai' | 'rule_based';
  generatedAt: string;
  theme: { name: string; description: string; palette: string[] };
  feasibility: { status: FeasibilityStatus; summary: string };
  venue: { requirements: string[]; sizingNote: string };
  decorations: string[];
  food: string[];
  entertainment: string[];
  budgetAllocation: Record<BudgetCategory, number>;
  budgetExplanation: string[];
  costSavingAlternatives: string[];
  tasks: PlanTask[];
  disclaimer: string;
}

export interface PlanInput {
  eventName: string;
  eventType: EventType;
  eventDate: string;
  location: string;
  guestCount: number;
  totalBudget: number;
  theme: string;
  preferences: string;
}

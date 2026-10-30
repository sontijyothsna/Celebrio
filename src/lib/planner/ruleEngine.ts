import {
  BUDGET_CATEGORIES,
  BUDGET_CATEGORY_LABELS,
  EVENT_TYPE_LABELS,
  type BudgetCategory,
  type EventType,
} from '../../types/database';
import type { EventPlan, FeasibilityStatus, PlanInput, PlanTask } from '../../types/plan';

type Split = Record<BudgetCategory, number>;

const BASE_SPLIT: Record<EventType, Split> = {
  birthday: { venue: 25, food: 35, decoration: 15, entertainment: 15, miscellaneous: 10 },
  wedding: { venue: 40, food: 30, decoration: 12, entertainment: 10, miscellaneous: 8 },
  anniversary: { venue: 35, food: 35, decoration: 12, entertainment: 8, miscellaneous: 10 },
  graduation: { venue: 25, food: 35, decoration: 10, entertainment: 15, miscellaneous: 15 },
  baby_shower: { venue: 20, food: 40, decoration: 20, entertainment: 10, miscellaneous: 10 },
  corporate: { venue: 40, food: 35, decoration: 5, entertainment: 10, miscellaneous: 10 },
  other: { venue: 30, food: 30, decoration: 15, entertainment: 15, miscellaneous: 10 },
};

const MIN_COMFORTABLE_PER_GUEST: Record<EventType, number> = {
  birthday: 25,
  wedding: 120,
  anniversary: 60,
  graduation: 30,
  baby_shower: 30,
  corporate: 80,
  other: 30,
};

const THEMES: Record<EventType, { name: string; description: string; palette: string[] }> = {
  birthday: {
    name: 'Bright & Playful',
    description: 'Cheerful colours, a statement cake table and a photo corner guests can enjoy.',
    palette: ['Warm coral', 'Sunshine yellow', 'Soft white', 'Sage green'],
  },
  wedding: {
    name: 'Timeless Garden',
    description: 'Soft florals, candlelight and classic linens that feel elegant without being formal.',
    palette: ['Ivory', 'Blush', 'Sage', 'Champagne gold'],
  },
  anniversary: {
    name: 'Warm Keepsake',
    description: 'Intimate lighting, a memory display of your years together and a refined table setting.',
    palette: ['Deep burgundy', 'Cream', 'Brass', 'Dusty rose'],
  },
  graduation: {
    name: 'Achievement Showcase',
    description: 'A milestone wall, school colours and a clear path for guests to celebrate the graduate.',
    palette: ['Navy', 'Gold', 'White', 'Slate'],
  },
  baby_shower: {
    name: 'Gentle Nursery',
    description: 'Soft pastels, a welcoming activity table and easy-to-clean, relaxed decor.',
    palette: ['Pale mint', 'Cloud white', 'Butter yellow', 'Warm oak'],
  },
  corporate: {
    name: 'Clean Modern Professional',
    description: 'Neutral palette, branded touches and a clear programme flow for attendees.',
    palette: ['Charcoal', 'Brand accent', 'Off-white', 'Steel blue'],
  },
  other: {
    name: 'Relaxed Celebration',
    description: 'A flexible, welcoming look built around your preferred colours and atmosphere.',
    palette: ['Terracotta', 'Cream', 'Olive', 'Stone'],
  },
};

const VENUE_REQUIREMENTS: Record<EventType, string[]> = {
  birthday: ['Space for the guest count with room to move', 'Kitchen or catering access', 'Restrooms and seating for all guests'],
  wedding: ['Capacity for seated dinner and dance floor', 'Indoor backup space for weather', 'Catering kitchen or preferred caterer access', 'Accessible parking and restrooms'],
  anniversary: ['Intimate room with good lighting', 'Table seating for every guest', 'Quiet area for speeches or a slideshow'],
  graduation: ['Space for a buffet and a short speech', 'Power outlets for music and slideshows', 'Outdoor or indoor option depending on season'],
  baby_shower: ['Comfortable seating and a games area', 'Kitchen or buffet table space', 'Easy access for older guests'],
  corporate: ['Presentation screen or projector', 'Breakout space for networking', 'Reliable Wi-Fi and step-free access', 'Catering and AV support on site'],
  other: ['Capacity for your guest count', 'Seating and restrooms for all guests', 'Power and space for entertainment'],
};

const DECORATIONS: Record<EventType, string[]> = {
  birthday: ['A focal backdrop with balloons or banners', 'Table centrepieces in the theme colours', 'Photo corner with props'],
  wedding: ['Floral arch or ceremony backdrop', 'Table centrepieces with candles', 'Table numbers and a welcome sign'],
  anniversary: ['Framed photo timeline', 'Low candles and warm fairy lights', 'Simple floral table arrangements'],
  graduation: ['Graduation banner and balloon arch', 'Display wall for school memories', 'Team colour table runners'],
  baby_shower: ['Pastel balloon garland', 'Welcome sign and themed table cloths', 'Nursery-style dessert table styling'],
  corporate: ['Branded signage and entrance display', 'Simple table centrepieces', 'Stage backdrop with logo'],
  other: ['A themed focal point near the entrance', 'Simple table centrepieces', 'Lighting to set the mood'],
};

const FOOD: Record<EventType, string[]> = {
  birthday: ['Cake or dessert table', 'Buffet-style finger food', 'Drinks station with soft and sparkling options'],
  wedding: ['Plated or family-style dinner', 'Late-night snack station', 'Welcome drinks and a cake'],
  anniversary: ['Three-course dinner or grazing table', 'Champagne or mocktail toast', 'Celebration dessert'],
  graduation: ['Buffet with mix of hot and cold dishes', 'Build-your-own drinks station', 'Sheet cake or cupcakes'],
  baby_shower: ['Brunch-style buffet', 'Dessert bar with pastel treats', 'Mocktail and tea station'],
  corporate: ['Coffee and pastry breakfast or lunch buffet', 'Afternoon refreshments', 'Drinks service per your policy'],
  other: ['Buffet or grazing table', 'Dessert selection', 'Drinks with non-alcoholic options'],
};

const ENTERTAINMENT: Record<EventType, string[]> = {
  birthday: ['Playlist or DJ for the party', 'Games or a short activity for guests', 'Photo booth or instant camera'],
  wedding: ['Live band or DJ for the reception', 'Ceremony musicians', 'Lawn games or a dance floor activity'],
  anniversary: ['Acoustic musician or curated playlist', 'Slideshow of memories', 'Toast or short speech'],
  graduation: ['DJ or upbeat playlist', 'Slideshow of school memories', 'Lawn games for guests'],
  baby_shower: ['Simple guessing or word games', 'Gift opening moment', 'Soft background music'],
  corporate: ['Keynote speaker or host', 'Networking activity', 'Background music during breaks'],
  other: ['Background music or playlist', 'A short activity or toast', 'Photo moment with guests'],
};

type NoteSection = 'venue' | 'food' | 'entertainment';

const PREFERENCE_NOTES: Array<{ keywords: RegExp; note: string; section: NoteSection }> = [
  { keywords: /vegan|vegetarian|halal|kosher|gluten/i, note: 'Dietary requirements noted: include a clearly labelled vegetarian, vegan or allergy-friendly option.', section: 'food' },
  { keywords: /outdoor|garden|beach|park|backyard/i, note: 'Outdoor setting noted: plan a weather backup and shade or heating.', section: 'venue' },
  { keywords: /kids?|children|family/i, note: 'Children attending noted: include kid-friendly activities and a quiet area.', section: 'entertainment' },
  { keywords: /dj|band|music|dance/i, note: 'Music or dancing noted: confirm sound equipment and power needs with the venue.', section: 'entertainment' },
  { keywords: /cake|dessert/i, note: 'Dessert preference noted: order early, as custom cakes often need lead time.', section: 'food' },
];

export function allocateBudget(total: number, split: Split): Record<BudgetCategory, number> {
  const result = {} as Record<BudgetCategory, number>;
  let allocated = 0;
  for (const category of BUDGET_CATEGORIES.slice(0, -1)) {
    const amount = Math.floor((total * split[category]) / 100);
    result[category] = amount;
    allocated += amount;
  }
  result.miscellaneous = Math.round((total - allocated) * 100) / 100;
  return result;
}

function getFeasibility(input: PlanInput, perGuest: number): { status: FeasibilityStatus; summary: string } {
  const label = EVENT_TYPE_LABELS[input.eventType].toLowerCase();
  const minimum = MIN_COMFORTABLE_PER_GUEST[input.eventType];
  const perGuestText = `About ${perGuest.toFixed(0)} per guest`;
  if (perGuest >= minimum * 2) {
    return {
      status: 'comfortable',
      summary: `${perGuestText} gives a comfortable margin for a ${label}. This is a planning rule of thumb, not a quote from any supplier.`,
    };
  }
  if (perGuest >= minimum) {
    return {
      status: 'tight',
      summary: `${perGuestText} is workable for a ${label} but leaves little room for surprises. Prioritise the venue and food and keep extras minimal.`,
    };
  }
  const maxGuests = Math.max(1, Math.floor(input.totalBudget / minimum));
  return {
    status: 'unrealistic',
    summary: `${perGuestText} is below the rule-of-thumb minimum of about ${minimum} per guest for a ${label}. Consider about ${maxGuests} guests, a smaller budget target per guest, or a later date with more time to compare options.`,
  };
}

function buildTasks(eventType: EventType, guestCount: number): PlanTask[] {
  const tasks: PlanTask[] = [
    { title: 'Confirm the event date with key people', category: 'planning', daysBeforeEvent: 120, priority: 'high' },
    { title: 'Shortlist and visit venues', category: 'venue', daysBeforeEvent: 100, priority: 'high' },
    { title: 'Book the venue', category: 'venue', daysBeforeEvent: 90, priority: 'high' },
    { title: 'Finalise the guest list', category: 'guests', daysBeforeEvent: 60, priority: 'medium' },
    { title: 'Send invitations', category: 'guests', daysBeforeEvent: 45, priority: 'high' },
    { title: 'Book entertainment', category: 'entertainment', daysBeforeEvent: 45, priority: 'medium' },
    { title: 'Confirm catering menu and order', category: 'food', daysBeforeEvent: 30, priority: 'high' },
    { title: 'Order decorations and supplies', category: 'decoration', daysBeforeEvent: 21, priority: 'medium' },
    { title: 'Chase outstanding RSVPs', category: 'guests', daysBeforeEvent: 14, priority: 'high' },
    { title: 'Confirm final headcount with the venue and caterer', category: 'food', daysBeforeEvent: 7, priority: 'high' },
    { title: 'Prepare a day-of timeline and contact list', category: 'planning', daysBeforeEvent: 3, priority: 'medium' },
    { title: 'Confirm final payments and tips', category: 'miscellaneous', daysBeforeEvent: 1, priority: 'medium' },
  ];

  const typeSpecific: Partial<Record<EventType, PlanTask[]>> = {
    wedding: [
      { title: 'Book officiant and ceremony musicians', category: 'entertainment', daysBeforeEvent: 150, priority: 'high' },
      { title: 'Arrange a tasting and choose the wedding cake', category: 'food', daysBeforeEvent: 75, priority: 'medium' },
      { title: 'Book photographer and videographer', category: 'miscellaneous', daysBeforeEvent: 150, priority: 'high' },
    ],
    graduation: [{ title: 'Order graduation announcements', category: 'guests', daysBeforeEvent: 60, priority: 'medium' }],
    corporate: [
      { title: 'Prepare agenda and speaker schedule', category: 'planning', daysBeforeEvent: 45, priority: 'high' },
      { title: 'Arrange AV and Wi-Fi with the venue', category: 'venue', daysBeforeEvent: 21, priority: 'high' },
    ],
    birthday: [{ title: 'Order the birthday cake', category: 'food', daysBeforeEvent: 7, priority: 'medium' }],
    baby_shower: [{ title: 'Create a gift registry link for guests', category: 'guests', daysBeforeEvent: 45, priority: 'medium' }],
  };

  const extra = typeSpecific[eventType] ?? [];
  const bigGuestNote = guestCount > 80
    ? [{ title: 'Arrange guest parking, transport or shuttle', category: 'venue', daysBeforeEvent: 30, priority: 'medium' as const }]
    : [];
  return [...tasks, ...extra, ...bigGuestNote];
}

export function generateRulePlan(input: PlanInput): EventPlan {
  const split = BASE_SPLIT[input.eventType];
  const perGuest = input.guestCount > 0 ? input.totalBudget / input.guestCount : 0;
  const adjustedSplit: Split = { ...split };
  const explanation: string[] = [];

  if (perGuest < MIN_COMFORTABLE_PER_GUEST[input.eventType]) {
    adjustedSplit.food += 5;
    adjustedSplit.decoration -= 5;
    explanation.push('Your budget per guest is lean, so 5 percentage points moved from decoration to food to keep guests well fed.');
  }

  const allocation = allocateBudget(input.totalBudget, adjustedSplit);
  for (const category of BUDGET_CATEGORIES) {
    explanation.push(
      `${BUDGET_CATEGORY_LABELS[category]} is a ${adjustedSplit[category]}% target share of your budget, based on what a ${EVENT_TYPE_LABELS[input.eventType].toLowerCase()} usually needs most. It is not a supplier price.`,
    );
  }
  const feasibility = getFeasibility(input, perGuest);
  const preferences = `${input.theme} ${input.preferences}`;
  const notes = PREFERENCE_NOTES.filter((rule) => rule.keywords.test(preferences));
  const notesFor = (section: NoteSection) => notes.filter((rule) => rule.section === section).map((rule) => rule.note);

  const alternatives = [
    'Hosting at a home, community hall or friend\'s space can free a large share of the budget.',
    'Choosing a weekday or off-season date often reduces venue and catering costs.',
    'Ask guests to contribute to a shared dish or drink to trim catering costs.',
  ];
  if (feasibility.status === 'unrealistic') {
    alternatives.unshift('Reduce the guest count or split the event into a smaller core celebration and a later informal gathering.');
  }

  const theme = THEMES[input.eventType];
  return {
    source: 'rule_based',
    generatedAt: new Date().toISOString(),
    theme: {
      name: input.theme.trim() || theme.name,
      description: theme.description,
      palette: theme.palette,
    },
    feasibility,
    venue: {
      requirements: [...VENUE_REQUIREMENTS[input.eventType], ...notesFor('venue')],
      sizingNote: `Look for a space comfortably fitting ${input.guestCount} guests, with a little extra room for seating and movement.`,
    },
    decorations: DECORATIONS[input.eventType],
    food: [...FOOD[input.eventType], ...notesFor('food')],
    entertainment: [...ENTERTAINMENT[input.eventType], ...notesFor('entertainment')],
    budgetAllocation: allocation,
    budgetExplanation: explanation,
    costSavingAlternatives: alternatives,
    tasks: buildTasks(input.eventType, input.guestCount),
    disclaimer: 'Rule-based plan. Budget shares and timings are planning guidelines only. Venue availability and supplier prices are not checked and must be confirmed directly with providers.',
  };
}


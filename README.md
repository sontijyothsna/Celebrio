# Celebrio - Smart Celebration & Event Planner

Celebrio helps people plan celebrations and events (weddings, birthdays, anniversaries, corporate events and more) from one place. It turns a short event brief into a themed plan with a budget split, a preparation checklist and a guest list, and keeps the budget, guests and tasks up to date as the event approaches.

## Vertical

Celebration and event planning for individuals and small organisers. The focus is on practical, budget-aware planning: what to book, how to split the money, who has replied, and what needs doing by when.

## Approach

- **AI-assisted planning with a safe fallback.** The planner asks Google Gemini for a plan through a server-side function, so the API key never reaches the browser. If the AI is unavailable, returns invalid data or is not configured, the app builds a rule-based plan instead. The fallback is labelled as rule-based everywhere it appears and is never presented as AI output.
- **Estimates, not quotes.** Costs are planning estimates derived from rules of thumb. The app does not check venue availability or supplier prices, and it says so in the plan.
- **Budget feasibility.** Each plan compares the budget per guest with a minimum for the event type and reports whether the budget is comfortable, tight or unrealistic.
- **Shared, single-tenant data.** There is no sign-in. All data is shared within the deployment.

## Architecture

Layers, from the top down:

1. **Pages** (`src/pages`): one page per feature (Dashboard, AI Event Planner, My Events, Budget Manager, Guest Management, Task Checklist, Settings).
2. **Components** (`src/components`): layout shell (sidebar, top bar with notifications), shared UI primitives (buttons, cards, form fields, modal, loading/empty/error states), and feature components (event form, plan view, budget dialog).
3. **Context and hooks** (`src/context`, `src/hooks`): settings (currency, display name), the selected event, and a data-loading hook.
4. **Services** (`src/services`): all Supabase reads and writes and the AI call. Pages never talk to the database directly.
5. **Domain logic** (`src/lib`): pure functions for budgets, guests, task urgency, date handling, currency formatting, validation, and the rule-based planner (`src/lib/planner`).
6. **Supabase**: Postgres tables for events, guests, tasks, budget items and activity, plus the `save_event_with_plan` function that saves an event and its plan in one step.
7. **Edge function** (`supabase/functions/event-plan`): validates the request, calls Gemini with the server-side key, and returns the plan as JSON.

## Functionality

- **Dashboard**: total events, upcoming events, total planned budget and pending tasks; upcoming event cards; recent activity.
- **AI Event Planner**: collects event type, date, location, guest count, total budget, theme and preferences; validates the input; generates a plan (theme, venue requirements, decorations, food and catering, entertainment, budget allocation, checklist); saves the event and plan.
- **My Events**: list of events, switch the active event, edit and delete.
- **Budget Manager**: estimated and actual cost per line, category totals, overspend warnings, cost-saving suggestions, add/edit/remove lines.
- **Guest Management**: add, edit and remove guests with contact details; RSVP status (pending, accepted, declined); search; headcount including plus-ones and response rate.
- **Task Checklist**: event-specific tasks with deadlines counted back from the event date; custom tasks; complete/reopen; filters for open, urgent, completed and all; overdue and due-soon tasks are prioritised and shown in notifications.
- **Settings**: display name and display currency (USD, EUR, GBP, CAD, AUD, INR, JPY), stored in the browser.

Every list has loading, empty and error states, and every form validates its input before saving.

## Setup

Requirements: Node.js 18 or later and npm.

1. Install dependencies: `npm install`
2. Create a `.env` file in the project root with:
   - `VITE_SUPABASE_URL` - the project URL of your Supabase project
   - `VITE_SUPABASE_ANON_KEY` - the public anon key of your Supabase project
3. Start the development server: `npm run dev`
4. Build for production: `npm run build`
5. Run the unit tests: `npm test`

Optional, for real AI plans: add a `GEMINI_API_KEY` secret to the Supabase project's edge functions. Without it, the planner uses the labelled rule-based fallback. The key must only be stored as a Supabase secret, never in `.env` files committed to the repository or in client code.

## Testing

Unit tests (Vitest) cover:
- planner input validation
- budget allocation (the category amounts add up exactly to the total)
- rule-based plan feasibility
- AI plan parsing, including rejection of incomplete data and rescaling to the user's budget
- budget summaries and cost-saving suggestions
- task urgency and sorting
- guest headcount and response statistics

## Assumptions and limitations

- **No sign-in.** The app is single-tenant: anyone with the URL can read and change the shared data. Row-level security policies allow the anon role for this reason. Adding accounts would require ownership columns and per-user policies.
- **Estimates only.** Budget figures are rule-of-thumb estimates. The app does not check venue availability, supplier prices or local regulations.
- **AI is optional.** Without a Gemini key, every plan is rule-based and labelled as such.
- **Dates** are stored as calendar dates (no time zone), so deadlines do not shift with the user's time zone.
- **Currency** is for display only; amounts are not converted between currencies.

# Project memory

## Product intent & audience

- **Celebrio**: an event planning application with AI-powered planning features
- Users interact through a web UI; AI planning is surfaced as event plans with clear labeling (AI vs rule-based)
- Target users: people planning events who want AI-assisted planning

## Brand personality & voice

- Reassuring, safety-first tone regarding credentials
- Clear, step-by-step guidance with concise explanations
- User-facing copy emphasizes transparency (e.g., badges distinguishing AI vs rule-based plans)

## Visual design & UX direction

- AI-generated plans display an "AI" badge to distinguish from rule-based fallback plans
- Rule-based fallback plans are clearly labeled when AI is unavailable
- No explicit color, typography, or layout details inferred yet

## Decisions, constraints & rationale

- **Tech stack**: Vite + React frontend, Supabase backend with Edge Functions
- **AI provider**: Google Gemini via API key stored as Supabase Edge Function secret named `GEMINI_API_KEY`
- **Security constraint**: API key must never be exposed to the browser or committed to files/chat; stored server-side in Supabase only
- **Fallback architecture**: Planner uses rule-based fallback when Gemini key is missing, invalid, or AI service fails — no hard failure
- **No-redeploy design**: Edge Functions pick up secrets on next request; no redeployment needed when adding the key
- Planner has two modes: AI-powered (Gemini) and rule-based fallback

## Open questions & assumptions

- Exact structure/schema of event plans (AI and rule-based) not yet defined
- Which Edge Function endpoint handles the Gemini requests — name unknown
- What "test an AI plan" entails (specific verification steps) — not yet detailed
- Supabase project URL/reference not confirmed
- Whether there are other AI-powered features beyond event planning is unknown
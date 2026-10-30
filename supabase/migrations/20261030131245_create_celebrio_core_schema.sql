/*
# Create Celebrio core schema

Plain-English summary: adds the tables that store events, guests, tasks, budget lines and an activity feed for the Celebrio planner. Also adds one atomic database function that saves a new event together with its budget lines and generated tasks in a single step.

1. New Tables
- `events`: one row per celebration (name, type, date, location, guest count, total budget, theme, preferences, and the saved plan as JSON).
- `guests`: people invited to an event, with contact details and RSVP status (pending, accepted, declined).
- `tasks`: preparation checklist items with due dates, priority and completion state.
- `budget_items`: budget lines per category (venue, food, decoration, entertainment, miscellaneous) with estimated and actual cost.
- `activity_log`: short feed of recent changes shown on the dashboard.

2. Functions
- `save_event_with_plan(p_event, p_budget, p_tasks)`: inserts an event, its budget lines, its tasks and an activity entry in one transaction. Runs with the caller's rights.

3. Security
- Row Level Security is enabled on every new table.
- The app has no sign-in screen, so the anon and authenticated roles receive the same access. Policies are written as explicit per-verb policies. Data is intentionally shared across visitors of this deployment.
- EXECUTE on the save function is granted to anon and authenticated only.

4. Important notes
- Numbered sections above describe the full change set.
- Every statement is idempotent (IF NOT EXISTS, DROP POLICY IF EXISTS, CREATE OR REPLACE).
- No existing data is modified or removed.
*/

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  event_type text NOT NULL CHECK (event_type IN ('birthday','wedding','anniversary','graduation','baby_shower','corporate','other')),
  event_date date NOT NULL,
  location text NOT NULL DEFAULT '' CHECK (char_length(location) <= 200),
  guest_count integer NOT NULL DEFAULT 0 CHECK (guest_count BETWEEN 0 AND 100000),
  total_budget numeric(12,2) NOT NULL DEFAULT 0 CHECK (total_budget >= 0),
  theme text NOT NULL DEFAULT '' CHECK (char_length(theme) <= 200),
  preferences text NOT NULL DEFAULT '' CHECK (char_length(preferences) <= 2000),
  plan jsonb,
  plan_source text CHECK (plan_source IN ('ai','rule_based')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  email text NOT NULL DEFAULT '' CHECK (char_length(email) <= 200),
  phone text NOT NULL DEFAULT '' CHECK (char_length(phone) <= 40),
  rsvp_status text NOT NULL DEFAULT 'pending' CHECK (rsvp_status IN ('pending','accepted','declined')),
  plus_ones integer NOT NULL DEFAULT 0 CHECK (plus_ones BETWEEN 0 AND 20),
  notes text NOT NULL DEFAULT '' CHECK (char_length(notes) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  category text NOT NULL DEFAULT 'general' CHECK (char_length(category) <= 60),
  due_date date,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  source text NOT NULL DEFAULT 'custom' CHECK (source IN ('generated','custom')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS budget_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('venue','food','decoration','entertainment','miscellaneous')),
  description text NOT NULL CHECK (char_length(description) BETWEEN 1 AND 200),
  estimated_cost numeric(12,2) NOT NULL DEFAULT 0 CHECK (estimated_cost >= 0),
  actual_cost numeric(12,2) CHECK (actual_cost IS NULL OR actual_cost >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 300),
  kind text NOT NULL DEFAULT 'info' CHECK (char_length(kind) <= 40),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guests_event_id ON guests(event_id);
CREATE INDEX IF NOT EXISTS idx_tasks_event_id ON tasks(event_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_budget_items_event_id ON budget_items(event_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON events TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON guests TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON tasks TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON budget_items TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON activity_log TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_events" ON events;
CREATE POLICY "anon_select_events" ON events FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_events" ON events;
CREATE POLICY "anon_insert_events" ON events FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_events" ON events;
CREATE POLICY "anon_update_events" ON events FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_events" ON events;
CREATE POLICY "anon_delete_events" ON events FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_guests" ON guests;
CREATE POLICY "anon_select_guests" ON guests FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_guests" ON guests;
CREATE POLICY "anon_insert_guests" ON guests FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_guests" ON guests;
CREATE POLICY "anon_update_guests" ON guests FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_guests" ON guests;
CREATE POLICY "anon_delete_guests" ON guests FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_tasks" ON tasks;
CREATE POLICY "anon_select_tasks" ON tasks FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_tasks" ON tasks;
CREATE POLICY "anon_insert_tasks" ON tasks FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_tasks" ON tasks;
CREATE POLICY "anon_update_tasks" ON tasks FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_tasks" ON tasks;
CREATE POLICY "anon_delete_tasks" ON tasks FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_budget_items" ON budget_items;
CREATE POLICY "anon_select_budget_items" ON budget_items FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_budget_items" ON budget_items;
CREATE POLICY "anon_insert_budget_items" ON budget_items FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_budget_items" ON budget_items;
CREATE POLICY "anon_update_budget_items" ON budget_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_budget_items" ON budget_items;
CREATE POLICY "anon_delete_budget_items" ON budget_items FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_activity_log" ON activity_log;
CREATE POLICY "anon_select_activity_log" ON activity_log FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_activity_log" ON activity_log;
CREATE POLICY "anon_insert_activity_log" ON activity_log FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_activity_log" ON activity_log;
CREATE POLICY "anon_update_activity_log" ON activity_log FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_activity_log" ON activity_log;
CREATE POLICY "anon_delete_activity_log" ON activity_log FOR DELETE TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION save_event_with_plan(p_event jsonb, p_budget jsonb, p_tasks jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_event_id uuid;
BEGIN
  INSERT INTO events (name, event_type, event_date, location, guest_count, total_budget, theme, preferences, plan, plan_source)
  VALUES (
    p_event->>'name',
    p_event->>'event_type',
    (p_event->>'event_date')::date,
    COALESCE(p_event->>'location', ''),
    (p_event->>'guest_count')::integer,
    (p_event->>'total_budget')::numeric,
    COALESCE(p_event->>'theme', ''),
    COALESCE(p_event->>'preferences', ''),
    p_event->'plan',
    p_event->>'plan_source'
  )
  RETURNING id INTO v_event_id;

  INSERT INTO budget_items (event_id, category, description, estimated_cost)
  SELECT v_event_id, b->>'category', b->>'description', (b->>'estimated_cost')::numeric
  FROM jsonb_array_elements(COALESCE(p_budget, '[]'::jsonb)) AS b;

  INSERT INTO tasks (event_id, title, category, due_date, priority, source)
  SELECT v_event_id, t->>'title', COALESCE(t->>'category', 'general'), NULLIF(t->>'due_date', '')::date, COALESCE(t->>'priority', 'medium'), 'generated'
  FROM jsonb_array_elements(COALESCE(p_tasks, '[]'::jsonb)) AS t;

  INSERT INTO activity_log (event_id, message, kind)
  VALUES (v_event_id, 'Created event "' || (p_event->>'name') || '"', 'event_created');

  RETURN v_event_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION save_event_with_plan(jsonb, jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION save_event_with_plan(jsonb, jsonb, jsonb) TO anon, authenticated;

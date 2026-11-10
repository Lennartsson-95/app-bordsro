ALTER TABLE public.profiles ADD COLUMN height_cm integer CHECK (height_cm BETWEEN 100 AND 250), ADD COLUMN weight_kg numeric(5,1) CHECK (weight_kg BETWEEN 30 AND 300), ADD COLUMN target_weight_kg numeric(5,1) CHECK (target_weight_kg BETWEEN 30 AND 300);
CREATE TABLE public.workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day date NOT NULL,
  kind text NOT NULL CHECK (char_length(kind) BETWEEN 1 AND 80),
  minutes integer NOT NULL CHECK (minutes BETWEEN 5 AND 600),
  intensity text NOT NULL CHECK (intensity IN ('light','hard')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX workouts_user_day ON public.workouts(user_id, day);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workouts TO authenticated;
GRANT ALL ON public.workouts TO service_role;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own workouts read" ON public.workouts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own workouts insert" ON public.workouts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own workouts delete" ON public.workouts FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE OR REPLACE FUNCTION public.create_signup_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p jsonb;
BEGIN
 p := NEW.raw_user_meta_data -> 'onboarding';
 INSERT INTO public.profiles (id, display_name, goal, diet, allergies, activity, wake_time, sleep_time, height_cm, weight_kg, target_weight_kg, completed)
 VALUES (NEW.id, coalesce(p->>'display_name',''), p->>'goal', coalesce(p->>'diet','mixed'), coalesce(p->>'allergies',''), coalesce(p->>'activity','moderate'), coalesce(p->>'wake_time','07:00'), coalesce(p->>'sleep_time','22:00'),
   CASE WHEN (p->>'height_cm') ~ '^\d{3}$' AND (p->>'height_cm')::int BETWEEN 100 AND 250 THEN (p->>'height_cm')::int END,
   CASE WHEN (p->>'weight_kg') ~ '^\d{2,3}(\.\d)?$' AND (p->>'weight_kg')::numeric BETWEEN 30 AND 300 THEN (p->>'weight_kg')::numeric END,
   CASE WHEN (p->>'target_weight_kg') ~ '^\d{2,3}(\.\d)?$' AND (p->>'target_weight_kg')::numeric BETWEEN 30 AND 300 THEN (p->>'target_weight_kg')::numeric END,
   p->>'goal' IS NOT NULL AND char_length(coalesce(p->>'display_name','')) > 0);
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.create_signup_profile() FROM PUBLIC, anon, authenticated;
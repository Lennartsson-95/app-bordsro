ALTER TABLE public.profiles
  ADD COLUMN age smallint CHECK (age BETWEEN 13 AND 100),
  ADD COLUMN sex text CHECK (sex IN ('woman','man','other','prefer_not_to_say'));

CREATE OR REPLACE FUNCTION public.create_signup_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p jsonb;
BEGIN
 p := NEW.raw_user_meta_data -> 'onboarding';
 INSERT INTO public.profiles (id, display_name, goal, diet, allergies, activity, wake_time, sleep_time, height_cm, weight_kg, target_weight_kg, age, sex, completed)
 VALUES (NEW.id, coalesce(p->>'display_name',''), p->>'goal', coalesce(p->>'diet','mixed'), coalesce(p->>'allergies',''), coalesce(p->>'activity','moderate'), coalesce(p->>'wake_time','07:00'), coalesce(p->>'sleep_time','22:00'),
   CASE WHEN (p->>'height_cm') ~ '^\d{3}$' AND (p->>'height_cm')::int BETWEEN 100 AND 250 THEN (p->>'height_cm')::int END,
   CASE WHEN (p->>'weight_kg') ~ '^\d{2,3}(\.\d)?$' AND (p->>'weight_kg')::numeric BETWEEN 30 AND 300 THEN (p->>'weight_kg')::numeric END,
   CASE WHEN (p->>'target_weight_kg') ~ '^\d{2,3}(\.\d)?$' AND (p->>'target_weight_kg')::numeric BETWEEN 30 AND 300 THEN (p->>'target_weight_kg')::numeric END,
   CASE WHEN (p->>'age') ~ '^\d{2,3}$' AND (p->>'age')::int BETWEEN 13 AND 100 THEN (p->>'age')::smallint END,
   CASE WHEN p->>'sex' IN ('woman','man','other','prefer_not_to_say') THEN p->>'sex' END,
   p->>'goal' IS NOT NULL AND char_length(coalesce(p->>'display_name','')) > 0);
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.create_signup_profile() FROM PUBLIC, anon, authenticated;
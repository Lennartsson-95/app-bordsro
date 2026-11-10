CREATE TABLE public.profiles (
 id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 display_name text NOT NULL DEFAULT '' CHECK (char_length(display_name) <= 80),
 goal text CHECK (goal IN ('lose','maintain','gain')),
 diet text NOT NULL DEFAULT 'mixed' CHECK (diet IN ('mixed','vegetarian','vegan','pescatarian')),
 allergies text NOT NULL DEFAULT '' CHECK (char_length(allergies) <= 500),
 activity text NOT NULL DEFAULT 'moderate' CHECK (activity IN ('low','moderate','high')),
 wake_time text NOT NULL DEFAULT '07:00' CHECK (wake_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
 sleep_time text NOT NULL DEFAULT '22:00' CHECK (sleep_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
 completed boolean NOT NULL DEFAULT false
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Create own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE FUNCTION public.create_signup_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p jsonb;
BEGIN
 p := NEW.raw_user_meta_data -> 'onboarding';
 INSERT INTO public.profiles (id, display_name, goal, diet, allergies, activity, wake_time, sleep_time, completed)
 VALUES (NEW.id, coalesce(p->>'display_name',''), p->>'goal', coalesce(p->>'diet','mixed'), coalesce(p->>'allergies',''), coalesce(p->>'activity','moderate'), coalesce(p->>'wake_time','07:00'), coalesce(p->>'sleep_time','22:00'), p->>'goal' IS NOT NULL AND char_length(coalesce(p->>'display_name','')) > 0);
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.create_signup_profile() FROM PUBLIC;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_signup_profile();
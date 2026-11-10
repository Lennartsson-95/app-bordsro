CREATE TABLE public.daily_meals (
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 day date NOT NULL,
 slot text NOT NULL CHECK (slot IN ('breakfast','snack1','lunch','snack2','dinner','evening')),
 eaten boolean NOT NULL DEFAULT false,
 choice smallint NOT NULL DEFAULT 0 CHECK (choice BETWEEN 0 AND 1),
 PRIMARY KEY (user_id, day, slot)
);
GRANT SELECT, INSERT, UPDATE ON public.daily_meals TO authenticated;
GRANT ALL ON public.daily_meals TO service_role;
ALTER TABLE public.daily_meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own meals" ON public.daily_meals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Insert own meals" ON public.daily_meals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own meals" ON public.daily_meals FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
ALTER TABLE public.profiles ADD COLUMN reminders_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN reminder_lead smallint NOT NULL DEFAULT 0 CHECK (reminder_lead IN (0,5,15));
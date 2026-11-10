CREATE TABLE public.shopping_checks (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  item text NOT NULL CHECK (char_length(item) BETWEEN 1 AND 120),
  PRIMARY KEY (user_id, week_start, item)
);
GRANT SELECT, INSERT, DELETE ON public.shopping_checks TO authenticated;
GRANT ALL ON public.shopping_checks TO service_role;
ALTER TABLE public.shopping_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own checks read" ON public.shopping_checks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own checks insert" ON public.shopping_checks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own checks delete" ON public.shopping_checks FOR DELETE TO authenticated USING (auth.uid() = user_id);
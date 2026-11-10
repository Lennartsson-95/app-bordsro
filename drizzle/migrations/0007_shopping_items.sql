CREATE TABLE public.shopping_items (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  item text NOT NULL CHECK (char_length(item) BETWEEN 1 AND 120),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, week_start, item)
);
GRANT SELECT, INSERT, DELETE ON public.shopping_items TO authenticated;
GRANT ALL ON public.shopping_items TO service_role;
ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own shopping items read" ON public.shopping_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own shopping items insert" ON public.shopping_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own shopping items delete" ON public.shopping_items FOR DELETE TO authenticated USING (auth.uid() = user_id);
ALTER TABLE public.daily_meals ADD COLUMN added boolean NOT NULL DEFAULT false;
UPDATE public.daily_meals SET added = true;
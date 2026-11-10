ALTER TABLE public.daily_meals DROP CONSTRAINT daily_meals_choice_check;
ALTER TABLE public.daily_meals ADD CONSTRAINT daily_meals_choice_check CHECK (choice BETWEEN 0 AND 9);